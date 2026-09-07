import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {TRACKS} from './tracks.js';
import {createCourse} from './course.js';
import {drawbridgeState,collideDrawbridges,bridgeFrame} from './drawbridges.js';
import {createDrawbridges} from './drawbridge-world.js';
import {driveCar,aiControls} from './physics.js';
const track=TRACKS.find(t=>t.id==='stunts');
test('drawbridges warn before lifting, close again, and repeat on the shared clock',()=>{
 const bridge=track.drawbridges[0];
 assert.deepEqual(drawbridgeState(bridge,0),{angle:0,blocked:false,warning:false});
 assert.equal(drawbridgeState(bridge,7).warning,true);assert.equal(drawbridgeState(bridge,9).blocked,true);assert.equal(drawbridgeState(bridge,9).angle,0);
 assert.ok(drawbridgeState(bridge,13).angle>.9);assert.equal(drawbridgeState(bridge,18).blocked,false);
 for(const time of [0,7,9,11,13,16,19])assert.deepEqual(drawbridgeState(bridge,time),drawbridgeState(bridge,time+20));
});
test('raised crossings stop cars from either side but closed decks remain passable',()=>{
 const world=createCourse(track),bridge=track.drawbridges[0],{p,d,half}=bridgeFrame(world,bridge);
 for(const sign of [-1,1]){
  const c={x:p.x+d.x*sign*half,z:p.z+d.z*sign*half,t:bridge.t,air:0,vx:-sign*d.x*12,vz:-sign*d.z*12};
  world.setTime(0);const before={...c};collideDrawbridges(c,world,track);assert.deepEqual(c,before);
  world.setTime(13);collideDrawbridges(c,world,track);const along=(c.x-p.x)*d.x+(c.z-p.z)*d.z;
  assert.ok(Math.abs(along)>=half+1.99);assert.ok((c.vx*d.x+c.vz*d.z)*sign>=0);
 }
});
test('bridge road leaves render the same angle that physics blocks, including reset',()=>{
 const world=createCourse(track),group=new THREE.Group(),model=createDrawbridges(group,world,track);
 for(const time of [0,11,13,16,18,0]){
  world.setTime(time);model.update();let count=0;
  group.traverse(o=>{if(o.name==='drawbridge-leaf'){assert.ok(Math.abs(o.rotation.x-o.userData.sign*drawbridgeState(o.userData.bridge,time).angle)<1e-9);count++;}});assert.equal(count,4);
 }
});
test('AI waits at a raised drawbridge and resumes when the crossing opens',()=>{
 const world=createCourse(track),t=track.drawbridges[0].t-12/world.length,p=world.at(t),d=world.curve.getTangentAt(t);
 const c={i:0,x:p.x,z:p.z,vx:d.x*10,vz:d.z*10,angle:Math.atan2(d.x,d.z),t,progress:t-.035,air:0,vy:0,nitro:100,jumpCooldown:0};
 world.setTime(11);assert.ok(aiControls(c,world,track).throttle<0);
 for(let i=0;i<12*60;i++){world.setTime(11+i/60);driveCar(c,world,track,1/60,aiControls(c,world,track));}
 assert.ok(c.progress>.12,'car clears the crossing after the bridge closes');
});
