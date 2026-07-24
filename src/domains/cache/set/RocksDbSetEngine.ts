import { ISetEngine } from './engine';

export interface IRocksDbClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export class RocksDbSetEngine implements ISetEngine {
  constructor(private client: IRocksDbClient) {}

  private getKey(namespace: string, key: string): string {
    return `set:data:${namespace}:${key}`;
  }

  private async getSet(namespace: string, key: string): Promise<Set<string>> {
    const dataStr = await this.client.get(this.getKey(namespace, key));
    if (!dataStr) return new Set();
    const arr = JSON.parse(dataStr);
    return new Set(arr);
  }

  private async saveSet(namespace: string, key: string, set: Set<string>): Promise<void> {
    const arr = Array.from(set);
    await this.client.put(this.getKey(namespace, key), JSON.stringify(arr));
  }

  async add(namespace: string, key: string, value: unknown): Promise<number> {
    const set = await this.getSet(namespace, key);
    const valueStr = JSON.stringify(value);
    if (set.has(valueStr)) {
      return 0;
    }
    set.add(valueStr);
    await this.saveSet(namespace, key, set);
    return 1;
  }

  async remove(namespace: string, key: string, value: unknown): Promise<number> {
    const set = await this.getSet(namespace, key);
    const valueStr = JSON.stringify(value);
    if (!set.has(valueStr)) {
      return 0;
    }
    set.delete(valueStr);
    await this.saveSet(namespace, key, set);
    return 1;
  }

  async has(namespace: string, key: string, value: unknown): Promise<boolean> {
    const set = await this.getSet(namespace, key);
    const valueStr = JSON.stringify(value);
    return set.has(valueStr);
  }

  async members(namespace: string, key: string): Promise<unknown[]> {
    const set = await this.getSet(namespace, key);
    return Array.from(set).map(item => JSON.parse(item));
  }

  async size(namespace: string, key: string): Promise<number> {
    const set = await this.getSet(namespace, key);
    return set.size;
  }
}
