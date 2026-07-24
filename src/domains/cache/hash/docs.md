# Hash Data Structure

## Overview
The `hash` structure (part of the `cache` domain) provides Redis-like Hash functionality, allowing you to store and manipulate maps of string fields and values under a single key. It is highly optimized for storing objects where you frequently need to update or fetch individual fields rather than the entire object.

*Note: The Hash data structure is internally accessed via the cache instance.*

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });
const cache = db.cache();

// Initialize a Hash store scoped to a specific namespace
const userProfileHash = cache.hash('user_profiles');

async function run() {
  // Set individual fields in the hash for key 'user:123'
  await userProfileHash.set('user:123', 'name', 'Alice');
  await userProfileHash.set('user:123', 'age', 30);
  
  // Get an individual field
  const name = await userProfileHash.get('user:123', 'name');
  console.log('User Name:', name); // 'Alice'
  
  // Set multiple fields simultaneously
  await userProfileHash.setMany('user:456', {
    name: 'Bob',
    age: 25,
    role: 'admin'
  });
  
  // Retrieve the entire hash map
  const bobProfile = await userProfileHash.getAll('user:456');
  console.log('Bob Profile:', bobProfile); // { name: 'Bob', age: 25, role: 'admin' }
  
  // Delete a specific field
  await userProfileHash.del('user:456', 'role');
}

run();
```
