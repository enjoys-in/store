import { IHashEngine } from './engine';

export class RocksDbHashEngine implements IHashEngine {
  constructor(private client: any) {}

  private getMetaKey(namespace: string, key: string): string {
    return `hash:meta:${namespace}:${key}`;
  }

  private getFieldKey(namespace: string, key: string, field: string): string {
    return `hash:item:${namespace}:${key}:${field}`;
  }

  private async getMeta(namespace: string, key: string): Promise<string[]> {
    const metaStr = await this.client.get(this.getMetaKey(namespace, key));
    if (!metaStr) return [];
    return JSON.parse(metaStr);
  }

  private async saveMeta(namespace: string, key: string, fields: string[]): Promise<void> {
    await this.client.put(this.getMetaKey(namespace, key), JSON.stringify(fields));
  }

  async set(namespace: string, key: string, field: string, value: any): Promise<void> {
    const meta = await this.getMeta(namespace, key);
    if (!meta.includes(field)) {
      meta.push(field);
      await this.saveMeta(namespace, key, meta);
    }
    await this.client.put(this.getFieldKey(namespace, key, field), JSON.stringify(value));
  }

  async get(namespace: string, key: string, field: string): Promise<any | null> {
    const valueStr = await this.client.get(this.getFieldKey(namespace, key, field));
    return valueStr ? JSON.parse(valueStr) : null;
  }

  async del(namespace: string, key: string, field: string): Promise<void> {
    const meta = await this.getMeta(namespace, key);
    const updatedMeta = meta.filter(f => f !== field);
    if (updatedMeta.length !== meta.length) {
      await this.saveMeta(namespace, key, updatedMeta);
    }
    await this.client.del(this.getFieldKey(namespace, key, field));
  }

  async setMany(namespace: string, key: string, fields: Record<string, any>): Promise<void> {
    const meta = await this.getMeta(namespace, key);
    let metaChanged = false;
    
    for (const [field, value] of Object.entries(fields)) {
      if (!meta.includes(field)) {
        meta.push(field);
        metaChanged = true;
      }
      await this.client.put(this.getFieldKey(namespace, key, field), JSON.stringify(value));
    }
    
    if (metaChanged) {
      await this.saveMeta(namespace, key, meta);
    }
  }

  async getAll(namespace: string, key: string): Promise<Record<string, any> | null> {
    const meta = await this.getMeta(namespace, key);
    if (meta.length === 0) return null;

    const result: Record<string, any> = {};
    for (const field of meta) {
      const valStr = await this.client.get(this.getFieldKey(namespace, key, field));
      if (valStr) {
        result[field] = JSON.parse(valStr);
      }
    }
    return result;
  }
}
