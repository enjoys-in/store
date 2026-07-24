export interface IKVEngine {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;

  // Atomic operations
  incr?(key: string, by?: number): Promise<number>;
  decr?(key: string, by?: number): Promise<number>;
  cas?(key: string, oldValue: unknown, newValue: unknown): Promise<boolean>;
}
