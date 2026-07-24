export interface ICacheEngine {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttlMs?: number): Promise<void>;
  setNX?(key: string, value: any, ttlMs?: number): Promise<boolean>;
  del(key: string): Promise<void>;
  peek?(key: string): Promise<any>;
  has?(key: string): Promise<boolean>;
  clear?(): Promise<void>;
  size?(): Promise<number>;

  // Sub-engines for complex data structures
  getListEngine?(): import('./list/engine').IListEngine;
  getSetEngine?(): import('./set/engine').ISetEngine;
  getSortedSetEngine?(): import('./sortedSet/engine').ISortedSetEngine;

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
