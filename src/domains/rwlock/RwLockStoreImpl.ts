import { IRwLock } from './types';

export class RwLockStoreImpl implements IRwLock {
  constructor(private engine: IRwLock, private namespace: string = '') {}

  private getKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key;
  }

  async acquireRead(key: string, ttlMs: number): Promise<boolean> {
    return this.engine.acquireRead(this.getKey(key), ttlMs);
  }

  async acquireWrite(key: string, ttlMs: number): Promise<boolean> {
    return this.engine.acquireWrite(this.getKey(key), ttlMs);
  }

  async release(key: string): Promise<void> {
    return this.engine.release(this.getKey(key));
  }
}
