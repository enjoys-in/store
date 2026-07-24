import { expect, test, describe, beforeAll, afterAll } from '@rstest/core';
import { createStore } from '../src/store';
import fs from 'fs';
import path from 'path';

describe('WriteBatch & Initialization', () => {
  const dbPath = path.join(__dirname, `test_rocksdb_batch_${Date.now()}_${Math.random()}`);
  let store: any;

  beforeAll(() => {
    // Testing initialization bindings by passing rocksdbOptions
    store = createStore({ 
      dbPath,
      rocksdbOptions: {
        errorIfExists: false, // Testing option pass-through
        createIfMissing: true,
        // Some rocksdb bindings might support these:
        // compression: true,
        // maxOpenFiles: 100
      }
    });
  });

  afterAll(async () => {
    if (store) {
      await store.close();
    }
    fs.rmSync(dbPath, { recursive: true, force: true });
  });

  test('should execute batch operations atomically', async () => {
    const kv = store.kv('testbatch');
    
    // Initial data
    await kv.set('key1', 'val1');
    await kv.set('key2', 'val2');

    // Batch execute
    console.log("Before batch");
    await store.batch([
      { type: 'put', key: 'testbatch:key3', value: JSON.stringify('val3') },
      { type: 'del', key: 'testbatch:key1' },
      { type: 'put', key: 'testbatch:key2', value: JSON.stringify('val2-updated') }
    ]);
    console.log("After batch");

    const val1 = await kv.get('key1');
    const val2 = await kv.get('key2');
    const val3 = await kv.get('key3');

    expect(val1).toBeNull();
    expect(val2).toBe('val2-updated');
    expect(val3).toBe('val3');
  });
});
