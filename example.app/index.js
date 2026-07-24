const { createStore } = require('@enjoys/store');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log("Initializing store from linked package...");
  const dbPath = path.join(__dirname, 'test_db');
  
  // Clean up previous run if any
  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { recursive: true, force: true });
  }

  const store = createStore({ dbPath });
  
  try {
    const kv = store.kv('myKV');
    console.log("Setting value...");
    await kv.set('test-key', 'Hello from @enjoys/store!');
    
    console.log("Getting value...");
    const value = await kv.get('test-key');
    console.log("Result:", value);
    
    if (value !== 'Hello from @enjoys/store!') {
      throw new Error("Value mismatch!");
    }
    console.log("Test passed!");
  } catch(e) {
    console.error("Test failed:", e);
  } finally {
    console.log("Closing store...");
    await store.close();
    
    console.log("Cleaning up...");
    fs.rmSync(dbPath, { recursive: true, force: true });
  }
}

run();
