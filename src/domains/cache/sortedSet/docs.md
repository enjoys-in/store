# Sorted Set Data Structure

## Overview
The `sortedSet` structure (part of the `cache` domain) provides Redis-like Sorted Set functionality. It is a collection of unique strings (members) ordered by an associated floating-point score. It is highly optimized for leaderboards, priority queues, and time-series data indexing.

*Note: The Sorted Set data structure is internally accessed via the cache instance.*

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });
const cache = db.cache();

// Initialize a Sorted Set store scoped to a specific namespace
const leaderboard = cache.sortedSet('game_leaderboard');

async function run() {
  // Add members with their initial scores
  await leaderboard.add('player_alice', 1500);
  await leaderboard.add('player_bob', 1200);
  await leaderboard.add('player_charlie', 1800);
  
  // Increment a member's score
  const newScore = await leaderboard.incrementBy('player_bob', 400); // bob is now 1600
  console.log('Bob new score:', newScore);
  
  // Get a member's score
  const aliceScore = await leaderboard.score('player_alice');
  console.log('Alice Score:', aliceScore); // 1500
  
  // Get ranking (0-based) based on highest score to lowest
  // Wait, if it's a priority queue, you might want lowest score to highest depending on the engine.
  // Generally:
  const allMembers = await leaderboard.range(0, -1);
  console.log('Leaderboard:', allMembers); 
  // e.g. ['player_charlie', 'player_bob', 'player_alice'] (sorted by score)
  
  // Remove a member
  await leaderboard.remove('player_alice');
}

run();
```
