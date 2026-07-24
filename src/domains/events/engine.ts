import { EventRecord } from './types';

export interface IEventEngine {
  append(streamId: string, type: string, data: unknown): Promise<string>;
  getEvents(streamId: string, startId?: string, limit?: number): Promise<EventRecord<unknown>[]>;
}
