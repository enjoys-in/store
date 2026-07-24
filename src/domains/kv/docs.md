# KV Domain

## Overview
The `kv` domain provides a robust, persistent Key-Value store. Unlike the `cache` domain (which is designed for ephemeral, TTL-bound data), the KV store is designed for persistent, reliable storage of arbitrary JSON-serializable data.

It is heavily optimized for fast point-reads and writes.

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });

// Initialize a KV store scoped to a namespace
const usersKv = db.kv<{ name: string, role: string }>('users');

async function run() {
  // --- Basic CRUD ---
  
  // Set a key-value pair
  await usersKv.set('user:101', { name: 'Alice', role: 'admin' });
  
  // Get a key
  const user = await usersKv.get('user:101');
  console.log('User:', user?.name); // 'Alice'
  
  // Check if a key exists
  const exists = await usersKv.has('user:101');
  console.log('Exists?', exists); // true
  
  // Delete a key
  await usersKv.delete('user:101');
  
  // --- Batch Operations ---
  
  // Set multiple keys efficiently
  await usersKv.setMany({
    'user:102': { name: 'Bob', role: 'editor' },
    'user:103': { name: 'Charlie', role: 'viewer' }
  });
  
  // Get multiple keys
  const batchUsers = await usersKv.getMany(['user:102', 'user:103']);
  console.log('Batch users:', batchUsers);
}

run();
```
