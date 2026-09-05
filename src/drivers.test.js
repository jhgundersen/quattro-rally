import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DRIVERS, GRID, PLAYER} from './drivers.js';

test('the player drives the amber car and nobody else has a fixed livery clash',()=>{
 assert.equal(DRIVERS[PLAYER].name,'Axel');
 assert.equal(DRIVERS[PLAYER].color,'#e9b85d');
 assert.equal(new Set(DRIVERS.map(d=>d.color)).size,DRIVERS.length);
});

test('rivals get faster toward the ace, and the player drives to their own limits',()=>{
 const ace=DRIVERS.filter(d=>d.ace);
 assert.deepEqual(ace.map(d=>d.name),['DHH']);
 assert.ok(!DRIVERS[PLAYER].skill,'the player is driven by the keyboard, not by skill');
 const rivals=DRIVERS.filter((d,i)=>i!==PLAYER);
 assert.ok(rivals.every(d=>d.skill>1),'every rival improves on the old pace');
 assert.ok(rivals.every(d=>d.ace||d.skill<ace[0].skill),'nobody matches the ace');
});

test('the grid lines up quickest first with the player at the back',()=>{
 assert.equal(DRIVERS[GRID[0]].name,'DHH');
 assert.equal(GRID.at(-1),PLAYER);
 assert.deepEqual([...GRID].sort(),DRIVERS.map((d,i)=>i),'every car gets exactly one slot');
});
