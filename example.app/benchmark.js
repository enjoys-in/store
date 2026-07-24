const { createStore } = require('../');
const Redis = require('ioredis');
const path = require('path');
const fs = require('fs');

async function benchmark() {
  const NUM_OPERATIONS = 100000;
  console.log(`Starting benchmark with ${NUM_OPERATIONS} operations...\n`);

  // 1. Setup SSD Cache (@enjoys/store)
  const dbPath = path.join(__dirname, 'benchmark_cache_db');
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { recursive: true, force: true });
  const store = createStore({ dbPath });
  const ssdCache = store.cache('api_cache');

  // 2. Setup Redis Cache
  const redisCache = new Redis(); // defaults to localhost:6379

  try {
    // Wait for redis to connect
    await new Promise((resolve) => {
      redisCache.on('ready', resolve);
    });

    console.log('--- SSD Cache (@enjoys/store) ---');
    // ---- SSD SET Benchmark ----
    let start = Date.now();
    for (let i = 0; i < NUM_OPERATIONS; i++) {
      await ssdCache.set(`key:${i}`, `value:${i}`);
    }
    let end = Date.now();
    console.log(`SSD Cache SET: ${end - start} ms`);

    // ---- SSD GET Benchmark ----
    start = Date.now();
    for (let i = 0; i < NUM_OPERATIONS; i++) {
      await ssdCache.get(`key:${i}`);
    }
    end = Date.now();
    console.log(`SSD Cache GET: ${end - start} ms\n`);


    console.log('--- Local Redis Cache ---');
    // ---- Redis SET Benchmark ----
    start = Date.now();
    for (let i = 0; i < NUM_OPERATIONS; i++) {
      await redisCache.set(`key:${i}`, `value:${i}`);
    }
    end = Date.now();
    console.log(`Redis Cache SET: ${end - start} ms`);

    // ---- Redis GET Benchmark ----
    start = Date.now();
    for (let i = 0; i < NUM_OPERATIONS; i++) {
      await redisCache.get(`key:${i}`);
    }
    end = Date.now();
    console.log(`Redis Cache GET: ${end - start} ms\n`);

  } catch (e) {
    console.error("Benchmark failed:", e);
  } finally {
    console.log("Cleaning up...");
    await store.close();
    if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { recursive: true, force: true });
    
    // Clear redis keys we just created
    for (let i = 0; i < NUM_OPERATIONS; i++) {
      await redisCache.del(`key:${i}`);
    }
    await redisCache.quit();
  }
}

benchmark();
