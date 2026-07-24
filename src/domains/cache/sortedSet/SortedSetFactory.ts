import { SortedSetStoreImpl } from './store';
import { ISortedSet, SortedSetEngineConfig, SortedSetEngineType } from './types';
import { RocksDbSortedSetEngine, IRocksDbClient } from './RocksDbSortedSetEngine';

export class SortedSetFactory {
  static create<T = unknown>(
    engineConfig: SortedSetEngineConfig,
    namespace: string = '',
    setKey: string = '',
    client?: IRocksDbClient
  ): ISortedSet<T> {
    let engine;

    switch (engineConfig.type) {
      case SortedSetEngineType.ROCKSDB:
        if (!client) {
          throw new Error('Client must be provided for ROCKSDB engine');
        }
        engine = new RocksDbSortedSetEngine(client);
        break;
      default:
        throw new Error('Unsupported SortedSet engine type');
    }

    return new SortedSetStoreImpl<T>(engine, namespace, setKey);
  }
}
