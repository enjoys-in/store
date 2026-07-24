import { describe, it, expect, beforeEach, rs } from '@rstest/core';
import { QueueStoreImpl } from './store';
import { RocksDbQueueEngine, IRocksDbClient } from './RocksDbEngine';
import { QueueFactory } from './QueueFactory';
import { QueueEngineType } from './types';

describe('Queue Domain', () => {
  describe('RocksDbQueueEngine', () => {
    let mockClient: IRocksDbClient;
    let engine: RocksDbQueueEngine;

    beforeEach(() => {
      mockClient = {
        get: rs.fn().mockResolvedValue(null),
        put: rs.fn().mockResolvedValue(undefined),
        del: rs.fn().mockResolvedValue(undefined),
      };
      engine = new RocksDbQueueEngine({ path: 'test_db' }, mockClient);
    });

    it('should push a job and update meta', async () => {
      const data = { foo: 'bar' };
      const jobId = await engine.push('my_queue', data);

      expect(jobId).toBe('0');
      // Should put data
      expect(mockClient.put).toHaveBeenCalledWith('__qdata__:my_queue:0', JSON.stringify(data));
      // Should put meta
      expect(mockClient.put).toHaveBeenCalledWith('__qmeta__:my_queue', JSON.stringify({ head: 0, tail: 1 }));
    });

    it('should pop a job correctly and advance head', async () => {
      rs.mocked(mockClient.get).mockImplementation(async (key: string) => {
        if (key === '__qmeta__:my_queue') return JSON.stringify({ head: 0, tail: 1 });
        if (key === '__qdata__:my_queue:0') return JSON.stringify({ test: 'job' });
        return null;
      });

      const result = await engine.pop('my_queue');

      expect(result).toEqual({ id: '0', data: { test: 'job' } });
      // Head advances to 1
      expect(mockClient.put).toHaveBeenCalledWith('__qmeta__:my_queue', JSON.stringify({ head: 1, tail: 1 }));
    });

    it('should return null when popping an empty queue', async () => {
      rs.mocked(mockClient.get).mockImplementation(async (key: string) => {
        if (key === '__qmeta__:my_queue') return JSON.stringify({ head: 1, tail: 1 });
        return null;
      });

      const result = await engine.pop('my_queue');
      expect(result).toBeNull();
    });

    it('should skip null data (already acked) when popping', async () => {
      rs.mocked(mockClient.get).mockImplementation(async (key: string) => {
        if (key === '__qmeta__:my_queue') return JSON.stringify({ head: 0, tail: 2 });
        if (key === '__qdata__:my_queue:0') return null; // skipped
        if (key === '__qdata__:my_queue:1') return JSON.stringify({ val: 2 });
        return null;
      });

      const result = await engine.pop('my_queue');

      expect(result).toEqual({ id: '1', data: { val: 2 } });
      // Meta updated twice (for head=1, and head=2)
      expect(mockClient.put).toHaveBeenCalledWith('__qmeta__:my_queue', JSON.stringify({ head: 1, tail: 2 }));
      expect(mockClient.put).toHaveBeenCalledWith('__qmeta__:my_queue', JSON.stringify({ head: 2, tail: 2 }));
    });

    it('should delete data on ack', async () => {
      await engine.ack('my_queue', '123');
      expect(mockClient.del).toHaveBeenCalledWith('__qdata__:my_queue:123');
    });
  });

  describe('QueueStoreImpl', () => {
    it('should delegate methods to engine', async () => {
      const mockEngine = {
        push: rs.fn().mockResolvedValue('id-1'),
        pop: rs.fn().mockResolvedValue({ id: 'id-1', data: 'data' }),
        ack: rs.fn().mockResolvedValue(undefined),
      };

      const store = new QueueStoreImpl(mockEngine, 'test_queue');

      await store.push('new_data');
      expect(mockEngine.push).toHaveBeenCalledWith('test_queue', 'new_data');

      await store.pop();
      expect(mockEngine.pop).toHaveBeenCalledWith('test_queue');

      await store.ack('id-1');
      expect(mockEngine.ack).toHaveBeenCalledWith('test_queue', 'id-1');
    });
  });

  describe('QueueFactory', () => {
    it('should create RocksDbQueueEngine via QueueStoreImpl', () => {
      const mockClient = { get: rs.fn(), put: rs.fn(), del: rs.fn() };
      const queue = QueueFactory.create({ type: QueueEngineType.ROCKSDB, config: {} }, 'test_queue', mockClient);
      
      expect(queue).toBeInstanceOf(QueueStoreImpl);
      // We can't directly check the private engine, but the factory shouldn't throw
    });

    it('should throw when creating RocksDB without client', () => {
      expect(() => {
        QueueFactory.create({ type: QueueEngineType.ROCKSDB, config: {} }, 'test_queue');
      }).toThrow('Client must be provided for ROCKSDB engine');
    });

    it('should throw on unknown engine type', () => {
      expect(() => {
        QueueFactory.create({ type: 'UNKNOWN' as any, config: {} }, 'test_queue');
      }).toThrow('Unsupported Queue engine type');
    });
  });
});
