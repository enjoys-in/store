import { ISortedSet, ISortedSetMember } from './types';
import { ISortedSetEngine } from './engine';

export class SortedSetStoreImpl<T = unknown> implements ISortedSet<T> {
  constructor(
    private engine: ISortedSetEngine,
    private namespace: string = '',
    private setKey: string = ''
  ) {}

  async add(value: T, score: number): Promise<number> {
    return this.engine.add(this.namespace, this.setKey, value, score);
  }

  async remove(value: T): Promise<number> {
    return this.engine.remove(this.namespace, this.setKey, value);
  }

  async score(value: T): Promise<number | null> {
    return this.engine.score(this.namespace, this.setKey, value);
  }

  async rank(value: T): Promise<number | null> {
    return this.engine.rank(this.namespace, this.setKey, value);
  }

  async range(start: number, stop: number): Promise<ISortedSetMember<T>[]> {
    return this.engine.range(this.namespace, this.setKey, start, stop);
  }

  async rangeByScore(min: number, max: number): Promise<ISortedSetMember<T>[]> {
    return this.engine.rangeByScore(this.namespace, this.setKey, min, max);
  }

  async size(): Promise<number> {
    return this.engine.size(this.namespace, this.setKey);
  }
}
