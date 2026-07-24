import { ICollectionEngine } from './engine';

export interface IRocksDbCollectionClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export class RocksDbCollectionEngine implements ICollectionEngine {
  constructor(private client: IRocksDbCollectionClient) {}

  private getDocKey(col: string, id: string): string {
    return `col:${col}:doc:${id}`;
  }

  private getIndexMetaKey(col: string): string {
    return `col:${col}:meta:indexes`;
  }

  private getIndexEntryKey(col: string, field: string, value: any, id: string): string {
    return `col:${col}:idx:${field}:${value}:${id}`;
  }

  private async getIndexedFields(col: string): Promise<string[]> {
    const meta = await this.client.get(this.getIndexMetaKey(col));
    return meta ? JSON.parse(meta) : [];
  }

  private async addIndexEntry(col: string, id: string, doc: any) {
    const fields = await this.getIndexedFields(col);
    for (const field of fields) {
      if (doc && doc[field] !== undefined) {
        const key = this.getIndexEntryKey(col, field, doc[field], id);
        await this.client.put(key, '1');
      }
    }
  }

  private async removeIndexEntry(col: string, id: string, doc: any) {
    const fields = await this.getIndexedFields(col);
    for (const field of fields) {
      if (doc && doc[field] !== undefined) {
        const key = this.getIndexEntryKey(col, field, doc[field], id);
        await this.client.del(key);
      }
    }
  }

  async insert(colName: string, id: string, doc: unknown): Promise<void> {
    const key = this.getDocKey(colName, id);
    const existing = await this.client.get(key);
    if (existing) {
      throw new Error(`Document with id ${id} already exists`);
    }

    await this.client.put(key, JSON.stringify(doc));
    await this.addIndexEntry(colName, id, doc);
  }

  async get(colName: string, id: string): Promise<unknown | null> {
    const key = this.getDocKey(colName, id);
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async update(colName: string, id: string, partial: unknown): Promise<void> {
    const key = this.getDocKey(colName, id);
    const existing = await this.client.get(key);
    if (!existing) {
      throw new Error(`Document with id ${id} not found`);
    }

    const doc = JSON.parse(existing);
    
    await this.removeIndexEntry(colName, id, doc);

    const updated = { ...doc, ...(partial as object) };
    await this.client.put(key, JSON.stringify(updated));

    await this.addIndexEntry(colName, id, updated);
  }

  async delete(colName: string, id: string): Promise<void> {
    const key = this.getDocKey(colName, id);
    const existing = await this.client.get(key);
    if (!existing) return;

    const doc = JSON.parse(existing);
    await this.removeIndexEntry(colName, id, doc);
    await this.client.del(key);
  }

  async index(colName: string, field: string): Promise<void> {
    const fields = await this.getIndexedFields(colName);
    if (!fields.includes(field)) {
      fields.push(field);
      await this.client.put(this.getIndexMetaKey(colName), JSON.stringify(fields));

      const allKeys = await this.client.keys();
      const docPrefix = `col:${colName}:doc:`;
      
      for (const k of allKeys) {
        if (k.startsWith(docPrefix)) {
          const data = await this.client.get(k);
          if (data) {
            const doc = JSON.parse(data);
            if (doc[field] !== undefined) {
              const id = k.substring(docPrefix.length);
              const idxKey = this.getIndexEntryKey(colName, field, doc[field], id);
              await this.client.put(idxKey, '1');
            }
          }
        }
      }
    }
  }

  async find(colName: string, query: Record<string, any>): Promise<unknown[]> {
    const fields = await this.getIndexedFields(colName);
    const keys = Object.keys(query);
    
    if (keys.length === 0) {
      return []; 
    }

    let indexedField = keys.find(k => fields.includes(k));
    
    let docIds = new Set<string>();
    const allStoreKeys = await this.client.keys();

    if (indexedField) {
      const value = query[indexedField];
      const prefix = `col:${colName}:idx:${indexedField}:${value}:`;
      
      for (const k of allStoreKeys) {
        if (k.startsWith(prefix)) {
          const id = k.substring(prefix.length);
          docIds.add(id);
        }
      }
    } else {
      const results: unknown[] = [];
      const docPrefix = `col:${colName}:doc:`;
      for (const k of allStoreKeys) {
         if (k.startsWith(docPrefix)) {
            const data = await this.client.get(k);
            if (data) {
                const doc = JSON.parse(data);
                let match = true;
                for (const qk of keys) {
                    if (doc[qk] !== query[qk]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                   results.push(doc);
                }
            }
         }
      }
      return results;
    }

    const results: unknown[] = [];
    for (const id of docIds) {
      const doc = await this.get(colName, id) as any;
      if (doc) {
        let match = true;
        for (const qk of keys) {
           if (doc[qk] !== query[qk]) {
              match = false;
              break;
           }
        }
        if (match) {
          results.push(doc);
        }
      }
    }

    return results;
  }
}
