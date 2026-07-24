import { HashStoreImpl } from './store';
import { IHash, HashEngineConfig, HashEngineType } from './types';

export class HashFactory {
  static create<T = unknown>(
    engineConfig: HashEngineConfig,
    namespace: string = ''
  ): IHash<T> {
    let engine;

    switch ((engineConfig as any).type) { default:
        throw new Error('Unsupported Hash engine type');
    }

    return new HashStoreImpl<T>(engine, namespace);
  }
}
