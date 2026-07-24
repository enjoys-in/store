export interface IRateLimiterEngine {
  consume(namespace: string, key: string, points: number, durationMs: number, maxPoints: number): Promise<boolean>;
  getRemaining(namespace: string, key: string, maxPoints: number): Promise<number>;
  reset(namespace: string, key: string): Promise<void>;
}
