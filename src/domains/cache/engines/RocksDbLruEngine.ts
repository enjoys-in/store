import { ICacheEngine } from '../engine';
import { IRocksDbCacheConfig } from '../types';

export interface IRocksDbClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  keys(): Promise<string[]>; 
}

class CacheKeyNode {
  key: string;
  expiresAt?: number;
  prev: CacheKeyNode | null = null;
  next: CacheKeyNode | null = null;

  constructor(key: string, expiresAt?: number) {
    this.key = key;
    this.expiresAt = expiresAt;
  }
}

class RWLock {
  public activeReaders = 0;
  public activeWriter = false;
  private readQueue: Array<() => void> = [];
  private writeQueue: Array<() => void> = [];

  async readLock(): Promise<void> {
    if (this.activeWriter || this.writeQueue.length > 0) {
      await new Promise<void>(resolve => this.readQueue.push(resolve));
    }
    this.activeReaders++;
  }

  readUnlock(): void {
    this.activeReaders--;
    if (this.activeReaders === 0 && this.writeQueue.length > 0) {
      const resolve = this.writeQueue.shift()!;
      this.activeWriter = true;
      resolve();
    }
  }

  async writeLock(): Promise<void> {
    if (this.activeWriter || this.activeReaders > 0) {
      await new Promise<void>(resolve => this.writeQueue.push(resolve));
    } else {
      this.activeWriter = true;
    }
  }

  writeUnlock(): void {
    this.activeWriter = false;
    if (this.readQueue.length > 0) {
      const resolves = this.readQueue;
      this.readQueue = [];
      this.activeReaders += resolves.length;
      for (const r of resolves) r();
    } else if (this.writeQueue.length > 0) {
      const resolve = this.writeQueue.shift()!;
      this.activeWriter = true;
      resolve();
    }
  }

  isFree(): boolean {
    return this.activeReaders === 0 && !this.activeWriter && this.readQueue.length === 0 && this.writeQueue.length === 0;
  }
}

class KeyRWLockManager {
  private locks = new Map<string, RWLock>();
  
  getLock(key: string): RWLock {
    let lock = this.locks.get(key);
    if (!lock) {
      lock = new RWLock();
      this.locks.set(key, lock);
    }
    return lock;
  }

  cleanup(key: string): void {
    const lock = this.locks.get(key);
    if (lock && lock.isFree()) {
      this.locks.delete(key);
    }
  }
}

export class RocksDbLruEngine implements ICacheEngine {
  private capacity: number;
  private client: IRocksDbClient;
  private cacheMap: Map<string, CacheKeyNode>;
  private head: CacheKeyNode | null = null;
  private tail: CacheKeyNode | null = null;
  private initialized: boolean = false;
  private dispose?: (key: string, value: any) => void;
  private pruneIntervalId?: NodeJS.Timeout;
  private lockManager = new KeyRWLockManager();

  constructor(config: IRocksDbCacheConfig, client: IRocksDbClient) {
    this.capacity = config.maxSize;
    this.dispose = config.dispose;
    this.client = client;
    this.cacheMap = new Map();

    if (config.pruneIntervalMs) {
      this.pruneIntervalId = setInterval(() => this.prune(), config.pruneIntervalMs);
      if (this.pruneIntervalId.unref) {
        this.pruneIntervalId.unref(); 
      }
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    
    const keys = await this.client.keys();
    for (const key of keys) {
      const node = new CacheKeyNode(key);
      this.addToFront(node);
      this.cacheMap.set(key, node);
      
      if (this.cacheMap.size > this.capacity && this.tail) {
        await this.evict(this.tail);
      }
    }
    this.initialized = true;
  }

  private removeNode(node: CacheKeyNode) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
    
    node.prev = null;
    node.next = null;
  }

  private addToFront(node: CacheKeyNode) {
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
  }

  private moveToFront(node: CacheKeyNode) {
    this.removeNode(node);
    this.addToFront(node);
  }

