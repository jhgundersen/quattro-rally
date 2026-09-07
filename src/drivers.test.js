import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DRIVERS, GRID, PLAYER, FACES, cleanFace, portrait} from './drivers.js';

test('the player drives the amber car and nobody else has a fixed livery clash',()=>{
 assert.equal(DRIVERS[PLAYER].name,'Player');
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

test('the portrait picker offers a full set of distinct faces, and every driver owns one',()=>{
 assert.ok(FACES.length>=12,'there is a real choice to make');
 assert.equal(new Set(FACES.map(f=>f.name)).size,FACES.length,'no two faces share a name');
 assert.ok(FACES.every(f=>f.details&&f.skin),'every face has its own drawing and skin tone');
 assert.deepEqual(DRIVERS.map(d=>d.face),[0,1,2,3],'the solo field keeps the faces it always wore');
});

test('a face index from the network is clamped, and the livery stays with the seat',()=>{
 assert.equal(cleanFace(5),5);
 for(const bad of [-1,FACES.length,1.5,'2',null,undefined,NaN])assert.equal(cleanFace(bad,3),3,`${bad} is not a face`);
 const svg=portrait(9,{color:DRIVERS[2].color,trim:DRIVERS[3].trim,name:'Someone'});
 assert.ok(svg.includes(DRIVERS[2].color),'the seat colour paints the helmet');
 assert.ok(svg.includes(FACES[9].details),'the chosen face is drawn on top');
 assert.ok(svg.includes('Someone portrait'),'the driver is named for screen readers');
 assert.ok(portrait(99).includes(FACES[0].details),'an unknown face falls back rather than breaking');
});
