import { createStore } from '../src/store';

async function testStream() {
  const db = createStore();
  const stream = db.stream<{ action: string, amount: number }>('test_stream');

  const id1 = await stream.append({ action: 'deposit', amount: 100 });
  console.log('Appended 1:', id1);

  // Quick delay
  await new Promise(r => setTimeout(r, 10));

  const id2 = await stream.append({ action: 'withdraw', amount: 50 });
  console.log('Appended 2:', id2);

  const entries = await stream.read('0-0');
  console.log('Read all:', entries);
  
  if (entries.length === 2 && entries[0].id === id1 && entries[1].id === id2) {
    console.log('SUCCESS!');
  } else {
    console.error('FAILED');
    process.exit(1);
  }
}

testStream().catch(console.error);
