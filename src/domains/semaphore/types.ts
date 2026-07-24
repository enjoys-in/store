export interface ISemaphore {
  acquire(key: string, limit: number, ttlMs: number): Promise<boolean>;
  release(key: string): Promise<void>;
}

export enum SemaphoreEngineType {
  REDIS = 'REDIS',
}

export interface IRedisSemaphoreConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

export type SemaphoreEngineConfig = 
  | { type: SemaphoreEngineType.REDIS; config: IRedisSemaphoreConfig };
