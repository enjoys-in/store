import { IHash } from './types';
import { IHashEngine } from './engine';

export class HashStoreImpl<T = unknown> implements IHash<T> {
  constructor(
    private engine: IHashEngine,
    private namespace: string = ''
  ) {}

  async set(key: string, field: string, value: T): Promise<void> {
    return this.engine.set(this.namespace, key, field, value);
  }

  async get(key: string, field: string): Promise<T | null> {
    return this.engine.get(this.namespace, key, field);
  }

  async del(key: string, field: string): Promise<void> {
    return this.engine.del(this.namespace, key, field);
  }

  async setMany(key: string, fields: Record<string, T>): Promise<void> {
    return this.engine.setMany(this.namespace, key, fields);
  }

  async getAll(key: string): Promise<Record<string, T> | null> {
    return this.engine.getAll(this.namespace, key);
  }
}
