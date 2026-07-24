import { IEventStore, EventRecord } from './types';
import { IEventEngine } from './engine';

export class EventStoreImpl implements IEventStore {
  constructor(private engine: IEventEngine) {}

  async append<T = unknown>(streamId: string, type: string, data: T): Promise<string> {
    return this.engine.append(streamId, type, data);
  }

  async getEvents<T = unknown>(streamId: string, startId?: string, limit?: number): Promise<EventRecord<T>[]> {
    const events = await this.engine.getEvents(streamId, startId, limit);
    return events as EventRecord<T>[];
  }
}
