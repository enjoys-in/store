import { createStore } from '../src/store';

async function testSessions() {
  const db = createStore();
  const sessions = db.sessions();

  const userId = 'user_abc123';

  console.log('Creating session 1...');
  const sid1 = await sessions.create({
    userId,
    deviceInfo: 'iPhone 15',
    expiresAt: Date.now() + 1000 * 60 * 60,
  });

  console.log('Creating session 2...');
  const sid2 = await sessions.create({
    userId,
    deviceInfo: 'MacBook Pro',
    expiresAt: Date.now() + 1000 * 60 * 60,
  });

  let userSessions = await sessions.getUserSessions(userId);
  if (userSessions.length !== 2) throw new Error('Should have 2 sessions');

  const s1 = await sessions.get(sid1);
  if (!s1 || s1.deviceInfo !== 'iPhone 15') throw new Error('Session 1 data incorrect');

  console.log('Invalidating session 1...');
  await sessions.invalidate(sid1);
  
  userSessions = await sessions.getUserSessions(userId);
  if (userSessions.length !== 1) throw new Error('Should have 1 session left');

  console.log('Invalidating all for user...');
  await sessions.invalidateAllForUser(userId);

  userSessions = await sessions.getUserSessions(userId);
  if (userSessions.length !== 0) throw new Error('Should have 0 sessions left');

  console.log('SUCCESS: User/Device Sessions test passed!');
}

testSessions().catch(console.error);
