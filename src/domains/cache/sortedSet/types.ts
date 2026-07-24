export interface ISortedSetMember<T = unknown> {
  value: T;
  score: number;
}

export interface ISortedSet<T = unknown> {
  add(value: T, score: number): Promise<number>;
  remove(value: T): Promise<number>;
  score(value: T): Promise<number | null>;
  rank(value: T): Promise<number | null>;
  range(start: number, stop: number): Promise<ISortedSetMember<T>[]>;
  rangeByScore(min: number, max: number): Promise<ISortedSetMember<T>[]>;
  size(): Promise<number>;
}

export enum SortedSetEngineType {
  ROCKSDB = 'ROCKSDB',
}

export interface IRocksDbSortedSetConfig {
  path?: string;
}

export type SortedSetEngineConfig = 
  | { type: SortedSetEngineType.ROCKSDB; config: IRocksDbSortedSetConfig };
