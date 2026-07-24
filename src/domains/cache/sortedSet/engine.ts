import { ISortedSetMember } from './types';

export interface ISortedSetEngine {
  add(namespace: string, key: string, value: any, score: number): Promise<number>;
  remove(namespace: string, key: string, value: any): Promise<number>;
  score(namespace: string, key: string, value: any): Promise<number | null>;
  rank(namespace: string, key: string, value: any): Promise<number | null>;
  range(namespace: string, key: string, start: number, stop: number): Promise<ISortedSetMember<any>[]>;
  rangeByScore(namespace: string, key: string, min: number, max: number): Promise<ISortedSetMember<any>[]>;
  size(namespace: string, key: string): Promise<number>;
}
