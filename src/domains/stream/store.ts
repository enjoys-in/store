import { IStream, StreamEntry } from './types';
import { IStreamEngine } from './engine';

export class StreamStoreImpl<T> implements IStream<T> {
  constructor(private engine: IStreamEngine, private streamName: string) {}

  async append(data: T): Promise<string> {
    return this.engine.append(this.streamName, data);
  }

  async read(startId: string, limit?: number): Promise<StreamEntry<T>[]> {
    return (await this.engine.read(this.streamName, startId, limit)) as StreamEntry<T>[];
  }
}
