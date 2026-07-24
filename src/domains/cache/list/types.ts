export interface IList<T = unknown> {
  push(value: T): Promise<number>;
  pop(): Promise<T | null>;
  unshift(value: T): Promise<number>;
  shift(): Promise<T | null>;
  range(start: number, stop: number): Promise<T[]>;
  len(): Promise<number>;
}

export enum ListEngineType {
  ROCKSDB = 'ROCKSDB',
}

export interface IRocksDbListConfig {
  path?: string;
}

export type ListEngineConfig = 
  | { type: ListEngineType.ROCKSDB; config: IRocksDbListConfig };
