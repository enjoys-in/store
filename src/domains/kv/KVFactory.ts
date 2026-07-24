import { KVStoreImpl } from './store';
import { IKVStore, KVEngineConfig, KVEngineType } from './types';
import { RocksDbKVEngine, IRocksDbClient } from './RocksDbEngine';

export class KVFactory {
  static create<T = unknown>(
    engineConfig: KVEngineConfig,
    namespace: string = '',
    client?: IRocksDbClient
  ): IKVStore<T> {
    let engine;

    switch (engineConfig.type) {
      case KVEngineType.ROCKSDB:
        if (!client) {
          throw new Error('Client must be provided for ROCKSDB engine');
        }
        engine = new RocksDbKVEngine(engineConfig.config, client as IRocksDbClient);
        break;
      default:
        throw new Error('Unsupported KV engine type');
    }

    return new KVStoreImpl<T>(engine, namespace);
  }
}
