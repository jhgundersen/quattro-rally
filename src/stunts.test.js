import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS} from './tracks.js';
import {createCourse} from './course.js';
import {loopPose,loopSteering,loopOffset} from './stunt-motion.js';
import {driveCar,aiControls} from './physics.js';
const track=TRACKS.find(t=>t.id==='stunts'),course=createCourse(track);
test('loop meets both road ends, inverts the car at the crown and has finite continuous travel',()=>{
 for(const u of [0,1])assert.ok(loopPose(course,track,u).position.distanceTo(course.at(u?track.loop.end:track.loop.start))<.001);
 const top=loopPose(course,track,.5);assert.ok(top.normal.y<-.99);assert.ok(top.position.y>13);
 for(let i=0;i<100;i++){const a=loopPose(course,track,i/100),b=loopPose(course,track,(i+1)/100);assert.ok(a.position.distanceTo(b.position)<1);assert.ok(a.distance>1);}
 assert.ok(course.roadHeight(.64)>4);assert.ok(course.bankAngle(.57)>.35);
});
test('slow and boosted cars traverse the loop once without skipping route progress',()=>{
 for(const boost of [false,true]){
  const t=track.loop.start-.006,p=course.at(t),d=course.curve.getTangentAt(t);
  const car={i:0,x:p.x,z:p.z,vx:d.x*12,vz:d.z*12,angle:Math.atan2(d.x,d.z),t,progress:t-.035,air:0,vy:0,nitro:100,jumpCooldown:0};
  let entered=false,top=0;
  for(let i=0;i<1200;i++){
   const before=car.progress;driveCar(car,course,track,1/60,car.stunt?{throttle:boost?1:0,boost,steer:loopSteering(car,track)}:aiControls(car,course,track));
   assert.ok(Math.abs(car.progress-before)<.015);top=Math.max(top,car.stuntHeight||0);entered||=!!car.stunt;
   if(entered&&!car.stunt)break;
  }
  assert.ok(entered&&top>13&&!car.stunt);assert.ok(Math.abs(car.t-track.loop.end)<.002);
 }
});

test('reversing through the loop removes progress rather than teleporting to its entrance',()=>{
 const t=track.loop.end+.004,p=course.at(t),d=course.curve.getTangentAt(t);
 const car={i:0,x:p.x,z:p.z,vx:-d.x*10,vz:-d.z*10,angle:Math.atan2(d.x,d.z),t,progress:t-.035,air:0,vy:0,nitro:100,jumpCooldown:0};
 let entered=false;
 for(let i=0;i<1200;i++){
  const before=car.progress;driveCar(car,course,track,1/60,{brake:true,steer:car.stunt?loopSteering(car,track):0});assert.ok(car.progress<=before+.001);assert.ok(Math.abs(car.progress-before)<.015);
  entered||=!!car.stunt;if(entered&&!car.stunt)break;
 }
 assert.ok(entered&&!car.stunt);assert.ok(Math.abs(car.t-track.loop.start)<.002);
});

test('the sideways loop requires steering, and following its line releases an edge stall',()=>{
 assert.ok(loopOffset(track,.5)>5);
 const c={i:0,x:0,z:0,vx:0,vz:0,angle:0,t:track.loop.start,progress:track.loop.start-.035,air:0,vy:0,nitro:100,stunt:{u:0,lane:0,speed:14,direction:1,facing:1}};
 for(let i=0;i<600;i++)driveCar(c,course,track,1/60,{throttle:1});
 assert.ok(c.stunt&&c.stunt.u<.5,'holding straight cannot complete the shifted road');
 assert.match(c.stunt.guidance,/STEER RIGHT/);
 for(let i=0;i<900&&c.stunt;i++)driveCar(c,course,track,1/60,{throttle:1,steer:loopSteering(c,track)});
 assert.equal(c.stunt,null);assert.ok(Math.abs(c.t-track.loop.end)<.002);
});
