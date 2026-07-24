import rocksdb from 'rocksdb';
import { promisify } from 'util';
import { StorageProvider } from '../core/StorageProvider';
import { IKVEngine } from '../domains/kv';
import { RocksDbKVEngine } from '../domains/kv/RocksDbEngine';
import { IQueueEngine } from '../domains/queue';
import { RocksDbQueueEngine } from '../domains/queue/RocksDbEngine';
import { ICacheEngine } from '../domains/cache';
import { RocksDbRedisEngine } from '../domains/cache/engines/RocksDbRedisEngine';
import { IStreamEngine } from '../domains/stream';
import { RocksDbStreamEngine } from '../domains/stream/RocksDbStreamEngine';
import { IBrokerEngine } from '../domains/broker';
import { RocksDbBrokerEngine } from '../domains/broker/RocksDbBrokerEngine';
import { ISessionEngine } from '../domains/sessions';
import { RocksDbSessionEngine } from '../domains/sessions/RocksDbSessionEngine';
import { IRateLimiterEngine } from '../domains/rateLimiter';
import { RocksDbRateLimiterEngine } from '../domains/rateLimiter/RocksDbRateLimiterEngine';
import { ILock } from '../domains/lock';
import { RocksDbLockEngine } from '../domains/lock/RocksDbLockEngine';
import { ISemaphore } from '../domains/semaphore';
import { RocksDbSemaphoreEngine } from '../domains/semaphore/RocksDbSemaphoreEngine';
import { IRwLock } from '../domains/rwlock';
import { RocksDbRwLockEngine } from '../domains/rwlock/RocksDbRwLockEngine';
import { IEventEngine } from '../domains/events';
import { RocksDbEventEngine } from '../domains/events/RocksDbEventEngine';
import { ICollectionEngine } from '../domains/collection';
import { RocksDbCollectionEngine } from '../domains/collection/RocksDbCollectionEngine';
import { ISearchEngine } from '../domains/search';
import { RocksDbSearchEngine } from '../domains/search/RocksDbSearchEngine';
import { ITimeSeriesEngine } from '../domains/timeseries';
import { RocksDbTimeSeriesEngine } from '../domains/timeseries/RocksDbTimeSeriesEngine';

// Real local client for RocksDB
class RealRocksDbClient {
  private db: any;
  private dbOpenPromise: Promise<void>;
  private dbGet: (key: string, options?: any) => Promise<string>;
  private dbPut: (key: string, value: string) => Promise<void>;
  private dbDel: (key: string) => Promise<void>;

  private dbBatch: (operations: any[], options?: any) => Promise<void>;

  constructor(dbPath: string, options?: any) {
    this.db = rocksdb(dbPath);
    // Sync open for now so it's ready, or we could await it but constructors are sync.
    // Rocksdb Node wrapper handles queuing operations if it's opening.
    const mergedOptions = { createIfMissing: true, ...options };
    this.dbOpenPromise = new Promise((resolve, reject) => {
      this.db.open(mergedOptions, (err: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });

    this.dbGet = promisify(this.db.get).bind(this.db);
    this.dbPut = promisify(this.db.put).bind(this.db);
    this.dbDel = promisify(this.db.del).bind(this.db);
    this.dbBatch = promisify(this.db.batch).bind(this.db);
  }

  async close(): Promise<void> {
    try { await this.dbOpenPromise; } catch {}
    return new Promise((resolve, reject) => {
      this.db.close((err: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async get(key: string): Promise<string | null> {
    await this.dbOpenPromise;
    try {
      const value = await this.dbGet(key, { asBuffer: false });
      return value;
    } catch (err: any) {
      if (err.notFound || (err.message && err.message.includes('NotFound'))) {
        return null;
      }
      throw err;
    }
  }

  async put(key: string, value: string): Promise<void> {
    await this.dbOpenPromise;
    await this.dbPut(key, value);
  }

  async del(key: string): Promise<void> {
    await this.dbOpenPromise;
    await this.dbDel(key);
  }

  async batch(operations: Array<{ type: 'put' | 'del'; key: string; value?: string }>): Promise<void> {
    await this.dbOpenPromise;
    await this.dbBatch(operations);
  }

  async keys(): Promise<string[]> {
    await this.dbOpenPromise;
    return new Promise((resolve, reject) => {
      const keys: string[] = [];
      const iterator = this.db.iterator({ keys: true, values: false, keyAsBuffer: false });
      
      const next = () => {
        iterator.next((err: Error, key: string) => {
          if (err) {
            iterator.end(() => reject(err));
            return;
          }
          if (key === undefined) {
            iterator.end(() => resolve(keys));
            return;
          }
          keys.push(key);
          next();
        });
      };
      
      next();
    });
  }
}

export class RocksDbProvider implements StorageProvider {
  private client: RealRocksDbClient;

  constructor(dbPath: string, options?: any) {
    this.client = new RealRocksDbClient(dbPath, options);
  }

  async close(): Promise<void> {
    await this.client.close();
  }

  async batch(operations: Array<{ type: 'put' | 'del'; key: string; value?: string }>): Promise<void> {
    await this.client.batch(operations);
  }

  getKVEngine(): IKVEngine {
    return new RocksDbKVEngine({}, this.client);
  }

  getQueueEngine(): IQueueEngine {
    return new RocksDbQueueEngine({}, this.client);
  }

  getCacheEngine(): ICacheEngine {
    // Defaulting to Redis Engine for cache as it has advanced structures optimized
    return new RocksDbRedisEngine(this.client);
  }

  getStreamEngine(): IStreamEngine {
    return new RocksDbStreamEngine(this.client);
  }

  getEventEngine(): IEventEngine {
    return new RocksDbEventEngine(this.client);
  }

  getCollectionEngine(): ICollectionEngine {
    return new RocksDbCollectionEngine(this.client);
  }

  getSearchEngine(): ISearchEngine {
    return new RocksDbSearchEngine(this.client);
  }

  getTimeSeriesEngine(): ITimeSeriesEngine {
    return new RocksDbTimeSeriesEngine(this.client);
  }

  getBrokerEngine(): IBrokerEngine {
    return new RocksDbBrokerEngine();
  }

  getSessionEngine(): ISessionEngine {
    return new RocksDbSessionEngine(this.client);
  }

  getRateLimiterEngine(): IRateLimiterEngine {
    return new RocksDbRateLimiterEngine(this.client);
  }

  getLockEngine(): ILock {
    return new RocksDbLockEngine(this.client);
  }

  getSemaphoreEngine(): ISemaphore {
    return new RocksDbSemaphoreEngine(this.client);
  }

  getRwLockEngine(): IRwLock {
    return new RocksDbRwLockEngine(this.client);
  }
}
