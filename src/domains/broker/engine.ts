import { MessageHandler } from './types';

export interface IBrokerEngine {
  publish(channel: string, message: any): Promise<void>;
  subscribe(channel: string, handler: MessageHandler<any>): Promise<void>;
  unsubscribe(channel: string, handler: MessageHandler<any>): Promise<void>;
}
