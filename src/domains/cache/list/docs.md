# List Data Structure

## Overview
The `list` structure (part of the `cache` domain) provides Redis-like List functionality. It represents sequences of string elements sorted by insertion order. It is highly optimized for queueing, recent-events tracking, and maintaining ordered logs where elements are frequently added or removed from the edges.

*Note: The List data structure is internally accessed via the cache instance.*

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });
const cache = db.cache();

// Initialize a List store scoped to a specific namespace
const auditLog = cache.list('audit_logs');

async function run() {
  // Push elements to the right (tail) of the list
  await auditLog.rpush('event:login');
  await auditLog.rpush('event:purchase');
  
  // Push elements to the left (head) of the list
  await auditLog.lpush('event:signup'); // List is now: signup, login, purchase
  
  // Pop an element from the left (head)
  const firstEvent = await auditLog.lpop();
  console.log('First Event:', firstEvent); // 'event:signup'
  
  // Pop an element from the right (tail)
  const lastEvent = await auditLog.rpop();
  console.log('Last Event:', lastEvent); // 'event:purchase'
  
  // Get all elements in the list
  const currentLogs = await auditLog.getAll();
  console.log('Current Logs:', currentLogs); // ['event:login']
}

run();
```
