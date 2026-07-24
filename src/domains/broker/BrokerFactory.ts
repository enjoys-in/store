import { BrokerStoreImpl } from './store';
import { IBroker, BrokerEngineConfig, BrokerEngineType } from './types';
import { RocksDbBrokerEngine } from './RocksDbBrokerEngine';

export class BrokerFactory {
  static create<T = unknown>(
    config: BrokerEngineConfig,
    namespace: string = ''
  ): IBroker<T> {
    let engine;

    switch ((config as any).type) {
      case BrokerEngineType.ROCKSDB:
        engine = new RocksDbBrokerEngine();
        break;
      default:
        throw new Error('Unsupported Broker engine type');
    }

    return new BrokerStoreImpl<T>(engine, namespace);
  }
}
