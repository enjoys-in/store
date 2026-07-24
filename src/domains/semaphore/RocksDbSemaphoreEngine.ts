import { ISemaphore } from './types';

export interface IRocksDbSemaphoreClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export class RocksDbSemaphoreEngine implements ISemaphore {
  constructor(private client: IRocksDbSemaphoreClient) {}

  async acquire(key: string, limit: number, ttlMs: number): Promise<boolean> {
    const existing = await this.client.get(key);
    const now = Date.now();
    let expirations: number[] = [];

    if (existing !== null) {
      try {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) {
          // Filter out expired permits
          expirations = parsed.filter((exp: number) => now < exp);
        }
      } catch (e) {
        // Ignore parsing errors, assume empty
      }
    }

    if (expirations.length >= limit) {
      return false;
    }

    expirations.push(now + ttlMs);
    await this.client.put(key, JSON.stringify(expirations));
    return true;
  }

  async release(key: string): Promise<void> {
    // A more precise release would require knowing the exact permit ID.
    // For now, we simulate release by removing the oldest active permit.
    const existing = await this.client.get(key);
    if (!existing) return;

    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const now = Date.now();
        // Remove expired first
        const valid = parsed.filter((exp: number) => now < exp);
        if (valid.length > 0) {
          // Remove the first (oldest) valid permit
          valid.shift();
          if (valid.length === 0) {
            await this.client.del(key);
          } else {
            await this.client.put(key, JSON.stringify(valid));
          }
        } else {
          await this.client.del(key);
        }
      }
    } catch (e) {
      await this.client.del(key);
    }
  }
}
