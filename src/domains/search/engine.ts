export interface ISearchEngine {
  index(namespace: string, id: string, tokens: string[]): Promise<void>;
  query(namespace: string, tokens: string[]): Promise<string[]>;
  remove(namespace: string, id: string, tokens: string[]): Promise<void>;
}
