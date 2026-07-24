# Cache Domain

## Overview
The `cache` domain provides advanced, high-performance caching capabilities with support for Time-To-Live (TTL) expiry, atomic operations, and Redis-like advanced data structures (Bloom Filters, HyperLogLogs, Geospatial indexes, and Bitmaps).

It serves as the central hub for ephemeral data that requires fast read/write access.

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });
const cache = db.cache<string>('web_cache');

async function run() {
  // --- Basic KV Caching with TTL ---
  await cache.set('homepage_html', '<html>...</html>', 3600); // cache for 1 hour
  
  const html = await cache.get('homepage_html');
  console.log(html);

  // Set only if it doesn't exist (NX)
  const wasSet = await cache.setNX('lock_key', 'locked', 5000);
  
  // --- Advanced Data Structures ---
  
  // Bloom Filter (Fast probabilistic existence checking)
  await cache.bfAdd('banned_ips', '192.168.1.1');
  const isBanned = await cache.bfExists('banned_ips', '192.168.1.1');
  
  // HyperLogLog (Approximate count of unique items)
  await cache.pfAdd('unique_visitors', ['userA', 'userB', 'userC']);
  const visitorCount = await cache.pfCount('unique_visitors');
  
  // Geo-spatial (Store and search by coordinates)
  await cache.geoAdd('stores', -122.4194, 37.7749, 'San Francisco');
  const nearby = await cache.geoSearch('stores', -122.40, 37.77, 10, 'km');
  
  // Bitmaps (Space-efficient booleans)
  await cache.setBit('daily_logins', 1001, 1); // User ID 1001 logged in
  const loggedIn = await cache.getBit('daily_logins', 1001);
}

run();
```
