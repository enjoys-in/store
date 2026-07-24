# Watch Domain

## Overview
The `watch` functionality provides Keyspace Notifications similar to Redis. It allows you to listen for mutations (set, del, incr, decr, cas) on specific keys or key prefixes in the store. 

This is part of the Eventing & Reactive phase, enabling real-time reactive applications directly from the embedded store.

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });

async function run() {
  // 1. Watch a specific key
  db.watch('user:101', (event) => {
    console.log('Event received for user:101 =>', event.operation, event.value);
  });

  // 2. Watch a key prefix (all keys starting with 'user:')
  db.watch('user:*', (event) => {
    console.log(`Prefix event on ${event.key} =>`, event.operation, event.value);
  });

  const usersKv = db.kv('users');
  
  // Note: the store emits keys in their raw or namespaced format depending on where they are set.
  // Using the root KV to trigger changes:
  const rootKv = db.kv();
  
  await rootKv.set('user:101', { name: 'Alice', status: 'online' });
  // Logs: Event received for user:101 => set { name: 'Alice', status: 'online' }
  // Logs: Prefix event on user:101 => set { name: 'Alice', status: 'online' }

  await rootKv.decr('user:101:score');
  // Logs: Prefix event on user:101:score => decr -1
}

run();
```