  private async evict(node: CacheKeyNode): Promise<void> {
    const lock = this.lockManager.getLock(node.key);
    await lock.writeLock();
    try {
      this.cacheMap.delete(node.key);
      this.removeNode(node);
      
      let parsedValue = null;
      if (this.dispose) {
        const raw = await this.client.get(node.key);
        if (raw) {
          try {
            parsedValue = JSON.parse(raw);
          } catch {
            parsedValue = raw;
          }
        }
      }
      
      await this.client.del(node.key);
      
      if (this.dispose && parsedValue !== null) {
        this.dispose(node.key, parsedValue);
      }
    } finally {
      lock.writeUnlock();
      this.lockManager.cleanup(node.key);
    }
  }

  private async prune(): Promise<void> {
    const now = Date.now();
    let current = this.tail;
    while (current) {
      const prev = current.prev;
      if (current.expiresAt && now > current.expiresAt) {
        await this.evict(current);
      }
      current = prev;
    }
  }

  async get(key: string): Promise<any> {
    if (!this.initialized) await this.init();

    let needsEvict = false;
    let nodeToEvict: CacheKeyNode | null = null;
    
    const lock = this.lockManager.getLock(key);
    await lock.readLock();
    try {
      const node = this.cacheMap.get(key);
      if (!node) {
        return null;
      }

      if (node.expiresAt && Date.now() > node.expiresAt) {
        needsEvict = true;
        nodeToEvict = node;
      } else {
        this.moveToFront(node);
        const value = await this.client.get(key);
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
    } finally {
      lock.readUnlock();
      this.lockManager.cleanup(key);
    }
    
    if (needsEvict && nodeToEvict) {
      await this.evict(nodeToEvict);
    }
    return null;
  }

  async peek(key: string): Promise<any> {
    if (!this.initialized) await this.init();

    let needsEvict = false;
    let nodeToEvict: CacheKeyNode | null = null;

    const lock = this.lockManager.getLock(key);
    await lock.readLock();
    try {
      const node = this.cacheMap.get(key);
      if (!node) {
        return null;
      }

      if (node.expiresAt && Date.now() > node.expiresAt) {
        needsEvict = true;
        nodeToEvict = node;
      } else {
        const value = await this.client.get(key);
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
    } finally {
      lock.readUnlock();
      this.lockManager.cleanup(key);
    }

    if (needsEvict && nodeToEvict) {
      await this.evict(nodeToEvict);
    }
    return null;
  }

  async has(key: string): Promise<boolean> {
    if (!this.initialized) await this.init();
    
    const lock = this.lockManager.getLock(key);
    await lock.readLock();
    try {
      const node = this.cacheMap.get(key);
      if (!node) return false;
      
      if (node.expiresAt && Date.now() > node.expiresAt) {
        return false; // don't evict here, we just say false
      }
      return true;
    } finally {
      lock.readUnlock();
      this.lockManager.cleanup(key);
    }
  }

  async set(key: string, value: any, ttlMs?: number): Promise<void> {
    if (!this.initialized) await this.init();

    const lock = this.lockManager.getLock(key);
    await lock.writeLock();
    try {
      const expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
      const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value);

      if (this.cacheMap.has(key)) {
        const node = this.cacheMap.get(key)!;
        node.expiresAt = expiresAt;
        this.moveToFront(node);
        await this.client.put(key, stringifiedValue);
      } else {
        const newNode = new CacheKeyNode(key, expiresAt);
        
        if (this.cacheMap.size >= this.capacity && this.tail) {
          // don't await prune/evict here directly if they lock keys!
          // actually evict takes writeLock. Is it safe to await evict here? Yes, tail is different key!
          // unless tail IS this key, but it's new, so it's not.
          await this.prune();
          
          if (this.cacheMap.size >= this.capacity && this.tail) {
            await this.evict(this.tail);
          }
        }
        
        this.addToFront(newNode);
        this.cacheMap.set(key, newNode);
        await this.client.put(key, stringifiedValue);
      }
    } finally {
      lock.writeUnlock();
      this.lockManager.cleanup(key);
    }
  }

  async setNX(key: string, value: any, ttlMs?: number): Promise<boolean> {
    if (!this.initialized) await this.init();

    const lock = this.lockManager.getLock(key);
    await lock.writeLock();
    try {
      const existing = this.cacheMap.get(key);
      if (existing) {
        if (!existing.expiresAt || Date.now() <= existing.expiresAt) {
          return false;
        }
        // It's expired, so we can overwrite it.
        // `evict` would normally handle it, but we can just overwrite.
        // Wait, if we overwrite, we just update the existing node.
        const expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
        existing.expiresAt = expiresAt;
        this.moveToFront(existing);
        const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value);
        await this.client.put(key, stringifiedValue);
        return true;
      }

      // Doesn't exist, set it
      const expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
      const newNode = new CacheKeyNode(key, expiresAt);
      
      if (this.cacheMap.size >= this.capacity && this.tail) {
        await this.prune();
        
        if (this.cacheMap.size >= this.capacity && this.tail) {
          await this.evict(this.tail);
        }
      }
      
      this.addToFront(newNode);
      this.cacheMap.set(key, newNode);
      const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.put(key, stringifiedValue);
      return true;
    } finally {
      lock.writeUnlock();
      this.lockManager.cleanup(key);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.initialized) await this.init();

    const node = this.cacheMap.get(key);
    if (node) {
      await this.evict(node);
    }
  }

