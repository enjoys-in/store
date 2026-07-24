export interface RateLimiterConfig {
  maxPoints: number;
  durationMs: number;
}

export interface IRateLimiter {
  consume(key: string, points?: number): Promise<boolean>;
  getRemaining(key: string): Promise<number>;
  reset(key: string): Promise<void>;
}

export enum RateLimiterEngineType {
  ROCKSDB = 'ROCKSDB',
}


export type RateLimiterEngineConfig = never;