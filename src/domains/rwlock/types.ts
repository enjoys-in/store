export interface IRwLock {
  acquireRead(key: string, ttlMs: number): Promise<boolean>;
  acquireWrite(key: string, ttlMs: number): Promise<boolean>;
  release(key: string): Promise<void>;
}

export enum RwLockEngineType {
  ROCKSDB = 'ROCKSDB',
}

export interface IRocksDbRwLockConfig {
  path?: string;
}

export type RwLockEngineConfig = 
  | { type: RwLockEngineType.ROCKSDB; config: IRocksDbRwLockConfig };
