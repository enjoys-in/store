export interface ICollection<T = any> {
  insert(id: string, doc: T): Promise<void>;
  get(id: string): Promise<T | null>;
  update(id: string, doc: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  index(field: string): Promise<void>;
  find(query: Record<string, any>): Promise<T[]>;
}
