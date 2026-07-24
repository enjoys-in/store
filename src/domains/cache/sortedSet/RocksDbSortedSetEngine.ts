import { ISortedSetEngine } from './engine';
import { ISortedSetMember } from './types';

export interface IRocksDbClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export class RocksDbSortedSetEngine implements ISortedSetEngine {
  constructor(private client: IRocksDbClient) {}

  private getKey(namespace: string, key: string): string {
    return `zset:data:${namespace}:${key}`;
  }

  // We load the entire set as an array of members, sorted by score.
  private async getSet(namespace: string, key: string): Promise<ISortedSetMember[]> {
    const dataStr = await this.client.get(this.getKey(namespace, key));
    if (!dataStr) return [];
    return JSON.parse(dataStr);
  }

  private async saveSet(namespace: string, key: string, set: ISortedSetMember[]): Promise<void> {
    // Ensure it's sorted by score before saving
    set.sort((a, b) => a.score - b.score);
    await this.client.put(this.getKey(namespace, key), JSON.stringify(set));
  }

  async add(namespace: string, key: string, value: any, score: number): Promise<number> {
    const set = await this.getSet(namespace, key);
    const valueStr = JSON.stringify(value);
    
    // Check if exists
    const existingIndex = set.findIndex(m => JSON.stringify(m.value) === valueStr);
    
    let added = 0;
    if (existingIndex !== -1) {
      // Update score
      set[existingIndex].score = score;
    } else {
      // Add new
      set.push({ value, score });
      added = 1;
    }
    
    await this.saveSet(namespace, key, set);
    return added;
  }

  async remove(namespace: string, key: string, value: any): Promise<number> {
    const set = await this.getSet(namespace, key);
    const valueStr = JSON.stringify(value);
    
    const initialLen = set.length;
    const filtered = set.filter(m => JSON.stringify(m.value) !== valueStr);
    
    if (filtered.length === initialLen) {
      return 0; // nothing removed
    }
    
    await this.saveSet(namespace, key, filtered);
    return 1;
  }

  async score(namespace: string, key: string, value: any): Promise<number | null> {
    const set = await this.getSet(namespace, key);
    const valueStr = JSON.stringify(value);
    
    const member = set.find(m => JSON.stringify(m.value) === valueStr);
    return member ? member.score : null;
  }

  async rank(namespace: string, key: string, value: any): Promise<number | null> {
    const set = await this.getSet(namespace, key);
    const valueStr = JSON.stringify(value);
    
    const index = set.findIndex(m => JSON.stringify(m.value) === valueStr);
    return index !== -1 ? index : null;
  }

  async range(namespace: string, key: string, start: number, stop: number): Promise<ISortedSetMember<any>[]> {
    const set = await this.getSet(namespace, key);
    
    // Normalize indices
    const len = set.length;
    if (start < 0) start = Math.max(0, len + start);
    if (stop < 0) stop = Math.max(0, len + stop);
    
    start = Math.min(start, len - 1);
    stop = Math.min(stop, len - 1);
    
    if (start > stop) return [];
    
    return set.slice(start, stop + 1);
  }

  async rangeByScore(namespace: string, key: string, min: number, max: number): Promise<ISortedSetMember<any>[]> {
    const set = await this.getSet(namespace, key);
    return set.filter(m => m.score >= min && m.score <= max);
  }

  async size(namespace: string, key: string): Promise<number> {
    const set = await this.getSet(namespace, key);
    return set.length;
  }
}
