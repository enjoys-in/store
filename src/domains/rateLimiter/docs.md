# Rate Limiter Domain

## Overview
The `rateLimiter` domain provides mechanisms to limit the number of actions a user or system can perform within a specific time window. It is commonly used to protect APIs against abuse, DDoS attacks, and brute-force login attempts.

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });

// Initialize a rate limiter that allows 100 requests per 60 seconds
const apiLimiter = db.rateLimiter('api_limits', {
  maxRequests: 100,
  windowMs: 60000 
});

async function handleRequest(ipAddress: string) {
  // Check if the action is allowed
  const result = await apiLimiter.consume(ipAddress);
  
  if (result.allowed) {
    console.log(`Request allowed. Remaining: ${result.remaining}`);
    // Process request...
  } else {
    console.log(`Rate limit exceeded! Try again in ${result.retryAfterMs}ms`);
    // Return 429 Too Many Requests
  }
}

async function run() {
  await handleRequest('192.168.1.1');
}

run();
```
