import { IQueue, Job } from '../queue';
import { ILock } from '../lock';

export type JobHandler<T> = (job: Job<T>) => Promise<void>;

export interface WorkerHooks<T> {
  onSuccess?: (job: Job<T>) => void | Promise<void>;
  onError?: (error: Error, job: Job<T>) => void | Promise<void>;
  onPollError?: (error: Error) => void | Promise<void>;
  onLockFailed?: (job: Job<T>) => void | Promise<void>;
}

export interface WorkerOptions<T> extends WorkerHooks<T> {
  pollingIntervalMs?: number;
  lockTtlMs?: number;
}

export enum WorkerStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
}

export class BackgroundWorker<T = unknown> {
  private queue: IQueue<T>;
  private lock?: ILock;
  private handler: JobHandler<T>;
  private options: Required<Omit<WorkerOptions<T>, keyof WorkerHooks<T>>> & WorkerHooks<T>;
  private status: WorkerStatus = WorkerStatus.IDLE;
  private timerId?: NodeJS.Timeout;

  constructor(queue: IQueue<T>, handler: JobHandler<T>, lock?: ILock, options?: WorkerOptions<T>) {
    this.queue = queue;
    this.handler = handler;
    this.lock = lock;
    this.options = {
      pollingIntervalMs: options?.pollingIntervalMs || 1000,
      lockTtlMs: options?.lockTtlMs || 30000,
      onSuccess: options?.onSuccess,
      onError: options?.onError,
      onPollError: options?.onPollError,
      onLockFailed: options?.onLockFailed,
    };
  }

  public getStatus(): WorkerStatus {
    return this.status;
  }

  public start(): void {
    if (this.status === WorkerStatus.RUNNING) return;
    this.status = WorkerStatus.RUNNING;
    this.poll();
  }

  public stop(): void {
    this.status = WorkerStatus.STOPPED;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = undefined;
    }
  }

  private poll = async (): Promise<void> => {
    if (this.status !== WorkerStatus.RUNNING) return;

    try {
      const job = await this.queue.pop();
      if (job) {
        let lockAcquired = true;
        const lockKey = `worker:lock:${job.id}`;

        if (this.lock) {
          lockAcquired = await this.lock.acquire(lockKey, this.options.lockTtlMs);
        }

        if (lockAcquired) {
          try {
            await this.handler(job);
            await this.queue.ack(job.id);
            if (this.options.onSuccess) {
              await this.options.onSuccess(job);
            }
          } catch (error) {
            if (this.options.onError) {
              await this.options.onError(error instanceof Error ? error : new Error(String(error)), job);
            } else {
              console.error(`Error processing job ${job.id}:`, error);
            }
          } finally {
            if (this.lock) {
              await this.lock.release(lockKey);
            }
          }
        } else {
          if (this.options.onLockFailed) {
            await this.options.onLockFailed(job);
          }
        }
        
        // If we found a job, poll immediately for the next one
        if (this.status === WorkerStatus.RUNNING) {
           this.timerId = setTimeout(this.poll, 0);
           return;
        }
      }
    } catch (err) {
      if (this.options.onPollError) {
        await this.options.onPollError(err instanceof Error ? err : new Error(String(err)));
      } else {
        console.error('Error polling queue:', err);
      }
    }

    if (this.status === WorkerStatus.RUNNING) {
      this.timerId = setTimeout(this.poll, this.options.pollingIntervalMs);
    }
  };
}
