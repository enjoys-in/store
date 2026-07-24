import { ISemaphore } from './types';

export class SemaphoreStoreImpl implements ISemaphore {
  constructor(private engine: ISemaphore, private namespace: string = '') {}

  private getKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key;
  }

  async acquire(key: string, limit: number, ttlMs: number): Promise<boolean> {
    return this.engine.acquire(this.getKey(key), limit, ttlMs);
  }

  async release(key: string): Promise<void> {
    return this.engine.release(this.getKey(key));
  }
}
