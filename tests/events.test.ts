import { expect, test, describe, beforeAll, afterAll } from '@rstest/core';
import { createStore } from '../src/store';
import fs from 'fs';
import path from 'path';

describe('Events Domain', () => {
  const dbPath = path.join(__dirname, `test_rocksdb_events_${Date.now()}_${Math.random()}`);
  let store: any;

  beforeAll(() => {
    store = createStore({ dbPath });
  });

  afterAll(async () => {
    if (store) {
      await store.close();
    }
    fs.rmSync(dbPath, { recursive: true, force: true });
  });

  test('should append and get events', async () => {
    const eventId1 = await store.events.append('stream1', 'user_created', { name: 'Alice' });
    const eventId2 = await store.events.append('stream1', 'user_updated', { name: 'Alice', age: 30 });

    expect(eventId1).toBeDefined();
    expect(eventId2).toBeDefined();

    const events = await store.events.getEvents('stream1');
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('user_created');
    expect(events[1].type).toBe('user_updated');
  });

  test('should get events with limit', async () => {
    const events = await store.events.getEvents('stream1', undefined, 1);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('user_created');
  });

  test('should get events from startId', async () => {
    const allEvents = await store.events.getEvents('stream1');
    const firstEventId = allEvents[0].id;

    const events = await store.events.getEvents('stream1', firstEventId);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('user_updated');
  });
});
