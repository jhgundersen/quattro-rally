import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {TRACKS} from './tracks.js';
import {createCourse} from './course.js';
import {trainCars,crossingBlocked,collideTrain} from './trains.js';
import {createRailyard} from './railyard.js';
import {aiControls,driveCar} from './physics.js';
import {Room} from '../server/rooms.js';
const track=TRACKS.find(t=>t.id==='railyard');

test('train timing is deterministic, directional and resettable',()=>{
 const a=createCourse(track),b=createCourse(track);
 assert.equal(a.railCrossings.length,6);
 for(const time of [0,3,8,19,37,180]){a.setTime(time);b.setTime(time);assert.deepEqual(a.traffic,b.traffic);}
 a.setTime(0);assert.deepEqual(a.traffic.trains,trainCars(track,0));
 const now=trainCars(track,1),next=trainCars(track,1.01);
 now.forEach((t,i)=>assert.ok(Math.abs(next[i].x-t.x-t.vx*.01)<1e-10));
 assert.deepEqual(trainCars(TRACKS[0],10),[]);
});

test('yard models and crossing lights use the shared traffic clock',()=>{
 const world=createCourse(track),group=new THREE.Group(),yard=createRailyard(group,world,track);
 const models=group.children.filter(c=>c.userData.train);
 assert.equal(models.length,6);
 for(const time of [0,5,12,24]){
  world.setTime(time);yard.updateTraffic();
  models.forEach((m,i)=>{assert.equal(m.position.x,world.traffic.trains[i].x);assert.equal(m.position.z,world.traffic.trains[i].z);});
 }
 const crossing=world.railCrossings[0];
 assert.ok(Array.from({length:250},(_,i)=>crossingBlocked(track,crossing,i/10)).some(Boolean));
 assert.ok(Array.from({length:250},(_,i)=>crossingBlocked(track,crossing,i/10)).some(v=>!v));
 const geometry=new Set(),material=new Set();group.traverse(o=>{if(o.geometry)geometry.add(o.geometry);if(o.material)material.add(o.material);});geometry.forEach(g=>g.dispose());material.forEach(m=>m.dispose());
});

test('trains are solid at their sides, ends and center, with finite separation',()=>{
 const train={x:0,z:0,halfX:3.25,halfZ:1.5,height:3.5};
 for(const [x,z] of [[0,2],[3.8,0],[0,0]]){
  const car={x,z,vx:-x*5,vz:-z*5,air:0};
  assert.ok(collideTrain(car,train));assert.ok(Number.isFinite(car.x)&&Number.isFinite(car.z));
  assert.ok(Math.abs(car.x)>=4.19||Math.abs(car.z)>=2.44);
 }
 assert.equal(collideTrain({x:0,z:0,vx:0,vz:0,air:4},train),false);
 assert.equal(collideTrain({x:10,z:0,vx:0,vz:0,air:0},train),false);
});

test('AI brakes before an occupied crossing and can drive away after the train clears',()=>{
 const world=createCourse(track),crossing=world.railCrossings[0];
 let time=0;while(!crossingBlocked(track,crossing,time)&&time<30)time+=.1;
 world.setTime(time);
 const t=crossing.t-7/world.length,p=world.at(t),d=world.curve.getTangentAt(t);
 const car={i:0,x:p.x,z:p.z,t,angle:Math.atan2(d.x,d.z),vx:d.x*12,vz:d.z*12,air:0,nitro:100,progress:0,vy:0,jumpCooldown:0};
 const controls=aiControls(car,world,track);assert.ok(controls.throttle<0);assert.equal(controls.boost,false);
 for(let frame=0;frame<60*35;frame++){world.setTime(time+frame/60);driveCar(car,world,track,1/60,aiControls(car,world,track));}
 assert.ok(car.progress>.5,'driver continues around the yard');
});

test('the authoritative multiplayer room advances trains and freezes them with results',()=>{
 const room=new Room('railyard',0),seat=room.join('Rail QA',null,0);room.action(seat.slot,{type:'ready',ready:true},1);room.action(seat.slot,{type:'start'},2);
 room.phase='racing';room.players[seat.slot].active=false;
 for(let i=0;i<90;i++)room.tick(1/60,2000+i*17);
 assert.equal(room.world.traffic.time,room.time);assert.deepEqual(room.world.traffic.trains,trainCars(track,room.time));
 const before=structuredClone(room.world.traffic);room.phase='finished';room.tick(1/60,4000);assert.deepEqual(room.world.traffic,before);
});
