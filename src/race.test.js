import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceProgress, wrap, formatTime } from './race.js';
test('forward finish-line crossing advances a lap',()=>assert.ok(Math.abs(advanceProgress(.99,.01,.99)-1.01)<1e-9));
test('reverse crossing subtracts progress instead of awarding a lap',()=>assert.ok(Math.abs(advanceProgress(.01,.99,.01)+.01)<1e-9));
test('driving backwards and forwards cannot farm laps',()=>assert.ok(Math.abs(advanceProgress(.99,.01,advanceProgress(.01,.99,.4))-.4)<1e-9));
test('heading error takes the short turn across pi',()=>assert.ok(Math.abs(wrap(Math.PI*2-.1)+.1)<1e-9));
test('race timer formats minutes and hundredths',()=>assert.equal(formatTime(65.25),'01:05.25'));

test('podium orders finishers by time, then racers by progress without mutating the grid',async()=>{
 const {raceStandings}=await import('./race.js');
 const grid=[{i:0,finished:true,finishTime:70,progress:3},{i:1,finished:false,progress:2.8},{i:2,finished:true,finishTime:65,progress:3.2},{i:3,finished:false,progress:2.5}];
 assert.deepEqual(raceStandings(grid).map(c=>c.i),[2,0,1,3]);
 assert.deepEqual(grid.map(c=>c.i),[0,1,2,3]);
 grid[1].finished=true;grid[1].finishTime=72;grid[1].progress=3;
 assert.deepEqual(raceStandings(grid).map(c=>c.i),[2,0,1,3]);
});
