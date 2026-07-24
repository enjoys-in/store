import { IRwLock, RwLockEngineConfig, RwLockEngineType } from './types';
import { RocksDbRwLockEngine, IRocksDbRwLockClient } from './RocksDbRwLockEngine';

export class RwLockFactory {
  static create(
    config: RwLockEngineConfig,
    client?: IRocksDbRwLockClient
  ): IRwLock {
    switch (config.type) {
      case RwLockEngineType.ROCKSDB:
        if (!client) {
          throw new Error('Client must be provided for ROCKSDB rwlock engine');
        }
        return new RocksDbRwLockEngine(client);
      default:
        throw new Error('Unsupported RwLock engine type');
    }
  }
}
