export type MessageHandler<T = unknown> = (message: T) => void | Promise<void>;

export interface IBroker<T = unknown> {
  publish(channel: string, message: T): Promise<void>;
  subscribe(channel: string, handler: MessageHandler<T>): Promise<void>;
  unsubscribe(channel: string, handler: MessageHandler<T>): Promise<void>;
}

export enum BrokerEngineType {
  ROCKSDB = 'ROCKSDB',
}


export type BrokerEngineConfig = never;