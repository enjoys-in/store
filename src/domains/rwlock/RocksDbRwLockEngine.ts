import { IRwLock } from './types';

// Placeholder client for RocksDB
export interface IRocksDbRwLockClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

interface LockState {
  readers: number;
  writeLocked: boolean;
  expiresAt: number;
}

export class RocksDbRwLockEngine implements IRwLock {
  constructor(private client: IRocksDbRwLockClient) {}

  private async getState(key: string): Promise<LockState> {
    const data = await this.client.get(key);
    if (!data) return { readers: 0, writeLocked: false, expiresAt: 0 };
    try {
      const state = JSON.parse(data) as LockState;
      if (state.expiresAt < Date.now()) {
        return { readers: 0, writeLocked: false, expiresAt: 0 };
      }
      return state;
    } catch {
      return { readers: 0, writeLocked: false, expiresAt: 0 };
    }
  }

  private async saveState(key: string, state: LockState): Promise<void> {
    if (state.readers === 0 && !state.writeLocked) {
      await this.client.del(key);
    } else {
      await this.client.put(key, JSON.stringify(state));
    }
  }

  async acquireRead(key: string, ttlMs: number): Promise<boolean> {
    const state = await this.getState(key);
    if (state.writeLocked) {
      return false;
    }
    state.readers += 1;
    state.expiresAt = Math.max(state.expiresAt, Date.now() + ttlMs);
    await this.saveState(key, state);
    return true;
  }

  async acquireWrite(key: string, ttlMs: number): Promise<boolean> {
    const state = await this.getState(key);
    if (state.writeLocked || state.readers > 0) {
      return false;
    }
    state.writeLocked = true;
    state.expiresAt = Date.now() + ttlMs;
    await this.saveState(key, state);
    return true;
  }

  async release(key: string): Promise<void> {
    const state = await this.getState(key);
    if (state.writeLocked) {
      state.writeLocked = false;
    } else if (state.readers > 0) {
      state.readers -= 1;
    }
    await this.saveState(key, state);
  }
}
