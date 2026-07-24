import { StreamEntry } from './types';
import { IStreamEngine } from './engine';

export interface IRocksDbStreamClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export class RocksDbStreamEngine implements IStreamEngine {
  constructor(private client: IRocksDbStreamClient) {}

  async append(streamName: string, data: unknown): Promise<string> {
    const existing = await this.client.get(streamName);
    const now = Date.now();
    let entries: StreamEntry<unknown>[] = [];

    if (existing !== null) {
      try {
        entries = JSON.parse(existing);
      } catch (e) {
        entries = [];
      }
    }

    const sequence = entries.filter(e => e.id.startsWith(`${now}-`)).length;
    const id = `${now}-${sequence}`;
    entries.push({ id, data });

    await this.client.put(streamName, JSON.stringify(entries));
    return id;
  }

  async read(streamName: string, startId: string, limit?: number): Promise<StreamEntry<unknown>[]> {
    const existing = await this.client.get(streamName);
    if (!existing) {
      return [];
    }

    try {
      const entries: StreamEntry<unknown>[] = JSON.parse(existing);
      
      let startIndex = 0;
      if (startId !== '0-0') {
        const foundIndex = entries.findIndex(e => e.id === startId);
        if (foundIndex !== -1) {
          startIndex = foundIndex + 1;
        } else {
          startIndex = entries.findIndex(e => e.id > startId);
          if (startIndex === -1) {
             startIndex = entries.length;
          }
        }
      }
      
      const result = entries.slice(startIndex);
      if (limit !== undefined && limit > 0) {
        return result.slice(0, limit);
      }
      return result;
    } catch (e) {
      return [];
    }
  }
}
