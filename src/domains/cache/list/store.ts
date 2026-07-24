import { IList } from './types';
import { IListEngine } from './engine';

export class ListStoreImpl<T = unknown> implements IList<T> {
  constructor(
    private engine: IListEngine,
    private namespace: string = '',
    private listKey: string = ''
  ) {}

  async push(value: T): Promise<number> {
    return this.engine.push(this.namespace, this.listKey, value);
  }

  async pop(): Promise<T | null> {
    return (await this.engine.pop(this.namespace, this.listKey)) as T | null;
  }

  async unshift(value: T): Promise<number> {
    return this.engine.unshift(this.namespace, this.listKey, value);
  }

  async shift(): Promise<T | null> {
    return (await this.engine.shift(this.namespace, this.listKey)) as T | null;
  }

  async range(start: number, stop: number): Promise<T[]> {
    return (await this.engine.range(this.namespace, this.listKey, start, stop)) as T[];
  }

  async len(): Promise<number> {
    return this.engine.len(this.namespace, this.listKey);
  }
}
