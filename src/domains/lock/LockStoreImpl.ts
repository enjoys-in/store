import { ILock } from './types';

export class LockStoreImpl implements ILock {
  constructor(private engine: ILock, private namespace: string = '') {}

  private getKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key;
  }

  async acquire(key: string, ttlMs: number): Promise<boolean> {
    return this.engine.acquire(this.getKey(key), ttlMs);
  }

  async release(key: string): Promise<void> {
    return this.engine.release(this.getKey(key));
  }
}
