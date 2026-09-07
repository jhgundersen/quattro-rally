import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Room} from '../server/rooms.js';
import {scoreRound,tournamentStandings} from './tournament.js';
function room(){const r=new Room('gravel',0);r.join('Alice',null,0);r.join('Bob',null,0);return r;}
function ready(r){r.action(0,{type:'ready',ready:true},0);r.action(1,{type:'ready',ready:true},0);}
function finish(r){r.phase='racing';for(let i=0;i<3;i++)Object.assign(r.cars[i],{finished:true,finishTime:30+i});r.tick(1/60,100);}
test('host selects one to five distinct rounds in order and changes reset readiness',()=>{
 const r=room();ready(r);
 assert.throws(()=>r.action(1,{type:'tracks',tracks:['bog']}),/host/);
 for(const tracks of [[],['bog','bog'],['missing'],['gravel','forest','desert','alpine','garage','bog']])assert.throws(()=>r.action(0,{type:'tracks',tracks}),/one to five/);
 r.action(0,{type:'tracks',tracks:['bog','stunts','gravel']});assert.deepEqual(r.info().tournament.tracks,['bog','stunts','gravel']);assert.equal(r.track.id,'bog');assert.ok(r.players.filter(Boolean).every(p=>!p.ready));
});
test('rounds accumulate once, preserve reconnects and host handoff, then reset for a new cup',()=>{
 const r=room();r.action(0,{type:'tracks',tracks:['gravel','stunts']});ready(r);r.action(0,{type:'start'},0);
 assert.throws(()=>r.action(0,{type:'next'}),/not available/);finish(r);const scored=structuredClone(r.tournament());r.tick(1/60);assert.deepEqual(r.tournament(),scored);
 assert.equal(scored.complete,false);assert.equal(scored.standings[0].points,10);assert.throws(()=>r.action(0,{type:'lobby'}),/remaining/);
 const token=r.players[0].token;r.disconnect(0,200);assert.equal(r.host,1);r.join('Alice',token,300);assert.deepEqual(r.snapshot().tournament,scored);
 assert.throws(()=>r.action(0,{type:'next'}),/host/);r.action(1,{type:'next'},400);assert.equal(r.track.id,'stunts');assert.equal(r.round,1);assert.equal(r.phase,'countdown');assert.ok(r.cars.every(c=>!c.finished));
 finish(r);assert.equal(r.tournament().complete,true);assert.equal(r.tournament().standings[0].points,20);assert.throws(()=>r.action(1,{type:'next'}),/not available/);
 r.action(1,{type:'lobby'},500);assert.equal(r.rounds.length,0);assert.equal(r.track.id,'gravel');assert.deepEqual(r.schedule,['gravel','stunts']);
});
test('scores give DNF zero and ties use podium countback then penalized time',()=>{
 const cars=[0,1,2,3].map(i=>({i,finished:i<3,finishTime:30+i,progress:3-i*.1}));
 const round=scoreRound(cars,'gravel');assert.deepEqual(round.results.map(r=>r.points),[10,6,4,0]);
 const tie=[{track:'gravel',results:[{seat:0,place:1,points:10,time:50},{seat:1,place:2,points:6,time:30}]},{track:'bog',results:[{seat:0,place:4,points:0,time:null},{seat:1,place:3,points:4,time:40}]}];
 assert.equal(tournamentStandings(tie)[0].seat,0,'one win beats a second and a third');
 const timed=[{track:'bog',results:[{seat:0,place:1,points:10,time:40},{seat:1,place:1,points:10,time:30}]}];assert.equal(tournamentStandings(timed)[0].seat,1);
});
