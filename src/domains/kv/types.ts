export interface IKVStore<T = unknown> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;

  // Atomic operations
  incr(key: string, by?: number): Promise<number>;
  decr(key: string, by?: number): Promise<number>;
  cas(key: string, oldValue: T | null, newValue: T): Promise<boolean>;

  // Reactivity
  watch(pattern: string, callback: WatchCallback<T>): void;
}

export interface WatchEvent<T = unknown> {
  key: string;
  operation: 'set' | 'del' | 'incr' | 'decr' | 'cas';
  value?: T;
}

export type WatchCallback<T> = (event: WatchEvent<T>) => void;

export enum KVEngineType {
  ROCKSDB = 'ROCKSDB',
}

export interface IRocksDbKVConfig {
  path?: string;
}

export type KVEngineConfig =
  | { type: KVEngineType.ROCKSDB; config: IRocksDbKVConfig };
