import { IRateLimiter, RateLimiterConfig } from './types';
import { IRateLimiterEngine } from './engine';

export class RateLimiterStoreImpl implements IRateLimiter {
  constructor(
    private engine: IRateLimiterEngine,
    private namespace: string,
    private config: RateLimiterConfig
  ) {}

  async consume(key: string, points: number = 1): Promise<boolean> {
    return this.engine.consume(this.namespace, key, points, this.config.durationMs, this.config.maxPoints);
  }

  async getRemaining(key: string): Promise<number> {
    return this.engine.getRemaining(this.namespace, key, this.config.maxPoints);
  }

  async reset(key: string): Promise<void> {
    return this.engine.reset(this.namespace, key);
  }
}
