import { SessionStoreImpl } from './store';
import { ISessionStore, SessionsEngineConfig } from './types';
import { RocksDbSessionEngine, IRocksDbSessionClient } from './RocksDbSessionEngine';

export class SessionFactory {
  static create(
    config: SessionsEngineConfig,
    namespace: string = '',
    client?: IRocksDbSessionClient
  ): ISessionStore {
    let engine;

    switch ((config as unknown as { type: string }).type) {
      case 'ROCKSDB':
        if (!client) throw new Error('Client must be provided for ROCKSDB engine');
        engine = new RocksDbSessionEngine(client);
        break;
      default:
        throw new Error('Unsupported Session engine type');
    }

    return new SessionStoreImpl(engine, namespace);
  }
}
