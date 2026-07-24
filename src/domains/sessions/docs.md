# Sessions Domain

## Overview
The `sessions` domain provides comprehensive Session management for user authentication and device tracking. It offers APIs to create, validate, and revoke sessions. 
By utilizing high-performance embedded storage, you avoid needing external dependencies like Redis to track logged-in users.

## Usage & Examples

```typescript
import { createStore } from '@enjoys/store';

const db = createStore({ mode: 'embedded' });
const sessions = db.sessions('app_sessions');

async function run() {
  const userId = 'user_999';
  
  // 1. Create a new session (e.g., user logs in from Chrome)
  const sessionId = await sessions.create(userId, {
    deviceId: 'device_123',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }, 86400); // Valid for 1 day
  
  console.log('Created Session ID:', sessionId);
  
  // 2. Validate the session on incoming requests
  const sessionData = await sessions.get(sessionId);
  if (sessionData) {
    console.log('Valid session for user:', sessionData.userId);
  } else {
    console.log('Session is invalid or expired.');
  }
  
  // 3. Get all active sessions for a user (e.g., to show "Active Devices")
  const activeSessions = await sessions.getUserSessions(userId);
  console.log('Active Sessions:', activeSessions);
  
  // 4. Revoke a specific session (e.g., user clicks "Log out of this device")
  await sessions.revoke(sessionId);
  
  // 5. Revoke ALL sessions for a user (e.g., user resets their password)
  await sessions.revokeAllUserSessions(userId);
}

run();
```
