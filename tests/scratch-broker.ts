import { createStore } from '../src/store';

async function testBroker() {
  const db = createStore();
  const broker = db.broker<{ event: string, user: string }>('test_broker');
  
  let receivedCount = 0;

  const handler = (msg: { event: string, user: string }) => {
    console.log('Received message:', msg);
    receivedCount++;
  };

  // Subscribe
  await broker.subscribe('events', handler);

  // Publish
  await broker.publish('events', { event: 'login', user: 'alice' });
  
  // Wait a tick for async processing (even though memory is sync, handler might be async in reality)
  await new Promise(r => setTimeout(r, 10));

  // Unsubscribe
  await broker.unsubscribe('events', handler);
  
  // Publish again - shouldn't be received
  await broker.publish('events', { event: 'logout', user: 'alice' });

  if (receivedCount === 1) {
    console.log('SUCCESS: Broker test passed!');
  } else {
    console.error('FAILED: Expected 1 message, got', receivedCount);
    process.exit(1);
  }
}

testBroker().catch(console.error);
