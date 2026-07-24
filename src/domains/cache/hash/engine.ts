export interface IHashEngine {
  set(namespace: string, key: string, field: string, value: any): Promise<void>;
  get(namespace: string, key: string, field: string): Promise<any | null>;
  del(namespace: string, key: string, field: string): Promise<void>;
  setMany(namespace: string, key: string, fields: Record<string, any>): Promise<void>;
  getAll(namespace: string, key: string): Promise<Record<string, any> | null>;
}
