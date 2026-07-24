import { ISemaphore, SemaphoreEngineConfig, SemaphoreEngineType } from './types';
import { RedisSemaphoreEngine, IRedisSemaphoreClient } from './RedisSemaphoreEngine';

export class SemaphoreFactory {
  static create(
    config: SemaphoreEngineConfig,
    client?: IRedisSemaphoreClient
  ): ISemaphore {
    switch (config.type) {
      case SemaphoreEngineType.REDIS:
        if (!client) {
          throw new Error('Client must be provided for REDIS semaphore engine');
        }
        return new RedisSemaphoreEngine(client);
      default:
        throw new Error('Unsupported Semaphore engine type');
    }
  }
}
