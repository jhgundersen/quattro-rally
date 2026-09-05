import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MESSAGES, pick, resultTitle} from './messages.js';
import {DRIVERS} from './drivers.js';

const pools=[...Object.values(MESSAGES).flatMap(v=>Array.isArray(v[0])?v:[v]),...DRIVERS.map(d=>d.quips)];

test('every pool has something to swap between, with no repeated lines',()=>{
 for(const pool of pools){
  assert.ok(pool.length>=3,`a pool of ${pool.length} is not much of a swap: ${pool[0]}`);
  assert.equal(new Set(pool).size,pool.length,`repeated line in ${pool[0]}`);
  assert.ok(pool.every(line=>typeof line==='string'&&line.trim()),'every line says something');
 }
});

test('pick stays inside the list, including at the top of the random range',()=>{
 const list=['a','b','c'];
 assert.equal(pick(list,()=>0),'a');
 assert.equal(pick(list,()=>.5),'b');
 assert.equal(pick(list,()=>.999),'c');
 assert.equal(pick(list,()=>1),'c','a random of exactly 1 must not fall off the end');
});

test('headlines follow the finishing position, and beating the ace outranks it',()=>{
 for(let rank=1;rank<=4;rank++)assert.ok(MESSAGES.title[rank-1].includes(resultTitle(rank,false,()=>0)));
 assert.ok(MESSAGES.triumph.includes(resultTitle(4,true,()=>0)),'the ace being beaten wins the headline');
 assert.equal(resultTitle(9,false,()=>0),MESSAGES.title[3][0],'an impossible position still reads sensibly');
});
