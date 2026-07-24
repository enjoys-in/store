import { IKVEngine } from './engine';
import { IRocksDbKVConfig } from './types';

export interface IRocksDbClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export class RocksDbKVEngine implements IKVEngine {
  private client: IRocksDbClient;

  constructor(config: IRocksDbKVConfig, client: IRocksDbClient) {
    this.client = client;
  }

  async get(key: string): Promise<unknown> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.client.put(key, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async cas(key: string, oldValue: unknown, newValue: unknown): Promise<boolean> {
    const current = await this.get(key);
    
    // Check if current equals oldValue (strict JSON equality for objects)
    const currentStr = JSON.stringify(current);
    const oldStr = JSON.stringify(oldValue);
    
    if (currentStr !== oldStr) {
      return false; // CAS failed
    }
    
    // In a real multi-process environment, this read-then-write needs 
    // RocksDB atomic Merge/Transactions. This simulates the logic.
    await this.set(key, newValue);
    return true;
  }

  async incr(key: string, by: number = 1): Promise<number> {
    const current = await this.get(key);
    let num = 0;
    
    if (current !== null) {
      if (typeof current !== 'number') {
        throw new Error('ERR value is not an integer or out of range');
      }
      num = current;
    }
    
    const newVal = num + by;
    // We use CAS to simulate atomic increment retry loop
    const success = await this.cas(key, current, newVal);
    if (!success) {
      // In a highly concurrent mock, we would retry. For now, recursion retry:
      return this.incr(key, by);
    }
    return newVal;
  }

  async decr(key: string, by: number = 1): Promise<number> {
    return this.incr(key, -by);
  }
}
