import { IBroker, MessageHandler } from './types';
import { IBrokerEngine } from './engine';

export class BrokerStoreImpl<T> implements IBroker<T> {
  constructor(private engine: IBrokerEngine, private namespace: string = '') {}

  private getChannel(channel: string): string {
    return this.namespace ? `${this.namespace}:${channel}` : channel;
  }

  async publish(channel: string, message: T): Promise<void> {
    return this.engine.publish(this.getChannel(channel), message);
  }

  async subscribe(channel: string, handler: MessageHandler<T>): Promise<void> {
    return this.engine.subscribe(this.getChannel(channel), handler as MessageHandler<any>);
  }

  async unsubscribe(channel: string, handler: MessageHandler<T>): Promise<void> {
    return this.engine.unsubscribe(this.getChannel(channel), handler as MessageHandler<any>);
  }
}
