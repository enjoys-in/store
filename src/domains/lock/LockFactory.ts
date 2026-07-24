import { ILock, LockEngineConfig, LockEngineType } from './types';
import { RocksDbLockEngine, IRocksDbLockClient } from './RocksDbLockEngine';

export class LockFactory {
  static create(
    config: LockEngineConfig,
    client?: IRocksDbLockClient
  ): ILock {
    switch (config.type) {
      case LockEngineType.ROCKSDB:
        if (!client) {
          throw new Error('Client must be provided for ROCKSDB lock engine');
        }
        return new RocksDbLockEngine(client);
      default:
        throw new Error('Unsupported Lock engine type');
    }
  }
}
