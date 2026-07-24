# Stream Domain

## Overview
The `stream` domain provides Append-Only Data Streams. Similar to Redis Streams or Apache Kafka, it is designed to store sequences of events or logs in chronological order. Consumers can process these streams incrementally and track their positions using Consumer Groups.

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });
const activityStream = db.stream<{ action: string, user: string }>('user_activity');

async function run() {
  // --- Producer ---
  
  // Append events to the stream
  const eventId1 = await activityStream.append({ action: 'login', user: 'Alice' });
  const eventId2 = await activityStream.append({ action: 'click', user: 'Alice' });
  console.log(`Appended events: ${eventId1}, ${eventId2}`);
  
  // --- Consumer ---
  
  // Read events starting from the beginning of the stream
  const events = await activityStream.read('0-0', 10);
  console.log('Read Events:', events);
  
  // --- Consumer Groups (Tracking progress) ---
  
  // Create a consumer group to track which events have been processed
  await activityStream.createGroup('analytics_group', '0-0');
  
  // Consumer 'worker_1' reads the next available message for the group
  const groupEvents = await activityStream.readGroup('analytics_group', 'worker_1', 1);
  
  if (groupEvents.length > 0) {
    const event = groupEvents[0];
    console.log('Worker 1 processing:', event.data);
    
    // Acknowledge that the message has been successfully processed
    await activityStream.ack('analytics_group', event.id);
  }
}

run();
```
