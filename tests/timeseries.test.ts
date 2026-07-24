import { expect, test, describe, beforeAll, afterAll } from '@rstest/core';
import { createStore } from '../src/store';
import fs from 'fs';
import path from 'path';

describe('TimeSeries Domain', () => {
  const dbPath = path.join(__dirname, `test_rocksdb_timeseries_${Date.now()}_${Math.random()}`);
  let store: any;

  beforeAll(() => {
    store = createStore({ dbPath });
  });

  afterAll(async () => {
    if (store) {
      await store.close();
    }
    fs.rmSync(dbPath, { recursive: true, force: true });
  });

  test('should insert and query range', async () => {
    const ts = store.timeseries();
    
    await ts.add('cpu', [
      { timestamp: 100, value: 50 },
      { timestamp: 150, value: 60 },
      { timestamp: 200, value: 70 },
      { timestamp: 300, value: 80 }
    ]);

    const results = await ts.query('cpu', 120, 250);
    expect(results).toHaveLength(2);
    expect(results[0].timestamp).toBe(150);
    expect(results[1].timestamp).toBe(200);
  });

  test('should aggregate average properly', async () => {
    const ts = store.timeseries();
    
    // Add more points
    await ts.add('memory', [
      { timestamp: 1000, value: 10 },
      { timestamp: 1010, value: 20 },
      { timestamp: 1020, value: 30 },
      { timestamp: 1100, value: 100 },
      { timestamp: 1150, value: 100 }
    ]);

    // Aggregate with 100ms buckets, asking for 1000 to 1200
    const agg = await ts.aggregate('memory', 1000, 1200, 100, 'avg');
    
    // We expect two buckets:
    // Bucket 1000: [1000: 10, 1010: 20, 1020: 30] -> avg = 20
    // Bucket 1100: [1100: 100, 1150: 100] -> avg = 100
    expect(agg).toHaveLength(2);
    
    expect(agg[0].timestamp).toBe(1000);
    expect(agg[0].value).toBe(20);
    
    expect(agg[1].timestamp).toBe(1100);
    expect(agg[1].value).toBe(100);
  });

  test('should aggregate sum properly', async () => {
    const ts = store.timeseries();
    const agg = await ts.aggregate('memory', 1000, 1099, 100, 'sum');
    // Bucket 1000: 10 + 20 + 30 = 60
    expect(agg).toHaveLength(1);
    expect(agg[0].timestamp).toBe(1000);
    expect(agg[0].value).toBe(60);
  });
});
