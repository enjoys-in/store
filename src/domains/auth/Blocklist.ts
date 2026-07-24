import { ICache } from '../cache';
import { IJwtBlocklist } from './types';

export class JwtBlocklistImpl implements IJwtBlocklist {
  constructor(private cacheStore: ICache<boolean>) {}

  async block(jti: string, ttlMs: number): Promise<void> {
    // Only store it if there's an actual TTL left
    if (ttlMs > 0) {
      await this.cacheStore.set(jti, true, ttlMs);
    }
  }

  async isBlocked(jti: string): Promise<boolean> {
    const isBlocked = await this.cacheStore.get(jti);
    return isBlocked === true;
  }
}
