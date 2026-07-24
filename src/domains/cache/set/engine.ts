export interface ISetEngine {
  add(namespace: string, key: string, value: unknown): Promise<number>;
  remove(namespace: string, key: string, value: unknown): Promise<number>;
  has(namespace: string, key: string, value: unknown): Promise<boolean>;
  members(namespace: string, key: string): Promise<unknown[]>;
  size(namespace: string, key: string): Promise<number>;
}
