export interface IQueueEngine {
  push(queueName: string, data: unknown): Promise<string>;
  pop(queueName: string): Promise<{ id: string; data: unknown } | null>;
  ack(queueName: string, jobId: string): Promise<void>;
}
