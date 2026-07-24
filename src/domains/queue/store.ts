import { IQueue, Job } from './types';
import { IQueueEngine } from './engine';

export class QueueStoreImpl<T> implements IQueue<T> {
  constructor(private engine: IQueueEngine, private queueName: string) {}

  async push(data: T): Promise<string> {
    return this.engine.push(this.queueName, data);
  }

  async pop(): Promise<Job<T> | null> {
    return (await this.engine.pop(this.queueName)) as Job<T> | null;
  }

  async ack(jobId: string): Promise<void> {
    return this.engine.ack(this.queueName, jobId);
  }
}
