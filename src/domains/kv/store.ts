import { EventEmitter } from 'events';
import { IKVStore, WatchCallback, WatchEvent } from './types';
import { IKVEngine } from './engine';

export class KVStoreImpl<T> implements IKVStore<T> {
  constructor(
    private engine: IKVEngine, 
    private namespace: string = '',
    private emitter: EventEmitter = new EventEmitter()
  ) {}
  
  private key(k: string) {
    return this.namespace ? `${this.namespace}:${k}` : k;
  }

  private notify(operation: WatchEvent['operation'], key: string, value?: unknown) {
    this.emitter.emit('change', { key, operation, value });
  }

  async get(key: string): Promise<T | null> {
    return (await this.engine.get(this.key(key))) as T | null;
  }

  async set(key: string, value: T): Promise<void> {
    await this.engine.set(this.key(key), value);
    this.notify('set', key, value);
  }

  async del(key: string): Promise<void> {
    await this.engine.del(this.key(key));
    this.notify('del', key);
  }

  async incr(key: string, by: number = 1): Promise<number> {
    if (this.engine.incr) {
      const val = await this.engine.incr(this.key(key), by);
      this.notify('incr', key, val);
      return val;
    }
    throw new Error('incr is not supported by this KV engine');
  }

  async decr(key: string, by: number = 1): Promise<number> {
    if (this.engine.decr) {
      const val = await this.engine.decr(this.key(key), by);
      this.notify('decr', key, val);
      return val;
    }
    throw new Error('decr is not supported by this KV engine');
  }

  async cas(key: string, oldValue: T | null, newValue: T): Promise<boolean> {
    if (this.engine.cas) {
      const success = await this.engine.cas(this.key(key), oldValue, newValue);
      if (success) {
        this.notify('cas', key, newValue);
      }
      return success;
    }
    throw new Error('cas is not supported by this KV engine');
  }

  watch(pattern: string, callback: WatchCallback<T>): void {
    const isPrefix = pattern.endsWith('*');
    const prefix = isPrefix ? pattern.slice(0, -1) : pattern;

    this.emitter.on('change', (event: WatchEvent) => {
      // Event key is the un-namespaced key relative to this KVStoreImpl?
      // Wait! In Store, `set` receives `key`. So `this.notify('set', key, value)`
      // means event.key is already relative to the namespace!
      if (isPrefix && event.key.startsWith(prefix)) {
        callback(event as WatchEvent<T>);
      } else if (!isPrefix && event.key === pattern) {
        callback(event as WatchEvent<T>);
      }
    });
  }
}
