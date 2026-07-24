import { ITimeSeriesEngine } from './engine';
import { ITimeSeriesPoint } from './types';

export interface IRocksDbTimeSeriesClient {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  keys(): Promise<string[]>;
}

export class RocksDbTimeSeriesEngine implements ITimeSeriesEngine {
  constructor(private client: IRocksDbTimeSeriesClient) {}

  private getPointKey(seriesName: string, timestamp: number, randomSuffix: string): string {
    const paddedTs = timestamp.toString().padStart(16, '0');
    return `ts:${seriesName}:${paddedTs}:${randomSuffix}`;
  }

  async add(seriesName: string, points: ITimeSeriesPoint[]): Promise<void> {
    for (const point of points) {
      const suffix = Math.random().toString(36).substring(2, 8);
      const key = this.getPointKey(seriesName, point.timestamp, suffix);
      await this.client.put(key, JSON.stringify(point));
    }
  }

  async query(seriesName: string, startMs: number, endMs: number): Promise<ITimeSeriesPoint[]> {
    const allKeys = await this.client.keys();
    
    const prefix = `ts:${seriesName}:`;
    const startPadded = startMs.toString().padStart(16, '0');
    const endPadded = endMs.toString().padStart(16, '0');
    
    const startKey = `${prefix}${startPadded}`;
    const endKey = `${prefix}${endPadded}`;
    
    const matchingKeys = allKeys.filter(k => 
      k.startsWith(prefix) && k >= startKey && k <= endKey + '\xff' // to include suffixes
    );
    
    matchingKeys.sort();

    const results: ITimeSeriesPoint[] = [];
    for (const key of matchingKeys) {
      const data = await this.client.get(key);
      if (data) {
        try {
          results.push(JSON.parse(data));
        } catch(e) {}
      }
    }

    return results;
  }
}
