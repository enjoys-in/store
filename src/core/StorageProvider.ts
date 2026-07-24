import { type IKVEngine } from "../domains/kv";
import { type IQueueEngine } from "../domains/queue";
import { type ICacheEngine } from "../domains/cache";
import { type IStreamEngine } from "../domains/stream";
import { type IBrokerEngine } from "../domains/broker";
import { type IRateLimiterEngine } from "../domains/rateLimiter";
import { type ISessionEngine } from "../domains/sessions";
import { type ILock } from "../domains/lock";
import { type ISemaphore } from "../domains/semaphore";
import { type IRwLock } from "../domains/rwlock";
import { type IEventEngine } from "../domains/events";
import { type ICollectionEngine } from "../domains/collection";
import { type ISearchEngine } from "../domains/search";
import { type ITimeSeriesEngine } from "../domains/timeseries";


export interface StorageProvider {
  close?(): Promise<void>;
  batch?(operations: Array<{ type: 'put' | 'del'; key: string; value?: string }>): Promise<void>;
  getKVEngine(): IKVEngine;
  getQueueEngine(): IQueueEngine;
  getCacheEngine(): ICacheEngine;
  getStreamEngine(): IStreamEngine;
  getEventEngine(): IEventEngine;
  getCollectionEngine(): ICollectionEngine;
  getSearchEngine(): ISearchEngine;
  getTimeSeriesEngine(): ITimeSeriesEngine;
  getBrokerEngine(): IBrokerEngine;
  getRateLimiterEngine(): IRateLimiterEngine;
  getSessionEngine(): ISessionEngine;
  getLockEngine(): ILock;
  getSemaphoreEngine(): ISemaphore;
  getRwLockEngine(): IRwLock;
}
