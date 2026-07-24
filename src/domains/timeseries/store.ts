import { ITimeSeriesStore, ITimeSeriesPoint } from './types';
import { ITimeSeriesEngine } from './engine';

export class TimeSeriesStoreImpl implements ITimeSeriesStore {
  constructor(private engine: ITimeSeriesEngine) {}

  async add(seriesName: string, points: ITimeSeriesPoint | ITimeSeriesPoint[]): Promise<void> {
    const pts = Array.isArray(points) ? points : [points];
    if (pts.length === 0) return;
    
    pts.sort((a, b) => a.timestamp - b.timestamp);
    await this.engine.add(seriesName, pts);
  }

  async query(seriesName: string, startMs: number, endMs: number): Promise<ITimeSeriesPoint[]> {
    return this.engine.query(seriesName, startMs, endMs);
  }

  async aggregate(
    seriesName: string,
    startMs: number,
    endMs: number,
    intervalMs: number,
    type: 'avg' | 'sum' | 'max' | 'min'
  ): Promise<ITimeSeriesPoint[]> {
    const points = await this.query(seriesName, startMs, endMs);
    if (points.length === 0) return [];

    const buckets = new Map<number, number[]>();

    for (const point of points) {
      const bucketTs = Math.floor(point.timestamp / intervalMs) * intervalMs;
      if (!buckets.has(bucketTs)) {
        buckets.set(bucketTs, []);
      }
      buckets.get(bucketTs)!.push(point.value);
    }

    const results: ITimeSeriesPoint[] = [];

    const sortedBuckets = Array.from(buckets.keys()).sort((a, b) => a - b);
    for (const ts of sortedBuckets) {
      const values = buckets.get(ts)!;
      let aggValue = 0;

      switch (type) {
        case 'sum':
          aggValue = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          aggValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'max':
          aggValue = Math.max(...values);
          break;
        case 'min':
          aggValue = Math.min(...values);
          break;
      }

      results.push({ timestamp: ts, value: aggValue });
    }

    return results;
  }
}
