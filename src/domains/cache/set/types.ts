export interface ISet<T = unknown> {
  add(value: T): Promise<number>;
  remove(value: T): Promise<number>;
  has(value: T): Promise<boolean>;
  members(): Promise<T[]>;
  size(): Promise<number>;
}

export enum SetEngineType {
  ROCKSDB = 'ROCKSDB',
}

export interface IRocksDbSetConfig {
  path?: string;
}

export type SetEngineConfig = 
  | { type: SetEngineType.ROCKSDB; config: IRocksDbSetConfig };
