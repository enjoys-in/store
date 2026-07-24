import { ISessionStore, SessionData, CreateSessionInput } from './types';
import { ISessionEngine } from './engine';

export class SessionStoreImpl implements ISessionStore {
  constructor(private engine: ISessionEngine, private namespace: string = '') {}

  async create(input: CreateSessionInput): Promise<string> {
    return this.engine.create(this.namespace, input);
  }

  async get(sessionId: string): Promise<SessionData | null> {
    return this.engine.get(this.namespace, sessionId);
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    return this.engine.getUserSessions(this.namespace, userId);
  }

  async invalidate(sessionId: string): Promise<void> {
    return this.engine.invalidate(this.namespace, sessionId);
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    return this.engine.invalidateAllForUser(this.namespace, userId);
  }
}
