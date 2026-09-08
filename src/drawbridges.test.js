import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {TRACKS} from './tracks.js';
import {createCourse} from './course.js';
import {drawbridgeState,bridgeSurface,bridgeFrame} from './drawbridges.js';
import {createDrawbridges} from './drawbridge-world.js';
import {driveCar,aiControls} from './physics.js';
const track=TRACKS.find(t=>t.id==='stunts');
test('bridges lift and lower on a repeating shared clock',()=>{
 const bridge=track.drawbridges[0];
 assert.equal(drawbridgeState(bridge,0).angle,0);assert.ok(drawbridgeState(bridge,13).angle>.4);assert.equal(drawbridgeState(bridge,19).angle,0);
 for(const time of [0,7,9,11,13,16,19])assert.deepEqual(drawbridgeState(bridge,time),drawbridgeState(bridge,time+20));
});
test('rendered bridge lips agree with physical ramp height and gap',()=>{
 const world=createCourse(track),group=new THREE.Group(),model=createDrawbridges(group,world,track);
 for(const time of [0,7,13,16,19]){
  world.setTime(time);model.update();group.updateMatrixWorld(true);let count=0;
  group.traverse(o=>{if(o.name==='drawbridge-leaf'){
   const {bridge,sign}=o.userData,{half}=bridgeFrame(world,bridge);
   const lip=o.localToWorld(new THREE.Vector3(0,0,-sign*half));
   const surface=bridgeSurface(world,bridge,lip.x,lip.z);
   assert.ok(Math.abs(lip.y-surface.height)<1e-6);assert.ok(Math.abs(Math.abs(surface.along)-surface.gap)<1e-6);count++;
  }});assert.equal(count,4);
 }
});
test('cars climb raised leaves, launch across their gap, and land without a blocking impulse in either direction',()=>{
 for(const direction of [-1,1])for(const time of [0,7.5,13,16.5]){
  const world=createCourse(track),bridge=track.drawbridges[0],{p,d,half}=bridgeFrame(world,bridge);
  const t=bridge.t-direction*(half+2)/world.length;
  const car={i:0,x:p.x-d.x*direction*(half+2),z:p.z-d.z*direction*(half+2),vx:d.x*direction*18,vz:d.z*direction*18,angle:Math.atan2(d.x*direction,d.z*direction),t,progress:t-.035,air:0,vy:0,nitro:100,jumpCooldown:0};
  let climbed=false,launched=false,peak=0;
  for(let i=0;i<180;i++){
   world.setTime(time);driveCar(car,world,track,1/60,{throttle:1});
   climbed||=!!car.bridgeGround;launched||=climbed&&!car.bridgeGround&&car.vy>1;peak=Math.max(peak,car.air);
   const along=(car.x-p.x)*d.x+(car.z-p.z)*d.z;
   if(Math.abs(along)<half+2)assert.ok((car.vx*d.x+car.vz*d.z)*direction>10,'bridge never stops or reflects the car');
   if(climbed&&along*direction>half+1&&car.air===0)break;
  }
  assert.ok(climbed);if(time){assert.ok(launched);assert.ok(peak>1);}
  assert.equal(car.air,0,'car lands after crossing');
 }
});
test('AI attacks a raised bridge instead of waiting for it to close',()=>{
 const world=createCourse(track),t=track.drawbridges[0].t-12/world.length,p=world.at(t),d=world.curve.getTangentAt(t);
 const c={i:0,x:p.x,z:p.z,vx:d.x*10,vz:d.z*10,angle:Math.atan2(d.x,d.z),t,progress:t-.035,air:0,vy:0,nitro:100,jumpCooldown:0};
 world.setTime(13);assert.ok(aiControls(c,world,track).throttle>0);
 let launched=false;
 for(let i=0;i<120;i++){driveCar(c,world,track,1/60,aiControls(c,world,track));launched||=c.vy>2;}
 assert.ok(launched);assert.ok(c.t>track.drawbridges[0].t+.02);
});

test('authoritative multiplayer publishes ramp contact and airborne jumps on its shared clock',async()=>{
 const {Room}=await import('../server/rooms.js');
 const room=new Room('stunts',0),seat=room.join('Jump QA',null,0);
 room.action(seat.slot,{type:'ready',ready:true},1);room.action(seat.slot,{type:'start'},2);
 room.phase='racing';room.time=12;room.players[seat.slot].active=false;
 const bridge=track.drawbridges[0],t=bridge.t-9/room.world.length,p=room.world.at(t),d=room.world.curve.getTangentAt(t),car=room.cars[seat.slot];
 Object.assign(car,{x:p.x,z:p.z,t,progress:t-.035,angle:Math.atan2(d.x,d.z),vx:d.x*18,vz:d.z*18});
 let supported=false,airborne=false;
 for(let i=0;i<180;i++){
  room.tick(1/60,2000+i*17);const snapshot=JSON.parse(JSON.stringify(room.snapshot())),c=snapshot.cars[seat.slot];
  assert.equal(room.world.traffic.time,snapshot.time);
  supported||=!!c.bridgeGround;airborne||=supported&&!c.bridgeGround&&c.vy>1;
  assert.ok(Number.isFinite(c.air)&&Number.isFinite(c.x));
 }
 assert.ok(supported&&airborne);assert.ok(car.t>bridge.t+.025);
});
