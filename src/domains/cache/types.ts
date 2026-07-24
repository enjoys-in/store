export enum CacheEngineType {
  ROCKSDB_LRU = 'ROCKSDB_LRU',
  ROCKSDB_REDIS = 'ROCKSDB_REDIS',
}

export interface ICache<T = unknown> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttlMs?: number): Promise<void>;
  setNX?(key: string, value: T, ttlMs?: number): Promise<boolean>;
  del(key: string): Promise<void>;
  peek?(key: string): Promise<T | null>;
  has?(key: string): Promise<boolean>;
  clear?(): Promise<void>;
  size?(): Promise<number>;
  
  // Scoped Data Structures
  getList<U = T>(key: string): import('./list').IList<U>;
  getSet<U = T>(key: string): import('./set').ISet<U>;
  getSortedSet<U = T>(key: string): import('./sortedSet').ISortedSet<U>;
  
  // Advanced Data Structures
  setBit?(key: string, offset: number, value: number): Promise<number>;
  getBit?(key: string, offset: number): Promise<number>;
  pfAdd?(key: string, items: string[]): Promise<number>;
  pfCount?(key: string): Promise<number>;
  bfAdd?(key: string, item: string): Promise<boolean>;
  bfExists?(key: string, item: string): Promise<boolean>;
  geoAdd?(key: string, longitude: number, latitude: number, member: string): Promise<number>;
  geoSearch?(key: string, longitude: number, latitude: number, radius: number, unit: string): Promise<string[]>;
  
  // Hash Operations
  hset?(key: string, field: string, value: any): Promise<void>;
  hget?(key: string, field: string): Promise<any>;
  hdel?(key: string, field: string): Promise<void>;
}

export interface IRocksDbCacheConfig {
  maxSize: number;
  dispose?: (key: string, value: any) => void;
  pruneIntervalMs?: number;
}

export interface IRocksDbRedisCacheConfig {
  path?: string;
}

export type CacheEngineConfig =
  | { type: CacheEngineType.ROCKSDB_LRU; config: IRocksDbCacheConfig }
  | { type: CacheEngineType.ROCKSDB_REDIS; config: IRocksDbRedisCacheConfig };
