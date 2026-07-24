import { SetStoreImpl } from './store';
import { ISet, SetEngineConfig, SetEngineType } from './types';
import { RocksDbSetEngine, IRocksDbClient } from './RocksDbSetEngine';

export class SetFactory {
  static create<T = unknown>(
    engineConfig: SetEngineConfig,
    namespace: string = '',
    setKey: string = '',
    client?: IRocksDbClient
  ): ISet<T> {
    let engine;

    switch (engineConfig.type) {
      case SetEngineType.ROCKSDB:
        if (!client) {
          throw new Error('Client must be provided for ROCKSDB engine');
        }
        engine = new RocksDbSetEngine(client);
        break;
      default:
        throw new Error('Unsupported Set engine type');
    }

    return new SetStoreImpl<T>(engine, namespace, setKey);
  }
}
