export interface Job<T = unknown> {
  id: string;
  data: T;
}

export interface IQueue<T = unknown> {
  push(data: T): Promise<string>;
  pop(): Promise<Job<T> | null>;
  ack(jobId: string): Promise<void>;
}

export enum QueueEngineType {
  ROCKSDB = 'ROCKSDB',
}

export interface IRocksDbQueueConfig {
  path?: string;
}


export type QueueEngineConfig = 
  | { type: QueueEngineType.ROCKSDB; config: IRocksDbQueueConfig };
