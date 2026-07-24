# Broker Domain

## Overview
The `broker` domain provides a lightweight, high-performance Pub/Sub (Publish-Subscribe) message broker. It allows different parts of your application or distributed system to communicate asynchronously via channels (topics).

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });
const broker = db.broker<{ event: string, data: any }>('system_events');

async function run() {
  // Subscribe to a specific channel
  const unsubscribe = await broker.subscribe('user_signups', async (message) => {
    console.log('New user signed up:', message.data);
  });

  // Subscribe with pattern matching (if supported by the underlying engine)
  await broker.psubscribe('user_*', async (message, channel) => {
    console.log(`Event on channel ${channel}:`, message.data);
  });

  // Publish messages to the channel
  await broker.publish('user_signups', { 
    event: 'signup', 
    data: { userId: '123', email: 'test@example.com' } 
  });

  // Clean up subscription when done
  await unsubscribe();
}

run();
```
