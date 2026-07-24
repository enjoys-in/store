# Semaphore Domain

## Overview
The `semaphore` domain provides distributed concurrency control. While a Mutex ensures only one process has access, a Semaphore allows a specific number of concurrent accesses to a shared resource.

It is useful for limiting concurrent outbound API requests, database connections, or resource-heavy background jobs.

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });
// Note: Depending on store configuration, accessed via db.semaphore()

async function run() {
  // Initialize a semaphore that allows exactly 3 concurrent accesses
  const maxConcurrency = 3;
  const apiSemaphore = db.semaphore('third_party_api_limit', maxConcurrency);
  
  // Attempt to acquire a permit
  const acquired = await apiSemaphore.acquire({ ttl: 5000, timeout: 2000 });
  
  if (acquired) {
    try {
      console.log('Permit acquired. Running heavy task...');
      // Make third-party API call safely...
    } finally {
      await apiSemaphore.release();
      console.log('Permit released.');
    }
  } else {
    console.log('Too many concurrent requests. Please try again later.');
  }
}

run();
```
