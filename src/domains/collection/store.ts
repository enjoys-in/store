import { ICollection } from './types';
import { ICollectionEngine } from './engine';

export class CollectionStoreImpl<T = any> implements ICollection<T> {
  constructor(private engine: ICollectionEngine, private collectionName: string) {}

  async insert(id: string, doc: T): Promise<void> {
    return this.engine.insert(this.collectionName, id, doc);
  }

  async get(id: string): Promise<T | null> {
    const doc = await this.engine.get(this.collectionName, id);
    return doc as T | null;
  }

  async update(id: string, doc: Partial<T>): Promise<void> {
    return this.engine.update(this.collectionName, id, doc);
  }

  async delete(id: string): Promise<void> {
    return this.engine.delete(this.collectionName, id);
  }

  async index(field: string): Promise<void> {
    return this.engine.index(this.collectionName, field);
  }

  async find(query: Record<string, any>): Promise<T[]> {
    const docs = await this.engine.find(this.collectionName, query);
    return docs as T[];
  }
}
