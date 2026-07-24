import { CacheStoreImpl } from './store';
import { ICache, CacheEngineConfig, CacheEngineType } from './types';
import { RocksDbLruEngine, IRocksDbClient } from './engines/RocksDbLruEngine';
import { RocksDbRedisEngine } from './engines/RocksDbRedisEngine';

export class CacheFactory {
  /**
   * Creates a Cache Store instance based on the provided configuration.
   * For REDIS, KV, and ROCKSDB_LRU engines, you must inject your underlying data client.
   */
  static create<T = unknown>(
    config: CacheEngineConfig,
    namespace: string = '',
    client?: IRocksDbClient
  ): ICache<T> {
    let engine;

    switch (config.type) {
      case CacheEngineType.ROCKSDB_LRU:
        if (!client) {
          throw new Error('Client must be provided for ROCKSDB_LRU engine');
        }
        engine = new RocksDbLruEngine(config.config, client as IRocksDbClient);
        break;
      case CacheEngineType.ROCKSDB_REDIS:
        if (!client) {
          throw new Error('Client must be provided for ROCKSDB_REDIS engine');
        }
        engine = new RocksDbRedisEngine(client as IRocksDbClient);
        break;
      default:
        throw new Error('Unsupported cache engine type');
    }

    return new CacheStoreImpl<T>(engine, namespace);
  }
}
