import { RateLimiterStoreImpl } from './store';
import { IRateLimiter, RateLimiterEngineConfig, RateLimiterEngineType, RateLimiterConfig } from './types';
import { RocksDbRateLimiterEngine, IRocksDbRateLimiterClient } from './RocksDbRateLimiterEngine';

export class RateLimiterFactory {
  static create(
    engineConfig: RateLimiterEngineConfig,
    namespace: string,
    config: RateLimiterConfig,
    client?: IRocksDbRateLimiterClient
  ): IRateLimiter {
    let engine;

    switch ((engineConfig as unknown as { type: string }).type) {
      case RateLimiterEngineType.ROCKSDB:
        if (!client) throw new Error('Client must be provided for ROCKSDB engine');
        engine = new RocksDbRateLimiterEngine(client);
        break;
      default:
        throw new Error('Unsupported Rate Limiter engine type');
    }

    return new RateLimiterStoreImpl(engine, namespace, config);
  }
}
