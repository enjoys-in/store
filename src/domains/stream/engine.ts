import { StreamEntry } from './types';

export interface IStreamEngine {
  append(streamName: string, data: unknown): Promise<string>;
  read(streamName: string, startId: string, limit?: number): Promise<StreamEntry<unknown>[]>;
}
