import { describe, it, expect, beforeEach, afterEach, rs } from '@rstest/core';
import { BackgroundWorker, WorkerStatus } from './Worker';
import { IQueue, Job } from '../queue';
import { ILock } from '../lock';

describe('BackgroundWorker', () => {
  let mockQueue: IQueue<any>;
  let mockLock: ILock;
  let mockHandler: ReturnType<typeof rs.fn>;

  beforeEach(() => {
    rs.useFakeTimers();

    mockQueue = {
      push: rs.fn(),
      pop: rs.fn(),
      ack: rs.fn(),
    };

    mockLock = {
      acquire: rs.fn(),
      release: rs.fn(),
    };

    mockHandler = rs.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    rs.clearAllMocks();
    rs.useRealTimers();
  });

  describe('Initialization and Status', () => {
    it('should initialize with IDLE status', () => {
      const worker = new BackgroundWorker(mockQueue, mockHandler);
      expect(worker.getStatus()).toBe(WorkerStatus.IDLE);
    });

    it('should change status to RUNNING when started', () => {
      const worker = new BackgroundWorker(mockQueue, mockHandler);
      worker.start();
      expect(worker.getStatus()).toBe(WorkerStatus.RUNNING);
      worker.stop();
    });

    it('should change status to STOPPED when stopped', () => {
      const worker = new BackgroundWorker(mockQueue, mockHandler);
      worker.start();
      worker.stop();
      expect(worker.getStatus()).toBe(WorkerStatus.STOPPED);
    });

    it('start should be idempotent', () => {
      const worker = new BackgroundWorker(mockQueue, mockHandler);
      worker.start();
      worker.start();
      expect(worker.getStatus()).toBe(WorkerStatus.RUNNING);
      worker.stop();
    });
  });

  describe('Polling and Job Processing', () => {
    it('should process a job successfully without a lock', async () => {
      const mockJob: Job<string> = { id: 'job-1', data: 'test-data' };
      rs.mocked(mockQueue.pop).mockResolvedValueOnce(mockJob).mockResolvedValue(null);

      const worker = new BackgroundWorker(mockQueue, mockHandler);
      worker.start();

      await rs.runOnlyPendingTimersAsync();

      expect(mockQueue.pop).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalledWith(mockJob);
      expect(mockQueue.ack).toHaveBeenCalledWith('job-1');
      worker.stop();
    });

    it('should process a job successfully with a lock', async () => {
      const mockJob: Job<string> = { id: 'job-2', data: 'test-data' };
      rs.mocked(mockQueue.pop).mockResolvedValueOnce(mockJob).mockResolvedValue(null);
      rs.mocked(mockLock.acquire).mockResolvedValue(true);

      const worker = new BackgroundWorker(mockQueue, mockHandler, mockLock);
      worker.start();

      await rs.runOnlyPendingTimersAsync();

      expect(mockLock.acquire).toHaveBeenCalledWith('worker:lock:job-2', 30000);
      expect(mockHandler).toHaveBeenCalledWith(mockJob);
      expect(mockQueue.ack).toHaveBeenCalledWith('job-2');
      expect(mockLock.release).toHaveBeenCalledWith('worker:lock:job-2');
      worker.stop();
    });

    it('should not process job if lock acquisition fails', async () => {
      const mockJob: Job<string> = { id: 'job-3', data: 'test-data' };
      rs.mocked(mockQueue.pop).mockResolvedValueOnce(mockJob).mockResolvedValue(null);
      rs.mocked(mockLock.acquire).mockResolvedValue(false);
      
      const onLockFailed = rs.fn();

      const worker = new BackgroundWorker(mockQueue, mockHandler, mockLock, { onLockFailed });
      worker.start();

      await rs.runOnlyPendingTimersAsync();

      expect(mockLock.acquire).toHaveBeenCalled();
      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockQueue.ack).not.toHaveBeenCalled();
      expect(onLockFailed).toHaveBeenCalledWith(mockJob);
      expect(mockLock.release).not.toHaveBeenCalled();
      worker.stop();
    });

    it('should handle handler error and call onError hook', async () => {
      const mockJob: Job<string> = { id: 'job-4', data: 'test-data' };
      const testError = new Error('Handler failed');
      
      rs.mocked(mockQueue.pop).mockResolvedValueOnce(mockJob).mockResolvedValue(null);
      mockHandler.mockRejectedValueOnce(testError);
      
      const onError = rs.fn();

      const worker = new BackgroundWorker(mockQueue, mockHandler, undefined, { onError });
      worker.start();

      await rs.runOnlyPendingTimersAsync();

      expect(mockHandler).toHaveBeenCalledWith(mockJob);
      expect(mockQueue.ack).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(testError, mockJob);
      worker.stop();
    });

    it('should ensure lock is released even if handler fails', async () => {
      const mockJob: Job<string> = { id: 'job-5', data: 'test-data' };
      rs.mocked(mockQueue.pop).mockResolvedValueOnce(mockJob).mockResolvedValue(null);
      rs.mocked(mockLock.acquire).mockResolvedValue(true);
      mockHandler.mockRejectedValueOnce(new Error('Handler error'));
      
      const worker = new BackgroundWorker(mockQueue, mockHandler, mockLock);
      worker.start();

      await rs.runOnlyPendingTimersAsync();

      expect(mockLock.acquire).toHaveBeenCalled();
      expect(mockHandler).toHaveBeenCalled();
      expect(mockLock.release).toHaveBeenCalledWith('worker:lock:job-5');
      worker.stop();
    });
    
    it('should handle queue polling errors gracefully and call onPollError', async () => {
      const pollError = new Error('Queue unavailable');
      rs.mocked(mockQueue.pop).mockRejectedValueOnce(pollError);
      
      const onPollError = rs.fn();
      
      const worker = new BackgroundWorker(mockQueue, mockHandler, undefined, { onPollError });
      worker.start();

      await rs.runOnlyPendingTimersAsync();

      expect(onPollError).toHaveBeenCalledWith(pollError);
      worker.stop();
    });
    
    it('should continue polling after finding a job (0 delay)', async () => {
      const mockJob1: Job<string> = { id: 'job-6', data: 'test-data-1' };
      const mockJob2: Job<string> = { id: 'job-7', data: 'test-data-2' };
      
      rs.mocked(mockQueue.pop)
        .mockResolvedValueOnce(mockJob1)
        .mockResolvedValueOnce(mockJob2)
        .mockResolvedValue(null);
        
      const worker = new BackgroundWorker(mockQueue, mockHandler);
      worker.start();

      // Run pending timer for first poll
      await rs.runOnlyPendingTimersAsync();
      
      expect(mockHandler).toHaveBeenCalledTimes(2);
      expect(mockHandler).toHaveBeenCalledWith(mockJob1);
      expect(mockHandler).toHaveBeenCalledWith(mockJob2);
      worker.stop();
    });
    
    it('should respect pollingIntervalMs when no job is found', async () => {
      rs.mocked(mockQueue.pop).mockResolvedValue(null);
      
      const worker = new BackgroundWorker(mockQueue, mockHandler, undefined, { pollingIntervalMs: 5000 });
      worker.start();
      
      // Wait for the first poll promise to resolve
      await new Promise(resolve => process.nextTick(resolve));
      expect(mockQueue.pop).toHaveBeenCalledTimes(1);
      
      await rs.advanceTimersByTimeAsync(4999);
      expect(mockQueue.pop).toHaveBeenCalledTimes(1); // Not called yet
      
      await rs.advanceTimersByTimeAsync(1);
      expect(mockQueue.pop).toHaveBeenCalledTimes(2); // Called after 5000ms total
      
      worker.stop();
    });

    it('should trigger onSuccess hook after successful processing', async () => {
      const mockJob: Job<string> = { id: 'job-8', data: 'test-data' };
      rs.mocked(mockQueue.pop).mockResolvedValueOnce(mockJob).mockResolvedValue(null);
      const onSuccess = rs.fn();

      const worker = new BackgroundWorker(mockQueue, mockHandler, undefined, { onSuccess });
      worker.start();

      await rs.runOnlyPendingTimersAsync();

      expect(onSuccess).toHaveBeenCalledWith(mockJob);
      worker.stop();
    });
  });
});
