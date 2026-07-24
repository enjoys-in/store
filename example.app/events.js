const { createStore } = require('@enjoys/store');
const path = require('path');
const fs = require('fs');

async function run() {
  const dbPath = path.join(__dirname, 'test_events_db');
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { recursive: true, force: true });

  const store = createStore({ dbPath });

  try {
    console.log("Appending events to stream...");
    await store.events.append('user_stream', 'user_created', { userId: 1, name: 'Alice' });
    await store.events.append('user_stream', 'user_updated', { userId: 1, name: 'Alice Smith' });

    console.log("Fetching events from stream...");
    const history = await store.events.getEvents('user_stream');
    
    console.log("Event History:");
    history.forEach(event => {
      console.log(`- [${event.type}]`, event.data);
    });

    console.log("Events test completed successfully.");
  } catch (e) {
    console.error("Events test failed:", e);
  } finally {
    await store.close();
    fs.rmSync(dbPath, { recursive: true, force: true });
  }
}

run();
