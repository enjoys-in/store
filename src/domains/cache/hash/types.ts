export interface IHash<T = unknown> {
  set(key: string, field: string, value: T): Promise<void>;
  get(key: string, field: string): Promise<T | null>;
  del(key: string, field: string): Promise<void>;
  setMany(key: string, fields: Record<string, T>): Promise<void>;
  getAll(key: string): Promise<Record<string, T> | null>;
}

export enum HashEngineType {
}


export type HashEngineConfig = never;