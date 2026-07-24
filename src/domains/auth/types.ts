export interface IJwtBlocklist {
  block(jti: string, ttlMs: number): Promise<void>;
  isBlocked(jti: string): Promise<boolean>;
}

export interface IRefreshTokenStore {
  store(token: string, userId: string): Promise<void>;
  isValid(token: string): Promise<boolean>;
  revoke(token: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export interface IAuthDomain {
  blocklist(): IJwtBlocklist;
  refreshTokens(): IRefreshTokenStore;
}
