import { ISearchStore } from './types';
import { ISearchEngine } from './engine';

export class SearchStoreImpl implements ISearchStore {
  constructor(private engine: ISearchEngine, private namespace: string) {}

  private tokenize(text: string): string[] {
    // Basic tokenizer: lowercase, replace punctuation with spaces, split, filter out very short words
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  async index(id: string, text: string): Promise<void> {
    const tokens = this.tokenize(text);
    if (tokens.length === 0) return;
    const uniqueTokens = Array.from(new Set(tokens));
    return this.engine.index(this.namespace, id, uniqueTokens);
  }

  async query(text: string): Promise<string[]> {
    const tokens = this.tokenize(text);
    if (tokens.length === 0) return [];
    const uniqueTokens = Array.from(new Set(tokens));
    return this.engine.query(this.namespace, uniqueTokens);
  }

  async remove(id: string, text: string): Promise<void> {
    const tokens = this.tokenize(text);
    if (tokens.length === 0) return;
    const uniqueTokens = Array.from(new Set(tokens));
    return this.engine.remove(this.namespace, id, uniqueTokens);
  }
}
