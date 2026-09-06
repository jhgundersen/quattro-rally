import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS,SURFACES} from './tracks.js';
import {createCourse} from './course.js';
import {driveCar,collideCars} from './physics.js';
const track=TRACKS.find(t=>t.id==='bog'),world=createCourse(track);
function car(t,speed=0){
 const p=world.at(t),d=world.curve.getTangentAt(t);
 return {i:0,x:p.x,z:p.z,vx:d.x*speed,vz:d.z*speed,angle:Math.atan2(d.x,d.z),t,progress:t-.035,nitro:100,air:0,vy:0,jumpCooldown:0,finished:false};
}
test('Bog has two distinct branches through a real, open crossing and a muddy base',()=>{
 assert.ok(world.at(.25).distanceTo(world.at(.75))<.01);
 assert.ok(world.curve.getTangentAt(.25).angleTo(world.curve.getTangentAt(.75))>1.4);
 assert.ok(SURFACES[track.surface].drag>SURFACES.gravel.drag);
 for(const t of [.25,.75])assert.ok(world.obstacles.every(o=>Math.hypot(o.x-world.at(t).x,o.z-world.at(t).z)>track.width));
});
test('route stays on the correct crossing branch in both directions and at lap wrap',()=>{
 for(const center of [.25,.75,1])for(const direction of [-1,1]){
  let previous=(center-direction*.04+1)%1;
  for(let i=0;i<=80;i++){
   const t=(center+direction*(-.04+i*.001)+1)%1,p=world.at(t);
   const next=world.nearest(p.x,p.z,previous).t;
   assert.ok(Math.abs(((next-t+1.5)%1)-.5)<.002);
   previous=next;
  }
 }
});
test('trying to turn down the other branch cannot skip a loop, even airborne',()=>{
 for(const entry of [.25,.75])for(const air of [0,2]){
  const c=car(entry,20),wrong=world.curve.getTangentAt((entry+.5)%1);
  c.angle=Math.atan2(wrong.x,wrong.z);c.vx=wrong.x*20;c.vz=wrong.z*20;c.air=air;
  const start=c.progress;
  for(let i=0;i<180;i++){
   const previous=c.progress;
   driveCar(c,world,track,1/60,{throttle:1,boost:true});
   assert.ok(Math.abs(c.progress-previous)<.015);
  }
  assert.ok(c.progress-start<.12,'a wrong turn earns no half-lap shortcut');
 }
});
test('a boosted ramp approach clears a grounded crossing car; a slow approach remains vulnerable',()=>{
 for(const speed of [7,18]){
  const c=car(track.jumps[0]-2/world.length,speed);
  for(let i=0;i<180&&c.t<.25;i++)driveCar(c,world,track,1/60,{throttle:1,boost:speed>9});
  assert.ok(c.t>=.25,'car reaches the intersection');
  const other=car(.75);other.x=c.x+.5;other.z=c.z;
  const before=c.x;
  if(speed>9)assert.ok(c.air>1,'jump clears car roof at the intersection');
  else assert.ok(c.air<1,'slow cars do not automatically clear traffic');
  collideCars([c,other]);
  if(speed>9)assert.equal(c.x,before);else assert.notEqual(c.x,before);
 }
});
