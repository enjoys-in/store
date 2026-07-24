import { ISet } from './types';
import { ISetEngine } from './engine';

export class SetStoreImpl<T = unknown> implements ISet<T> {
  constructor(
    private engine: ISetEngine,
    private namespace: string = '',
    private setKey: string = ''
  ) {}

  async add(value: T): Promise<number> {
    return this.engine.add(this.namespace, this.setKey, value);
  }

  async remove(value: T): Promise<number> {
    return this.engine.remove(this.namespace, this.setKey, value);
  }

  async has(value: T): Promise<boolean> {
    return this.engine.has(this.namespace, this.setKey, value);
  }

  async members(): Promise<T[]> {
    return (await this.engine.members(this.namespace, this.setKey)) as T[];
  }

  async size(): Promise<number> {
    return this.engine.size(this.namespace, this.setKey);
  }
}
