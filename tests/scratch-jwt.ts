import { createStore } from '../src/store';

async function testJwtBlocklist() {
  const db = createStore();
  const blocklist = db.auth().blocklist();

  const jti = 'uuid-token-123';
  
  // Initially not blocked
  let isBlocked = await blocklist.isBlocked(jti);
  console.log(`Initial state - isBlocked: ${isBlocked}`);

  // Block for 100ms
  await blocklist.block(jti, 100);
  
  // Verify it is blocked
  isBlocked = await blocklist.isBlocked(jti);
  console.log(`After blocking - isBlocked: ${isBlocked}`);
  
  if (!isBlocked) {
    console.error('FAILED: Token should be blocked');
    process.exit(1);
  }

  // Wait for TTL to expire (100ms + small buffer)
  console.log('Waiting for TTL to expire...');
  await new Promise(resolve => setTimeout(resolve, 150));

  // Verify it is unblocked
  isBlocked = await blocklist.isBlocked(jti);
  console.log(`After TTL - isBlocked: ${isBlocked}`);

  if (isBlocked) {
    console.error('FAILED: Token should not be blocked after TTL expires');
    process.exit(1);
  }

  console.log('SUCCESS: JWT Blocklist test passed!');
}

testJwtBlocklist().catch(console.error);
