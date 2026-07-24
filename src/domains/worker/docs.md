# Worker Domain

## Overview
The `worker` domain allows the store to run efficiently in multi-threaded environments, such as Node.js Worker Threads. This domain manages the initialization and lifecycle of background workers, allowing expensive storage operations (like compaction, data flushing, or background job processing) to occur without blocking the main event loop.

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

// Initialize the store in 'worker-thread' mode
const db = createStore({ mode: 'worker-thread' });

async function run() {
  // Normally, worker management is handled implicitly by the store engine,
  // but if explicit interaction is required:
  
  // Example of delegating a task to the worker pool (conceptual)
  // await db.workers().submitTask('compaction');
  
  console.log('Store is running in worker-thread mode.');
}

run();
```
