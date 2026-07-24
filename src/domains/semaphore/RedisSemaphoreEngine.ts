import { ISemaphore } from './types';

export interface IRedisSemaphoreClient {
  eval(script: string, numkeys: number, ...args: any[]): Promise<any>;
}

export class RedisSemaphoreEngine implements ISemaphore {
  constructor(private client: IRedisSemaphoreClient) {}

  async acquire(key: string, limit: number, ttlMs: number): Promise<boolean> {
    const now = Date.now();
    const script = `
      redis.call('zremrangebyscore', KEYS[1], '-inf', ARGV[1])
      local count = redis.call('zcard', KEYS[1])
      if count < tonumber(ARGV[2]) then
        redis.call('zadd', KEYS[1], ARGV[3], ARGV[4])
        return 1
      end
      return 0
    `;
    const expireTime = now + ttlMs;
    const memberId = `${expireTime}-${Math.random().toString(36).substring(2)}`;
    
    const result = await this.client.eval(script, 1, key, now.toString(), limit.toString(), expireTime.toString(), memberId);
    
    return result === 1;
  }

  async release(key: string): Promise<void> {
    const script = `
      redis.call('zremrangebyscore', KEYS[1], '-inf', ARGV[1])
      local oldest = redis.call('zrange', KEYS[1], 0, 0)
      if oldest and oldest[1] then
        redis.call('zrem', KEYS[1], oldest[1])
      end
      return 1
    `;
    await this.client.eval(script, 1, key, Date.now().toString());
  }
}
