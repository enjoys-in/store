const { createStore } = require('@enjoys/store');
const path = require('path');
const fs = require('fs');

async function run() {
  const dbPath = path.join(__dirname, 'test_ts_db');
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { recursive: true, force: true });

  const store = createStore({ dbPath });
  const ts = store.timeseries('metrics');

  try {
    const now = Date.now();
    
    console.log("Adding timeseries data...");
    await ts.add('metrics', { timestamp: now - 5000, value: 10, tags: { host: 'server1' } });
    await ts.add('metrics', { timestamp: now - 1000, value: 15, tags: { host: 'server1' } });
    await ts.add('metrics', { timestamp: now, value: 20, tags: { host: 'server2' } });

    console.log("Querying timeseries data...");
    const results = await ts.query('metrics', now - 6000, now);

    console.log("Query Results:", results);
    
    console.log("TimeSeries test completed successfully.");
  } catch (e) {
    console.error("TimeSeries test failed:", e);
  } finally {
    await store.close();
    fs.rmSync(dbPath, { recursive: true, force: true });
  }
}

run();
