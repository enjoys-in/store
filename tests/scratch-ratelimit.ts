import { createStore } from '../src/store';

async function testRateLimiter() {
  const db = createStore();
  
  // 5 requests per 100ms
  const limiter = db.rateLimiter('api_limits', { maxPoints: 5, durationMs: 100 });

  const userIp = '127.0.0.1';

  let allowed = 0;
  for (let i = 0; i < 7; i++) {
    const isAllowed = await limiter.consume(userIp);
    if (isAllowed) allowed++;
  }

  if (allowed !== 5) {
    throw new Error(`Expected 5 allowed requests, got ${allowed}`);
  }
  
  let remaining = await limiter.getRemaining(userIp);
  if (remaining !== 0) throw new Error(`Expected 0 remaining, got ${remaining}`);

  console.log('Successfully limited to 5 requests.');

  // Wait for window to expire (100ms + buffer)
  console.log('Waiting for window to expire...');
  await new Promise(r => setTimeout(r, 120));

  remaining = await limiter.getRemaining(userIp);
  if (remaining !== 5) throw new Error(`Expected 5 remaining after window expired, got ${remaining}`);
  
  const isAllowedAgain = await limiter.consume(userIp);
  if (!isAllowedAgain) throw new Error('Expected request to be allowed after window expired');

  console.log('SUCCESS: Rate Limiter test passed!');
}

testRateLimiter().catch(console.error);
