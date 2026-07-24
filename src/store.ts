import { StorageProvider } from './core/StorageProvider';
import { EventEmitter } from 'events';
import { IKVStore, KVStoreImpl, WatchCallback, WatchEvent } from './domains/kv';
import { ICache, CacheStoreImpl } from './domains/cache';
import { IQueue, QueueStoreImpl } from './domains/queue';
import { IStream, StreamStoreImpl } from './domains/stream';

import { IBroker, BrokerStoreImpl } from './domains/broker';
import { IAuthDomain, JwtBlocklistImpl, RefreshTokenStoreImpl } from './domains/auth';
import { ISessionStore, SessionStoreImpl } from './domains/sessions';
import { IRateLimiter, RateLimiterStoreImpl, RateLimiterConfig } from './domains/rateLimiter';
import { ILock, LockStoreImpl } from './domains/lock';
import { ISemaphore, SemaphoreStoreImpl } from './domains/semaphore';
import { IRwLock, RwLockStoreImpl } from './domains/rwlock';
import { ITransaction, OptimisticTransaction } from './domains/transaction';
import { IEventStore, EventStoreImpl } from './domains/events';
import { ICollection, CollectionStoreImpl } from './domains/collection';
import { ISearchStore, SearchStoreImpl } from './domains/search';
import { ITimeSeriesStore, TimeSeriesStoreImpl } from './domains/timeseries';

import { RocksDbProvider } from './providers/RocksDbProvider';

export type StoreMode = 'embedded' | 'worker-thread' | 'server';

export interface StoreConfig {
  mode: 'embedded' | 'worker-thread' | 'server';
  dbPath?: string;
  rocksdbOptions?: Record<string, any>;
}

export class Store {
  private provider!: StorageProvider;
  private mode: StoreMode;
  private emitter = new EventEmitter();

  // We make the constructor private to enforce using the createStore factory function.
  private constructor(config: StoreConfig) {
    this.mode = config.mode;
    this.provider = new RocksDbProvider(config.dbPath || './rocksdb_data', config.rocksdbOptions);
  }

  async close(): Promise<void> {
    if (this.provider.close) {
      await this.provider.close();
    }
  }

  async batch(operations: Array<{ type: 'put' | 'del'; key: string; value?: string }>): Promise<void> {
    if (this.provider.batch) {
      await this.provider.batch(operations);
    } else {
      throw new Error('StorageProvider does not support atomic WriteBatch.');
    }
  }

  kv<T = unknown>(namespace?: string): IKVStore<T> {
    return new KVStoreImpl<T>(this.provider.getKVEngine(), namespace, this.emitter);
  }

  cache<T = unknown>(namespace?: string): ICache<T> {
    return new CacheStoreImpl<T>(this.provider.getCacheEngine(), namespace);
  }

  queue<T = unknown>(queueName: string): IQueue<T> {
    return new QueueStoreImpl<T>(this.provider.getQueueEngine(), queueName);
  }

  stream<T = unknown>(streamName: string): IStream<T> {
    return new StreamStoreImpl<T>(this.provider.getStreamEngine(), streamName);
  }

  broker<T = unknown>(namespace?: string): IBroker<T> {
    return new BrokerStoreImpl<T>(this.provider.getBrokerEngine(), namespace);
  }

  sessions(namespace?: string): ISessionStore {
    return new SessionStoreImpl(this.provider.getSessionEngine(), namespace);
  }

  rateLimiter(namespace: string, config: RateLimiterConfig): IRateLimiter {
    return new RateLimiterStoreImpl(this.provider.getRateLimiterEngine(), namespace, config);
  }

  get events(): IEventStore {
    return new EventStoreImpl(this.provider.getEventEngine());
  }

  collection<T = any>(name: string): ICollection<T> {
    return new CollectionStoreImpl<T>(this.provider.getCollectionEngine(), name);
  }

  search(namespace: string): ISearchStore {
    return new SearchStoreImpl(this.provider.getSearchEngine(), namespace);
  }

  timeseries(): ITimeSeriesStore {
    return new TimeSeriesStoreImpl(this.provider.getTimeSeriesEngine());
  }

  auth(): IAuthDomain {
    const authCache = this.cache<boolean>('__jwt_blocklist__');
    const rtKv = this.kv<string>('__refresh_tokens__');
    const rtUserKv = this.kv<string[]>('__refresh_tokens_by_user__');

    return {
      blocklist: () => new JwtBlocklistImpl(authCache),
      refreshTokens: () => new RefreshTokenStoreImpl(rtKv, rtUserKv)
    };
  }

  mutex(namespace?: string): ILock {
    return new LockStoreImpl(this.provider.getLockEngine(), namespace);
  }

  semaphore(namespace?: string): ISemaphore {
    return new SemaphoreStoreImpl(this.provider.getSemaphoreEngine(), namespace);
  }

  rwlock(namespace?: string): IRwLock {
    return new RwLockStoreImpl(this.provider.getRwLockEngine(), namespace);
  }

  async transaction<T>(
    callback: (tx: ITransaction) => Promise<T>,
    namespace?: string
  ): Promise<T> {
    const kvStore = this.kv(namespace);
    let attempts = 0;
    while (attempts < 3) {
      const tx = new OptimisticTransaction(kvStore);
      const result = await callback(tx);
      const success = await tx.commit();
      if (success) {
        return result;
      }
      attempts++;
    }
    throw new Error('Transaction failed after 3 attempts due to concurrency conflicts');
  }

  watch<T = unknown>(pattern: string, callback: WatchCallback<T>): () => void {
    const isPrefix = pattern.endsWith('*');
    const prefix = isPrefix ? pattern.slice(0, -1) : pattern;

    const handler = (event: import('./domains/kv').WatchEvent) => {
      if (isPrefix && event.key.startsWith(prefix)) {
        callback(event as WatchEvent<T>);
      } else if (!isPrefix && event.key === pattern) {
        callback(event as WatchEvent<T>);
      }
    };

    this.emitter.on('change', handler);

    return () => {
      this.emitter.off('change', handler);
    };
  }

  async live<T = unknown>(key: string, callback: (value: T | null) => void): Promise<() => void> {
    const initial = await this.kv<T>().get(key);
    callback(initial);

    return this.watch<T>(key, (event) => {
      if (event.operation === 'del') {
        callback(null);
      } else {
        callback(event.value !== undefined ? event.value : null);
      }
    });
  }
}

export function createStore(config: Partial<StoreConfig> = {}): Store {
  const mergedConfig: StoreConfig = {
    mode: 'embedded',
    ...config,
  };
  return new (Store as unknown as { new (config: StoreConfig): Store })(mergedConfig);
}
