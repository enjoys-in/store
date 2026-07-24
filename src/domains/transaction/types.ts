export interface ITransaction {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): void;
  del(key: string): void;
  commit(): Promise<boolean>;
}

export type TransactionCallback<T> = (tx: ITransaction) => Promise<T>;
