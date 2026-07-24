import { ISearchEngine } from './engine';

export interface IRocksDbSearchClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export class RocksDbSearchEngine implements ISearchEngine {
  constructor(private client: IRocksDbSearchClient) {}

  private getTokenKey(namespace: string, token: string): string {
    return `search:${namespace}:token:${token}`;
  }

  async index(namespace: string, id: string, tokens: string[]): Promise<void> {
    for (const token of tokens) {
      const key = this.getTokenKey(namespace, token);
      const existing = await this.client.get(key);
      let ids: string[] = [];
      if (existing) {
        try {
          ids = JSON.parse(existing);
        } catch(e) {}
      }
      if (!ids.includes(id)) {
        ids.push(id);
        await this.client.put(key, JSON.stringify(ids));
      }
    }
  }

  async query(namespace: string, tokens: string[]): Promise<string[]> {
    if (tokens.length === 0) return [];

    const frequencyMap = new Map<string, number>();

    for (const token of tokens) {
      const key = this.getTokenKey(namespace, token);
      const existing = await this.client.get(key);
      if (existing) {
        try {
          const ids: string[] = JSON.parse(existing);
          for (const id of ids) {
            frequencyMap.set(id, (frequencyMap.get(id) || 0) + 1);
          }
        } catch(e) {}
      }
    }

    const sortedIds = Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    return sortedIds;
  }

  async remove(namespace: string, id: string, tokens: string[]): Promise<void> {
    for (const token of tokens) {
      const key = this.getTokenKey(namespace, token);
      const existing = await this.client.get(key);
      if (existing) {
        try {
          let ids: string[] = JSON.parse(existing);
          const index = ids.indexOf(id);
          if (index !== -1) {
            ids.splice(index, 1);
            if (ids.length === 0) {
              await this.client.del(key);
            } else {
              await this.client.put(key, JSON.stringify(ids));
            }
          }
        } catch(e) {}
      }
    }
  }
}
