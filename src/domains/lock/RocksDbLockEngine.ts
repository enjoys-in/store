export interface IRocksDbLockClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export class RocksDbLockEngine {
  constructor(private client: IRocksDbLockClient) {}

  async acquire(key: string, ttlMs: number): Promise<boolean> {
    const existing = await this.client.get(key);
    const now = Date.now();

    // If lock exists, check if it has expired
    if (existing !== null) {
      const expiration = parseInt(existing, 10);
      if (now < expiration) {
        return false; // Lock is still held
      }
    }

    // Acquire lock by storing the expiration timestamp
    // In a real multi-process embedded scenario, this needs an atomic Put/SetNX operation from RocksDB.
    // For this mock client, we just put it.
    await this.client.put(key, (now + ttlMs).toString());
    return true;
  }

  async release(key: string): Promise<void> {
    await this.client.del(key);
  }
}
