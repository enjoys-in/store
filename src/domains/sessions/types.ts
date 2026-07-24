export interface SessionData {
  id: string;
  userId: string;
  deviceInfo?: string;
  ip?: string;
  createdAt: number;
  expiresAt: number;
  metadata?: Record<string, unknown>;
}

export type CreateSessionInput = Omit<SessionData, 'id' | 'createdAt'>;

export interface ISessionStore {
  create(input: CreateSessionInput): Promise<string>;
  get(sessionId: string): Promise<SessionData | null>;
  getUserSessions(userId: string): Promise<SessionData[]>;
  invalidate(sessionId: string): Promise<void>;
  invalidateAllForUser(userId: string): Promise<void>;
}

export enum SessionEngineType {
}


export type SessionsEngineConfig = never;