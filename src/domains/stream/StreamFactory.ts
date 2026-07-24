import { StreamStoreImpl } from './store';
import { IStream, StreamEngineConfig, StreamEngineType } from './types';
import { RocksDbStreamEngine, IRocksDbStreamClient } from './RocksDbStreamEngine';

export class StreamFactory {
  static create<T = unknown>(
    config: StreamEngineConfig,
    streamName: string,
    client?: IRocksDbStreamClient
  ): IStream<T> {
    let engine;

    switch ((config as unknown as { type: string }).type) {
      case StreamEngineType.ROCKSDB:
        if (!client) throw new Error('Client must be provided for ROCKSDB engine');
        engine = new RocksDbStreamEngine(client);
        break;
      default:
        throw new Error('Unsupported Stream engine type');
    }

    return new StreamStoreImpl<T>(engine, streamName);
  }
}
