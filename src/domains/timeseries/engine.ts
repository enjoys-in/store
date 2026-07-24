import { ITimeSeriesPoint } from './types';

export interface ITimeSeriesEngine {
  add(seriesName: string, points: ITimeSeriesPoint[]): Promise<void>;
  query(seriesName: string, startMs: number, endMs: number): Promise<ITimeSeriesPoint[]>;
}
