# Queue Domain

## Overview
The `queue` domain provides high-performance FIFO (First-In, First-Out) task queues. It is designed for background job processing, message buffering, and reliable task execution.

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });
const emailQueue = db.queue<{ to: string, subject: string, body: string }>('emails');

async function producer() {
  // Enqueue a job
  await emailQueue.enqueue({
    to: 'user@example.com',
    subject: 'Welcome!',
    body: 'Thanks for signing up.'
  });
  console.log('Job enqueued.');
}

async function consumer() {
  // Dequeue a job (blocks or returns immediately depending on engine)
  const job = await emailQueue.dequeue();
  
  if (job) {
    console.log('Processing job:', job);
    
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Acknowledge the job to remove it from the queue permanently
    await emailQueue.ack(job.id);
    console.log('Job completed and acknowledged.');
  }
}

async function run() {
  await producer();
  await consumer();
}

run();
```
