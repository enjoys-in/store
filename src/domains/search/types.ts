export interface ISearchStore {
  index(id: string, text: string): Promise<void>;
  query(text: string): Promise<string[]>;
  remove(id: string, text: string): Promise<void>;
}
