const { createStore } = require('@enjoys/store');
const path = require('path');
const fs = require('fs');

async function run() {
  const dbPath = path.join(__dirname, 'test_queue_db');
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { recursive: true, force: true });

  const store = createStore({ dbPath });
  const queue = store.queue('email_queue');

  try {
    console.log("Pushing jobs...");
    await queue.push({ to: 'alice@example.com', body: 'Hello!' });
    await queue.push({ to: 'bob@example.com', body: 'Welcome!' });

    console.log("Popping job...");
    const job = await queue.pop();
    console.log("Processing job:", job);

    console.log("Acknowledging job...");
    await queue.ack(job.id);
    
    console.log("Queue test completed successfully.");
  } catch (e) {
    console.error("Queue test failed:", e);
  } finally {
    await store.close();
    fs.rmSync(dbPath, { recursive: true, force: true });
  }
}

run();
