import { IQueueEngine } from './engine';
import { IRocksDbQueueConfig } from './types';

export interface IRocksDbClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

interface QueueMeta {
  head: number;
  tail: number;
}

enum QueueKeyPrefix {
  META = '__qmeta__',
  DATA = '__qdata__'
}

export class RocksDbQueueEngine implements IQueueEngine {
  private client: IRocksDbClient;
  private metas: Map<string, QueueMeta> = new Map();

  constructor(config: IRocksDbQueueConfig, client: IRocksDbClient) {
    this.client = client;
  }

  private getMetaKey(queueName: string): string {
    return `${QueueKeyPrefix.META}:${queueName}`;
  }

  private getDataKey(queueName: string, id: string | number): string {
    return `${QueueKeyPrefix.DATA}:${queueName}:${id}`;
  }

  private async getMeta(queueName: string): Promise<QueueMeta> {
    if (this.metas.has(queueName)) {
      return this.metas.get(queueName)!;
    }
    const raw = await this.client.get(this.getMetaKey(queueName));
    if (raw) {
      const meta = JSON.parse(raw);
      this.metas.set(queueName, meta);
      return meta;
    }
    const meta = { head: 0, tail: 0 };
    this.metas.set(queueName, meta);
    return meta;
  }

  private async saveMeta(queueName: string, meta: QueueMeta): Promise<void> {
    await this.client.put(this.getMetaKey(queueName), JSON.stringify(meta));
  }

  async push(queueName: string, data: unknown): Promise<string> {
    const meta = await this.getMeta(queueName);
    const id = meta.tail.toString();
    meta.tail++;
    
    // Save data first, then meta, to ensure data is present if meta points to it
    await this.client.put(this.getDataKey(queueName, id), JSON.stringify(data));
    await this.saveMeta(queueName, meta);
    
    return id;
  }

  async pop(queueName: string): Promise<{ id: string; data: unknown } | null> {
    const meta = await this.getMeta(queueName);
    
    while (meta.head < meta.tail) {
      const id = meta.head.toString();
      meta.head++;
      await this.saveMeta(queueName, meta);
      
      const raw = await this.client.get(this.getDataKey(queueName, id));
      if (raw) {
        return { id, data: JSON.parse(raw) };
      }
      // If raw is null, it was already ack'd or deleted, continue searching
    }
    
    return null;
  }

  async ack(queueName: string, jobId: string): Promise<void> {
    await this.client.del(this.getDataKey(queueName, jobId));
  }
}
