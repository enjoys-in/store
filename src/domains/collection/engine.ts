export interface ICollectionEngine {
  insert(collectionName: string, id: string, doc: unknown): Promise<void>;
  get(collectionName: string, id: string): Promise<unknown | null>;
  update(collectionName: string, id: string, doc: unknown): Promise<void>;
  delete(collectionName: string, id: string): Promise<void>;
  index(collectionName: string, field: string): Promise<void>;
  find(collectionName: string, query: Record<string, any>): Promise<unknown[]>;
}