  async clear(): Promise<void> {
    if (!this.initialized) await this.init();

    const nodes = [];
    let current = this.tail;
    while (current) {
      nodes.push(current);
      current = current.prev;
    }

    for (const node of nodes) {
      await this.evict(node);
    }
    
    // Any nodes added during evict loop will NOT be cleared from DB by the loop,
    // so we shouldn't just forcefully clear the map/head/tail at the end, 
    // because `evict` already removed the ones it processed!
    // The map is naturally cleared by `evict`.
  }

  async size(): Promise<number> {
    if (!this.initialized) await this.init();
    return this.cacheMap.size;
  }

  // --- Hash Operations ---
  async hset(key: string, field: string, value: any): Promise<void> {
    if (!this.initialized) await this.init();
    const lock = this.lockManager.getLock(key);
    await lock.writeLock();
    try {
      let data: any = {};
      const node = this.cacheMap.get(key);
      if (node && (!node.expiresAt || Date.now() <= node.expiresAt)) {
        const raw = await this.client.get(key);
        if (raw) {
          try { data = JSON.parse(raw); } catch {}
        }
      }
      
      if (typeof data !== 'object' || Array.isArray(data) || data === null) {
        data = {};
      }
      data[field] = value;
      
      const stringifiedValue = JSON.stringify(data);
      if (node) {
        this.moveToFront(node);
        await this.client.put(key, stringifiedValue);
      } else {
        const newNode = new CacheKeyNode(key);
        if (this.cacheMap.size >= this.capacity && this.tail) {
          await this.prune();
          if (this.cacheMap.size >= this.capacity && this.tail) {
            await this.evict(this.tail);
          }
        }
        this.addToFront(newNode);
        this.cacheMap.set(key, newNode);
        await this.client.put(key, stringifiedValue);
      }
    } finally {
      lock.writeUnlock();
      this.lockManager.cleanup(key);
    }
  }

  async hget(key: string, field: string): Promise<any> {
    const data = await this.get(key);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return data[field] !== undefined ? data[field] : null;
  }

  async hdel(key: string, field: string): Promise<void> {
    if (!this.initialized) await this.init();
    const lock = this.lockManager.getLock(key);
    await lock.writeLock();
    try {
      const node = this.cacheMap.get(key);
      if (!node || (node.expiresAt && Date.now() > node.expiresAt)) return;
      
      let data: any = {};
      const raw = await this.client.get(key);
      if (raw) {
        try { data = JSON.parse(raw); } catch { return; }
      }
      
      if (typeof data !== 'object' || Array.isArray(data) || data === null) {
        return;
      }
      delete data[field];
      
      this.moveToFront(node);
      await this.client.put(key, JSON.stringify(data));
    } finally {
      lock.writeUnlock();
      this.lockManager.cleanup(key);
    }
  }
}

