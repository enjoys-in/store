import { ListStoreImpl } from './store';
import { IList, ListEngineConfig, ListEngineType } from './types';
import { RocksDbListEngine, IRocksDbClient } from './RocksDbListEngine';

export class ListFactory {
  static create<T = unknown>(
    engineConfig: ListEngineConfig,
    namespace: string = '',
    listKey: string = '',
    client?: IRocksDbClient
  ): IList<T> {
    let engine;

    switch (engineConfig.type) {
      case ListEngineType.ROCKSDB:
        if (!client) {
          throw new Error('Client must be provided for ROCKSDB engine');
        }
        engine = new RocksDbListEngine(client);
        break;
      default:
        throw new Error('Unsupported List engine type');
    }

    return new ListStoreImpl<T>(engine, namespace, listKey);
  }
}
