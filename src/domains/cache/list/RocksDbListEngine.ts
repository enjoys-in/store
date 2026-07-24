import { IListEngine } from './engine';

export interface IRocksDbClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export class RocksDbListEngine implements IListEngine {
  constructor(private client: IRocksDbClient) {}

  private getMetaKey(namespace: string, key: string): string {
    return `list:meta:${namespace}:${key}`;
  }

  private getItemKey(namespace: string, key: string, index: number): string {
    return `list:item:${namespace}:${key}:${index}`;
  }

  private async getMeta(namespace: string, key: string): Promise<{ head: number; tail: number }> {
    const metaKey = this.getMetaKey(namespace, key);
    const metaStr = await this.client.get(metaKey);
    if (!metaStr) {
      return { head: 0, tail: 0 };
    }
    return JSON.parse(metaStr);
  }

  private async saveMeta(namespace: string, key: string, head: number, tail: number): Promise<void> {
    const metaKey = this.getMetaKey(namespace, key);
    await this.client.put(metaKey, JSON.stringify({ head, tail }));
  }

  async push(namespace: string, key: string, value: unknown): Promise<number> {
    const meta = await this.getMeta(namespace, key);
    const itemKey = this.getItemKey(namespace, key, meta.tail);
    
    await this.client.put(itemKey, JSON.stringify(value));
    
    meta.tail += 1;
    await this.saveMeta(namespace, key, meta.head, meta.tail);
    
    return meta.tail - meta.head;
  }

  async pop(namespace: string, key: string): Promise<unknown | null> {
    const meta = await this.getMeta(namespace, key);
    if (meta.tail <= meta.head) return null; // Empty

    const targetIndex = meta.tail - 1;
    const itemKey = this.getItemKey(namespace, key, targetIndex);
    
    const valueStr = await this.client.get(itemKey);
    if (valueStr) {
      await this.client.del(itemKey);
    }
    
    meta.tail -= 1;
    await this.saveMeta(namespace, key, meta.head, meta.tail);
    
    return valueStr ? JSON.parse(valueStr) : null;
  }

  async unshift(namespace: string, key: string, value: unknown): Promise<number> {
    const meta = await this.getMeta(namespace, key);
    
    meta.head -= 1;
    const itemKey = this.getItemKey(namespace, key, meta.head);
    
    await this.client.put(itemKey, JSON.stringify(value));
    await this.saveMeta(namespace, key, meta.head, meta.tail);
    
    return meta.tail - meta.head;
  }

  async shift(namespace: string, key: string): Promise<unknown | null> {
    const meta = await this.getMeta(namespace, key);
    if (meta.tail <= meta.head) return null; // Empty

    const itemKey = this.getItemKey(namespace, key, meta.head);
    
    const valueStr = await this.client.get(itemKey);
    if (valueStr) {
      await this.client.del(itemKey);
    }
    
    meta.head += 1;
    await this.saveMeta(namespace, key, meta.head, meta.tail);
    
    return valueStr ? JSON.parse(valueStr) : null;
  }

  async range(namespace: string, key: string, start: number, stop: number): Promise<unknown[]> {
    const meta = await this.getMeta(namespace, key);
    const length = meta.tail - meta.head;
    
    if (length === 0) return [];
    
    // Normalize indices (Python-style negative indexing)
    if (start < 0) start = Math.max(0, length + start);
    if (stop < 0) stop = Math.max(0, length + stop);
    
    start = Math.min(start, length - 1);
    stop = Math.min(stop, length - 1);

    if (start > stop) return [];

    const result: unknown[] = [];
    for (let i = start; i <= stop; i++) {
      const actualIndex = meta.head + i;
      const itemKey = this.getItemKey(namespace, key, actualIndex);
      const valueStr = await this.client.get(itemKey);
      if (valueStr) {
        result.push(JSON.parse(valueStr));
      }
    }
    return result;
  }

  async len(namespace: string, key: string): Promise<number> {
    const meta = await this.getMeta(namespace, key);
    return meta.tail - meta.head;
  }
}
