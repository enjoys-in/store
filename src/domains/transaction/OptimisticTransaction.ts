import { IKVStore } from '../kv';
import { ITransaction } from './types';

interface WriteSetEntry {
  type: 'set' | 'del';
  value?: unknown;
}

export class OptimisticTransaction implements ITransaction {
  private readSet = new Map<string, unknown | null>();
  private writeSet = new Map<string, WriteSetEntry>();

  constructor(private kvStore: IKVStore<unknown>) {}

  async get<T>(key: string): Promise<T | null> {
    if (this.writeSet.has(key)) {
      const entry = this.writeSet.get(key)!;
      if (entry.type === 'del') return null;
      return entry.value as T;
    }

    const val = await this.kvStore.get(key);
    
    if (!this.readSet.has(key)) {
      this.readSet.set(key, val);
    }
    
    return val as T;
  }

  set<T>(key: string, value: T): void {
    this.writeSet.set(key, { type: 'set', value });
  }

  del(key: string): void {
    this.writeSet.set(key, { type: 'del' });
  }

  async commit(): Promise<boolean> {
    if (this.writeSet.size === 0) return true;

    const commits: Array<{ key: string, oldValue: unknown, newValue: unknown }> = [];
    const deletes: Array<{ key: string, oldValue: unknown }> = [];
    
    for (const [key, entry] of this.writeSet.entries()) {
      let expectedOld = this.readSet.has(key) ? this.readSet.get(key) : await this.kvStore.get(key);
      if (entry.type === 'set') {
        commits.push({ key, oldValue: expectedOld, newValue: entry.value });
      } else {
        deletes.push({ key, oldValue: expectedOld });
      }
    }

    const appliedCommits: Array<{ key: string, revertedValue: unknown }> = [];
    
    for (const c of commits) {
      const success = await this.kvStore.cas(c.key, c.oldValue, c.newValue);
      if (!success) {
        await this.rollbackApplied(appliedCommits);
        return false;
      }
      appliedCommits.push({ key: c.key, revertedValue: c.oldValue });
    }
    
    for (const d of deletes) {
      const val = await this.kvStore.get(d.key);
      // We serialize values in memory engine, so simple strict equality might fail if they are objects.
      // Assuming primitives or CAS handles it (CAS in memory engine probably uses JSON.stringify).
      // Here we just use basic check.
      if (JSON.stringify(val) !== JSON.stringify(d.oldValue)) {
        await this.rollbackApplied(appliedCommits);
        return false;
      }
      await this.kvStore.del(d.key);
      appliedCommits.push({ key: d.key, revertedValue: d.oldValue }); // for rollback
    }

    return true;
  }

  private async rollbackApplied(applied: Array<{ key: string, revertedValue: unknown }>) {
    for (let i = applied.length - 1; i >= 0; i--) {
      const { key, revertedValue } = applied[i];
      if (revertedValue === null || revertedValue === undefined) {
        await this.kvStore.del(key);
      } else {
        await this.kvStore.set(key, revertedValue);
      }
    }
  }
}
