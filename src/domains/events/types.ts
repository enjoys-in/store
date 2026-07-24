export interface EventRecord<T = unknown> {
  id: string;
  streamId: string;
  type: string;
  data: T;
  timestamp: number;
}

export interface IEventStore {
  append<T = unknown>(streamId: string, type: string, data: T): Promise<string>;
  getEvents(streamId: string, startId?: string, limit?: number): Promise<EventRecord[]>;
}
