export interface ILock {
  acquire(key: string, ttlMs: number): Promise<boolean>;
  release(key: string): Promise<void>;
}

export enum LockEngineType {
  ROCKSDB = 'ROCKSDB',
}

export interface IRocksDbLockConfig {
  path?: string;
}

export type LockEngineConfig = 
  | { type: LockEngineType.ROCKSDB; config: IRocksDbLockConfig };
