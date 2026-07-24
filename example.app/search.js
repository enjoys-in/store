const { createStore } = require('@enjoys/store');
const path = require('path');
const fs = require('fs');

async function run() {
  const dbPath = path.join(__dirname, 'test_search_db');
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { recursive: true, force: true });

  const store = createStore({ dbPath });
  const search = store.search('products');

  try {
    console.log("Indexing products...");
    await search.index('p1', 'High quality mechanical keyboard with red switches');
    await search.index('p2', 'Wireless ergonomic mouse suitable for office work');
    await search.index('p3', 'Mechanical numeric keypad with brown switches');

    console.log("Querying for 'mechanical'...");
    const results = await search.query('mechanical');
    
    console.log("Search results (document IDs):", results);

    console.log("Search test completed successfully.");
  } catch (e) {
    console.error("Search test failed:", e);
  } finally {
    await store.close();
    fs.rmSync(dbPath, { recursive: true, force: true });
  }
}

run();
