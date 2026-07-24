# Set Data Structure

## Overview
The `set` structure (part of the `cache` domain) provides Redis-like Set functionality. It represents unordered collections of unique strings. Sets are highly optimized for fast membership testing, deduplication, and intersection/union logic.

*Note: The Set data structure is internally accessed via the cache instance.*

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });
const cache = db.cache();

// Initialize a Set store scoped to a specific namespace
const tagsSet = cache.set('article_tags');

async function run() {
  // Add members to the set
  const addedCount = await tagsSet.add('tech', 'science', 'health');
  console.log('Added tags:', addedCount); // 3
  
  // Adding duplicates does nothing
  await tagsSet.add('tech');
  
  // Check if a member exists in the set
  const hasTech = await tagsSet.has('tech');
  console.log('Has Tech?', hasTech); // true
  
  // Remove a member
  await tagsSet.remove('health');
  
  // Get all members of the set
  const allTags = await tagsSet.getAll();
  console.log('All Tags:', allTags); // ['tech', 'science']
  
  // Get the cardinality (size) of the set
  const size = await tagsSet.size();
  console.log('Total Tags:', size); // 2
}

run();
```
