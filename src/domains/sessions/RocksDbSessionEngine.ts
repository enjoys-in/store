import { SessionData, CreateSessionInput } from './types';
import { ISessionEngine } from './engine';
import { randomUUID } from 'crypto';

export interface IRocksDbSessionClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export class RocksDbSessionEngine implements ISessionEngine {
  constructor(private client: IRocksDbSessionClient) {}

  private getSessionKey(namespace: string, sessionId: string) {
    return `${namespace}:session:${sessionId}`;
  }

  private getUserSessionsKey(namespace: string, userId: string) {
    return `${namespace}:user:${userId}:sessions`;
  }

  async create(namespace: string, input: CreateSessionInput): Promise<string> {
    const sessionId = randomUUID();
    const session: SessionData = {
      ...input,
      id: sessionId,
      createdAt: Date.now()
    };

    // Save the session
    await this.client.put(this.getSessionKey(namespace, sessionId), JSON.stringify(session));

    // Update the user's session index
    const userKey = this.getUserSessionsKey(namespace, input.userId);
    const existingIndex = await this.client.get(userKey);
    let userSessions: string[] = [];
    if (existingIndex) {
      try {
        userSessions = JSON.parse(existingIndex);
      } catch (e) {
        // ignore
      }
    }
    userSessions.push(sessionId);
    await this.client.put(userKey, JSON.stringify(userSessions));

    return sessionId;
  }

  async get(namespace: string, sessionId: string): Promise<SessionData | null> {
    const data = await this.client.get(this.getSessionKey(namespace, sessionId));
    if (!data) return null;
    try {
      const session: SessionData = JSON.parse(data);
      if (Date.now() > session.expiresAt) {
        await this.invalidate(namespace, sessionId);
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  }

  async getUserSessions(namespace: string, userId: string): Promise<SessionData[]> {
    const userKey = this.getUserSessionsKey(namespace, userId);
    const existingIndex = await this.client.get(userKey);
    if (!existingIndex) return [];
    
    let sessionIds: string[] = [];
    try {
      sessionIds = JSON.parse(existingIndex);
    } catch (e) {
      return [];
    }

    const sessions: SessionData[] = [];
    for (const sid of sessionIds) {
      const session = await this.get(namespace, sid);
      if (session) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  async invalidate(namespace: string, sessionId: string): Promise<void> {
    const data = await this.client.get(this.getSessionKey(namespace, sessionId));
    let session: SessionData | null = null;
    if (data) {
      try {
        session = JSON.parse(data);
      } catch (e) {}
    }

    await this.client.del(this.getSessionKey(namespace, sessionId));
    
    if (session) {
      const userKey = this.getUserSessionsKey(namespace, session.userId);
      const existingIndex = await this.client.get(userKey);
      if (existingIndex) {
        try {
          let userSessions: string[] = JSON.parse(existingIndex);
          userSessions = userSessions.filter(id => id !== sessionId);
          await this.client.put(userKey, JSON.stringify(userSessions));
        } catch (e) {}
      }
    }
  }

  async invalidateAllForUser(namespace: string, userId: string): Promise<void> {
    const userKey = this.getUserSessionsKey(namespace, userId);
    const existingIndex = await this.client.get(userKey);
    if (existingIndex) {
      try {
        const sessionIds: string[] = JSON.parse(existingIndex);
        for (const sid of sessionIds) {
          await this.client.del(this.getSessionKey(namespace, sid));
        }
      } catch (e) {}
    }
    await this.client.del(userKey);
  }
}
