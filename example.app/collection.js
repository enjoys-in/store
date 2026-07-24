const { createStore } = require('@enjoys/store');
const path = require('path');
const fs = require('fs');

async function run() {
  const dbPath = path.join(__dirname, 'test_col_db');
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { recursive: true, force: true });

  const store = createStore({ dbPath });
  const col = store.collection('users');

  try {
    console.log("Inserting documents...");
    await col.insert('u1', { name: 'Alice', role: 'admin' });
    await col.insert('u2', { name: 'Bob', role: 'user' });

    console.log("Fetching document u1...");
    const u1 = await col.get('u1');
    console.log("User 1:", u1);

    console.log("Indexing role field...");
    await col.index('role');

    console.log("Finding users by role...");
    const admins = await col.find({ role: 'admin' });
    console.log("Admins:", admins);

    console.log("Collection test completed successfully.");
  } catch (e) {
    console.error("Collection test failed:", e);
  } finally {
    await store.close();
    fs.rmSync(dbPath, { recursive: true, force: true });
  }
}

run();
