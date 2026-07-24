import { createStore } from '../src/store';

async function testHash() {
  const db = createStore();
  const users = db.hash<{ name: string; age: number }>('users');

  const userId = 'user_1';

  console.log('Setting individual fields...');
  await users.set(userId, 'profile', { name: 'Alice', age: 28 });
  await users.set(userId, 'settings', { name: 'Theme', age: 1 }); // Just testing the type

  let profile = await users.get(userId, 'profile');
  if (!profile || profile.name !== 'Alice') throw new Error('Failed to get field');

  console.log('Setting multiple fields...');
  await users.setMany(userId, {
    metadata: { name: 'Meta', age: 0 },
    stats: { name: 'Stats', age: 100 }
  });

  const allFields = await users.getAll(userId);
  if (!allFields || Object.keys(allFields).length !== 4) throw new Error('Failed to get all fields');

  console.log('Deleting a field...');
  await users.del(userId, 'stats');
  
  const deletedStats = await users.get(userId, 'stats');
  if (deletedStats !== null) throw new Error('Field should be deleted');

  const finalFields = await users.getAll(userId);
  if (!finalFields || Object.keys(finalFields).length !== 3) throw new Error('Failed to delete correctly');

  console.log('SUCCESS: Hash domain test passed!');
}

testHash().catch(console.error);
