# Auth Domain

## Overview
The `auth` domain provides high-level primitives for managing user authentication state, specifically handling JWT blocklists and refresh token storage securely and efficiently.

## Refresh Tokens
When you store a refresh token (which can often be 200+ characters long), the engine automatically hashes it using the built-in Node.js `crypto` module (SHA-256) and truncates it to a secure, 10-character URL-safe string (`base64url`). 
This drastically reduces memory footprint and lookup times in the embedded Key-Value store, with collision resistance up to roughly 1 billion tokens.

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });
const auth = db.auth();

async function run() {
  // --- JWT Blocklist ---
  const blocklist = auth.blocklist();
  
  // Invalidate a JWT token (e.g., on logout)
  await blocklist.add('eyJhbGciOiJIUzI1NiIs...', 3600); // block for 1 hour
  
  // Check if a token is blocked
  const isBlocked = await blocklist.has('eyJhbGciOiJIUzI1NiIs...');
  console.log('Is token blocked?', isBlocked); // true

  // --- Refresh Tokens ---
  const refreshTokens = auth.refreshTokens();
  
  // Store a long refresh token for a user (automatically hashed internally)
  await refreshTokens.add('user_123', 'very_long_refresh_token_string_here...', 86400);
  
  // Validate a refresh token during token rotation
  const isValid = await refreshTokens.validate('user_123', 'very_long_refresh_token_string_here...');
  console.log('Is valid?', isValid);
  
  // Revoke all tokens for a user (e.g., password reset, global logout)
  await refreshTokens.revokeAll('user_123');
}

run();
```
