export interface IListEngine {
  push(namespace: string, key: string, value: unknown): Promise<number>;
  pop(namespace: string, key: string): Promise<unknown | null>;
  unshift(namespace: string, key: string, value: unknown): Promise<number>;
  shift(namespace: string, key: string): Promise<unknown | null>;
  range(namespace: string, key: string, start: number, stop: number): Promise<unknown[]>;
  len(namespace: string, key: string): Promise<number>;
}
