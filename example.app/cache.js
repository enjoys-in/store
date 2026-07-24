const { createStore } = require('@enjoys/store');
const path = require('path');
const fs = require('fs');

async function run() {
  const dbPath = path.join(__dirname, 'test_cache_db');
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { recursive: true, force: true });

  const store = createStore({ dbPath });
  const cache = store.cache('api_cache');

  try {
    console.log("Setting cache value...");
    await cache.set('user:1', { name: 'Alice' }, { ttl: 60000 });
    
    console.log("Getting cache value...");
    const value = await cache.get('user:1');
    console.log("Cached Value:", value);

    console.log("Deleting cache...");
    await cache.del('user:1');
   
    const missed = await cache.get('user:1');
    console.log("After invalidation:", missed);
    
    console.log("Cache test completed successfully.");
  } catch (e) {
    console.error("Cache test failed:", e);
  } finally {
    await store.close();
    fs.rmSync(dbPath, { recursive: true, force: true });
  }
}

run();
