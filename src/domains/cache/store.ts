import { ICache } from './types';
import { ICacheEngine } from './engine';
import { ListStoreImpl } from './list/store';
import { IList } from './list/types';
import { SetStoreImpl } from './set/store';
import { ISet } from './set/types';
import { SortedSetStoreImpl } from './sortedSet/store';
import { ISortedSet } from './sortedSet/types';

export class CacheStoreImpl<T> implements ICache<T> {
  constructor(private engine: ICacheEngine, private namespace: string = '') {}
  
  private key(k: string) {
    return this.namespace ? `${this.namespace}:${k}` : k;
  }

  async get(key: string): Promise<T | null> {
    return this.engine.get(this.key(key));
  }

  async set(key: string, value: T, ttlMs?: number): Promise<void> {
    return this.engine.set(this.key(key), value, ttlMs);
  }

  async setNX(key: string, value: T, ttlMs?: number): Promise<boolean> {
    if (this.engine.setNX) {
      return this.engine.setNX(this.key(key), value, ttlMs);
    }
    // Fallback if the engine doesn't support setNX natively
    const exists = await this.has(key);
    if (!exists) {
      await this.set(key, value, ttlMs);
      return true;
    }
    return false;
  }

  async del(key: string): Promise<void> {
    return this.engine.del(this.key(key));
  }

  async peek(key: string): Promise<T | null> {
    return this.engine.peek ? this.engine.peek(this.key(key)) : this.engine.get(this.key(key));
  }

  async has(key: string): Promise<boolean> {
    if (this.engine.has) {
      return this.engine.has(this.key(key));
    }
    const val = await this.peek(key);
    return val !== null;
  }

  async clear(): Promise<void> {
    if (this.engine.clear) {
      return this.engine.clear();
    }
  }

  async size(): Promise<number> {
    if (this.engine.size) {
      return this.engine.size();
    }
    return 0;
  }

  getList<U = T>(key: string): IList<U> {
    if (this.engine.getListEngine) {
      return new ListStoreImpl<U>(this.engine.getListEngine(), this.namespace, key);
    }
    throw new Error('getList is not supported by this cache engine');
  }

  getSet<U = T>(key: string): ISet<U> {
    if (this.engine.getSetEngine) {
      return new SetStoreImpl<U>(this.engine.getSetEngine(), this.namespace, key);
    }
    throw new Error('getSet is not supported by this cache engine');
  }

  getSortedSet<U = T>(key: string): ISortedSet<U> {
    if (this.engine.getSortedSetEngine) {
      return new SortedSetStoreImpl<U>(this.engine.getSortedSetEngine(), this.namespace, key);
    }
    throw new Error('getSortedSet is not supported by this cache engine');
  }

  async setBit(key: string, offset: number, value: number): Promise<number> {
    if (this.engine.setBit) {
      return this.engine.setBit(this.key(key), offset, value);
    }
    throw new Error('setBit is not supported by this cache engine');
  }

  async getBit(key: string, offset: number): Promise<number> {
    if (this.engine.getBit) {
      return this.engine.getBit(this.key(key), offset);
    }
    throw new Error('getBit is not supported by this cache engine');
  }

  async pfAdd(key: string, items: string[]): Promise<number> {
    if (this.engine.pfAdd) {
      return this.engine.pfAdd(this.key(key), items);
    }
    throw new Error('pfAdd is not supported by this cache engine');
  }

  async pfCount(key: string): Promise<number> {
    if (this.engine.pfCount) {
      return this.engine.pfCount(this.key(key));
    }
    throw new Error('pfCount is not supported by this cache engine');
  }

  async bfAdd(key: string, item: string): Promise<boolean> {
    if (this.engine.bfAdd) {
      return this.engine.bfAdd(this.key(key), item);
    }
    throw new Error('bfAdd is not supported by this cache engine');
  }

  async bfExists(key: string, item: string): Promise<boolean> {
    if (this.engine.bfExists) {
      return this.engine.bfExists(this.key(key), item);
    }
    throw new Error('bfExists is not supported by this cache engine');
  }

  async geoAdd(key: string, longitude: number, latitude: number, member: string): Promise<number> {
    if (this.engine.geoAdd) {
      return this.engine.geoAdd(this.key(key), longitude, latitude, member);
    }
    throw new Error('geoAdd is not supported by this cache engine');
  }

  async geoSearch(key: string, longitude: number, latitude: number, radius: number, unit: string): Promise<string[]> {
    if (this.engine.geoSearch) {
      return this.engine.geoSearch(this.key(key), longitude, latitude, radius, unit);
    }
    throw new Error('geoSearch is not supported by this cache engine');
  }

  async hset(key: string, field: string, value: any): Promise<void> {
    if (this.engine.hset) {
      return this.engine.hset(this.key(key), field, value);
    }
    throw new Error('hset is not supported by this cache engine');
  }

  async hget(key: string, field: string): Promise<any> {
    if (this.engine.hget) {
      return this.engine.hget(this.key(key), field);
    }
    throw new Error('hget is not supported by this cache engine');
  }

  async hdel(key: string, field: string): Promise<void> {
    if (this.engine.hdel) {
      return this.engine.hdel(this.key(key), field);
    }
    throw new Error('hdel is not supported by this cache engine');
  }
}
