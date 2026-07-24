import { expect, test, describe, beforeAll, afterAll } from '@rstest/core';
import { createStore } from '../src/store';
import fs from 'fs';
import path from 'path';

describe('Collection Domain', () => {
  const dbPath = path.join(__dirname, `test_rocksdb_collection_${Date.now()}_${Math.random()}`);
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

  test('should insert and get a document', async () => {
    const col = store.collection('users');
    await col.insert('u1', { name: 'Alice', age: 30 });
    
    const doc = await col.get('u1');
    expect(doc).toEqual({ name: 'Alice', age: 30 });
  });

  test('should update a document', async () => {
    const col = store.collection('users');
    await col.update('u1', { age: 31 });

    const doc = await col.get('u1');
    expect(doc).toEqual({ name: 'Alice', age: 31 });
  });

  test('should create index and find by indexed field', async () => {
    const col = store.collection('users');
    await col.insert('u2', { name: 'Bob', age: 25 });
    
    await col.index('age');

    const results = await col.find({ age: 25 });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Bob');

    const results2 = await col.find({ age: 31 });
    expect(results2).toHaveLength(1);
    expect(results2[0].name).toBe('Alice');
  });

  test('find with unindexed field (full scan fallback)', async () => {
    const col = store.collection('users');
    const results = await col.find({ name: 'Bob' });
    expect(results).toHaveLength(1);
    expect(results[0].age).toBe(25);
  });

  test('delete should remove document and index entries', async () => {
    const col = store.collection('users');
    await col.delete('u2');

    const doc = await col.get('u2');
    expect(doc).toBeNull();

    const results = await col.find({ age: 25 });
    expect(results).toHaveLength(0);
  });
});
