import { expect, test, describe, beforeAll, afterAll } from '@rstest/core';
import { createStore } from '../src/store';
import fs from 'fs';
import path from 'path';

describe('Search Domain', () => {
  const dbPath = path.join(__dirname, `test_rocksdb_search_${Date.now()}_${Math.random()}`);
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

  test('should index text and query successfully', async () => {
    const search = store.search('articles');
    
    await search.index('doc1', 'RocksDB is a fast key-value store');
    await search.index('doc2', 'Redis is an in-memory data structure store');
    await search.index('doc3', 'RocksDB rocks for embedded databases');

    const results = await search.query('rocksdb store');
    expect(results).toHaveLength(3); // doc1 and doc3 have 'rocksdb', but only doc1 has 'store'. Actually, query does OR by default, and frequency maps sum hits. So doc1 (rocksdb, store), doc3 (rocksdb).
    // doc1 should have 2 hits, doc3 1 hit, doc2 1 hit (store).
    expect(results[0]).toBe('doc1'); // highest frequency
    expect(results).toContain('doc2');
    expect(results).toContain('doc3');
  });

  test('should not return results for missing tokens', async () => {
    const search = store.search('articles');
    const results = await search.query('missingword');
    expect(results).toHaveLength(0);
  });

  test('should remove indexed text', async () => {
    const search = store.search('articles');
    await search.remove('doc1', 'RocksDB is a fast key-value store');

    // doc1 is removed, so query for "rocksdb store" should return doc3 and doc2
    const results = await search.query('rocksdb store');
    expect(results).not.toContain('doc1');
    expect(results).toContain('doc3');
    expect(results).toContain('doc2');
  });
});
