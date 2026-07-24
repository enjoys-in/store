import { IBrokerEngine } from './engine';
import { MessageHandler } from './types';
import { EventEmitter } from 'events';

export class RocksDbBrokerEngine implements IBrokerEngine {
  private emitter = new EventEmitter();

  // If this needs to work across processes, we'd need to poll a RocksDB queue/stream.
  // For embedded mode, EventEmitter suffices.

  async publish(channel: string, message: any): Promise<void> {
    this.emitter.emit(channel, message);
  }

  async subscribe(channel: string, handler: MessageHandler<any>): Promise<void> {
    this.emitter.on(channel, handler);
  }

  async unsubscribe(channel: string, handler: MessageHandler<any>): Promise<void> {
    this.emitter.off(channel, handler);
  }
}
