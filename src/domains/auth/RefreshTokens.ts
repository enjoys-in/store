import { IKVStore } from '../kv';
import { IRefreshTokenStore } from './types';
import { createHash } from 'crypto';

export class RefreshTokenStoreImpl implements IRefreshTokenStore {
  constructor(
    private kvStore: IKVStore<string>,
    private userTokensStore: IKVStore<string[]>
  ) {}

  /**
   * Hashes a long token into a short, safe 10-character string.
   * This saves memory in the KV store and speeds up lookups.
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('base64url').substring(0, 10);
  }

  async store(token: string, userId: string): Promise<void> {
    const hashed = this.hashToken(token);
    
    // 1. Store the hashed token mapped to the user
    await this.kvStore.set(hashed, userId);

    // 2. Add the hashed token to the user's active tokens list
    const activeTokens = await this.userTokensStore.get(userId) || [];
    if (!activeTokens.includes(hashed)) {
      activeTokens.push(hashed);
      await this.userTokensStore.set(userId, activeTokens);
    }
  }

  async isValid(token: string): Promise<boolean> {
    const hashed = this.hashToken(token);
    const userId = await this.kvStore.get(hashed);
    return !!userId;
  }

  async revoke(token: string): Promise<void> {
    const hashed = this.hashToken(token);
    const userId = await this.kvStore.get(hashed);
    
    // Remove token from primary lookup
    await this.kvStore.del(hashed);

    if (userId) {
      // Remove token from secondary index
      const activeTokens = await this.userTokensStore.get(userId) || [];
      const updatedTokens = activeTokens.filter(t => t !== hashed);
      if (updatedTokens.length > 0) {
        await this.userTokensStore.set(userId, updatedTokens);
      } else {
        await this.userTokensStore.del(userId);
      }
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const activeTokens = await this.userTokensStore.get(userId) || [];
    
    // Delete all tokens from primary lookup
    for (const hashedToken of activeTokens) {
      await this.kvStore.del(hashedToken);
    }

    // Delete secondary index entry
    await this.userTokensStore.del(userId);
  }
}
