import { EventRecord } from './types';
import { IEventEngine } from './engine';

export interface IRocksDbEventClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export class RocksDbEventEngine implements IEventEngine {
  constructor(private client: IRocksDbEventClient) {}

  private getStreamKey(streamId: string): string {
    return `events:${streamId}`;
  }

  async append(streamId: string, type: string, data: unknown): Promise<string> {
    const key = this.getStreamKey(streamId);
    const existing = await this.client.get(key);
    const now = Date.now();
    let events: EventRecord<unknown>[] = [];

    if (existing !== null) {
      try {
        events = JSON.parse(existing);
      } catch (e) {
        events = [];
      }
    }

    const sequence = events.filter(e => e.id.startsWith(`${now}-`)).length;
    const id = `${now}-${sequence}`;
    events.push({ id, streamId, type, data, timestamp: now });

    await this.client.put(key, JSON.stringify(events));
    return id;
  }

  async getEvents(streamId: string, startId?: string, limit?: number): Promise<EventRecord<unknown>[]> {
    const key = this.getStreamKey(streamId);
    const existing = await this.client.get(key);
    if (!existing) {
      return [];
    }

    try {
      const events: EventRecord<unknown>[] = JSON.parse(existing);
      
      let startIndex = 0;
      if (startId) {
        const foundIndex = events.findIndex(e => e.id === startId);
        if (foundIndex !== -1) {
          startIndex = foundIndex + 1;
        } else {
          startIndex = events.findIndex(e => e.id > startId);
          if (startIndex === -1) {
             startIndex = events.length;
          }
        }
      }
      
      const result = events.slice(startIndex);
      if (limit !== undefined && limit > 0) {
        return result.slice(0, limit);
      }
      return result;
    } catch (e) {
      return [];
    }
  }
}
