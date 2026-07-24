export interface ITimeSeriesPoint {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

export interface ITimeSeriesStore {
  add(seriesName: string, points: ITimeSeriesPoint | ITimeSeriesPoint[]): Promise<void>;
  query(seriesName: string, startMs: number, endMs: number): Promise<ITimeSeriesPoint[]>;
  aggregate(
    seriesName: string,
    startMs: number,
    endMs: number,
    intervalMs: number,
    type: 'avg' | 'sum' | 'max' | 'min'
  ): Promise<ITimeSeriesPoint[]>;
}
