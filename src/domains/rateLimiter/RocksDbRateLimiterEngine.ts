import { IRateLimiterEngine } from './engine';

export interface IRocksDbRateLimiterClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

interface RateLimitData {
  tokens: number;
  lastUpdated: number;
}

export class RocksDbRateLimiterEngine implements IRateLimiterEngine {
  constructor(private client: IRocksDbRateLimiterClient) {}

  private getKey(namespace: string, key: string) {
    return `${namespace}:ratelimit:${key}`;
  }

  private async getState(fullKey: string, maxPoints: number, durationMs: number): Promise<RateLimitData> {
    const data = await this.client.get(fullKey);
    const now = Date.now();
    if (!data) {
      return { tokens: maxPoints, lastUpdated: now };
    }
    try {
      const parsed: RateLimitData = JSON.parse(data);
      const timePassed = now - parsed.lastUpdated;
      
      if (timePassed >= durationMs) {
        return { tokens: maxPoints, lastUpdated: now };
      }
      
      const refillRate = maxPoints / durationMs;
      const tokensToAdd = timePassed * refillRate;
      const newTokens = Math.min(maxPoints, parsed.tokens + tokensToAdd);
      
      return { tokens: newTokens, lastUpdated: now };
    } catch (e) {
      return { tokens: maxPoints, lastUpdated: now };
    }
  }

  async consume(namespace: string, key: string, points: number, durationMs: number, maxPoints: number): Promise<boolean> {
    const fullKey = this.getKey(namespace, key);
    const state = await this.getState(fullKey, maxPoints, durationMs);
    
    if (state.tokens >= points) {
      state.tokens -= points;
      await this.client.put(fullKey, JSON.stringify(state));
      return true;
    }
    
    return false;
  }

  async getRemaining(namespace: string, key: string, maxPoints: number): Promise<number> {
    const fullKey = this.getKey(namespace, key);
    const data = await this.client.get(fullKey);
    if (!data) return maxPoints;
    try {
      const parsed: RateLimitData = JSON.parse(data);
      return Math.floor(parsed.tokens);
    } catch (e) {
      return maxPoints;
    }
  }

  async reset(namespace: string, key: string): Promise<void> {
    await this.client.del(this.getKey(namespace, key));
  }
}
