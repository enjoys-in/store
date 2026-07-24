# Lock Domain

## Overview
The `lock` domain provides distributed mutual exclusion (Mutex) locks. It guarantees that only one process or thread can hold a specific lock at a time, preventing race conditions when modifying shared resources.

Locks are automatically released if the holding process crashes (via TTL) and support graceful acquisition with timeouts.

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });
// Note: Depending on store configuration, locks may be accessed via db.lock() or db.mutex()

async function run() {
  const myLock = db.mutex('resource_name');
  
  // Attempt to acquire the lock with a 5000ms TTL and 2000ms wait timeout
  const acquired = await myLock.acquire({ ttl: 5000, timeout: 2000 });
  
  if (acquired) {
    try {
      // Safely perform operations on the shared resource
      console.log('Lock acquired, modifying resource safely...');
    } finally {
      // Always release the lock in a finally block
      await myLock.release();
      console.log('Lock released.');
    }
  } else {
    console.log('Failed to acquire the lock within the timeout period.');
  }
}

run();
```
