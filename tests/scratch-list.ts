import { createStore } from '../src/store';

async function testList() {
  const db = createStore();
  const queue = db.list<string>('tasks', 'default'); // namespace: tasks, key: default

  console.log('Testing push/pop (Stack)...');
  await queue.push('A');
  await queue.push('B');
  await queue.push('C');
  
  let len = await queue.len();
  if (len !== 3) throw new Error(`Length should be 3, got ${len}`);

  let pop1 = await queue.pop();
  if (pop1 !== 'C') throw new Error(`Expected C, got ${pop1}`);

  console.log('Testing unshift/shift (Queue)...');
  await queue.unshift('Z'); // [Z, A, B]
  
  let shift1 = await queue.shift();
  if (shift1 !== 'Z') throw new Error(`Expected Z, got ${shift1}`);

  console.log('Testing range...');
  const items = await queue.range(0, -1);
  if (items.length !== 2 || items[0] !== 'A' || items[1] !== 'B') {
    throw new Error(`Expected [A, B], got ${JSON.stringify(items)}`);
  }

  // Clear list
  await queue.pop();
  await queue.pop();

  const emptyPop = await queue.pop();
  if (emptyPop !== null) throw new Error('Expected null when popping empty list');

  console.log('SUCCESS: RocksDB List domain test passed!');
}

testList().catch(console.error);
