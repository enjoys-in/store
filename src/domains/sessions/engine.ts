import { SessionData, CreateSessionInput } from './types';

export interface ISessionEngine {
  create(namespace: string, input: CreateSessionInput): Promise<string>;
  get(namespace: string, sessionId: string): Promise<SessionData | null>;
  getUserSessions(namespace: string, userId: string): Promise<SessionData[]>;
  invalidate(namespace: string, sessionId: string): Promise<void>;
  invalidateAllForUser(namespace: string, userId: string): Promise<void>;
}
