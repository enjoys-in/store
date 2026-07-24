import { createStore } from '../src/store';

async function testRefreshTokens() {
  const db = createStore();
  const refreshTokens = db.auth().refreshTokens();

  const token1 = 'refresh-token-uuid-1';
  const token2 = 'refresh-token-uuid-2';
  const userId = 'user_123';

  console.log('Storing token1...');
  await refreshTokens.store(token1, userId);
  
  let valid1 = await refreshTokens.isValid(token1);
  if (!valid1) throw new Error('token1 should be valid');

  console.log('Storing token2...');
  await refreshTokens.store(token2, userId);

  let valid2 = await refreshTokens.isValid(token2);
  if (!valid2) throw new Error('token2 should be valid');

  console.log('Revoking token1...');
  await refreshTokens.revoke(token1);
  valid1 = await refreshTokens.isValid(token1);
  if (valid1) throw new Error('token1 should be invalid after revoke');
  valid2 = await refreshTokens.isValid(token2);
  if (!valid2) throw new Error('token2 should still be valid');

  console.log('Revoking all tokens for user...');
  await refreshTokens.revokeAllForUser(userId);
  valid2 = await refreshTokens.isValid(token2);
  if (valid2) throw new Error('token2 should be invalid after revokeAllForUser');

  console.log('SUCCESS: Refresh Token Store test passed!');
}

testRefreshTokens().catch(console.error);
