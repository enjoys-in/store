import { QueueStoreImpl } from './store';
import { IQueue, QueueEngineConfig, QueueEngineType } from './types';
import { RocksDbQueueEngine, IRocksDbClient } from './RocksDbEngine';

export class QueueFactory {
  static create<T = unknown>(
    config: QueueEngineConfig,
    queueName: string,
    client?: IRocksDbClient
  ): IQueue<T> {
    let engine;

    switch (config.type) {
      case QueueEngineType.ROCKSDB:
        if (!client) {
          throw new Error('Client must be provided for ROCKSDB engine');
        }
        engine = new RocksDbQueueEngine(config.config, client as IRocksDbClient);
        break;
      default:
        throw new Error('Unsupported Queue engine type');
    }

    return new QueueStoreImpl<T>(engine, queueName);
  }
}
