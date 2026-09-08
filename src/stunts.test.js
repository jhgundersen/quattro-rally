import {test} from 'node:test';
import * as THREE from 'three';
import assert from 'node:assert/strict';
import {TRACKS} from './tracks.js';
import {createCourse} from './course.js';
import {loopPose,loopSteering,loopOffset} from './stunt-motion.js';
import {driveCar,aiControls} from './physics.js';
const track=TRACKS.find(t=>t.id==='stunts'),course=createCourse(track);
test('loop meets both road ends, inverts the car at the crown and has finite continuous travel',()=>{
 for(const u of [0,1])assert.ok(loopPose(course,track,u).position.distanceTo(course.at(u?track.loop.end:track.loop.start))<.001);
 for(const [t,raw] of [[track.loop.start,track.loop.offsetStart],[track.loop.end,track.loop.offsetEnd]])assert.ok(course.at(t).distanceTo(course.curve.getPoint(raw))<.001,'authored shift boundaries match arc-length loop entry and exit');
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
 assert.ok(loopOffset(track,.5)<-5);
 const c={i:0,x:0,z:0,vx:0,vz:0,angle:0,t:track.loop.start,progress:track.loop.start-.035,air:0,vy:0,nitro:100,stunt:{u:0,lane:0,speed:14,direction:1,facing:1}};
 for(let i=0;i<600;i++)driveCar(c,course,track,1/60,{throttle:1});
 assert.ok(c.stunt&&c.stunt.u<.5,'holding straight cannot complete the shifted road');
 assert.match(c.stunt.guidance,/STEER LEFT/);
 for(let i=0;i<900&&c.stunt;i++)driveCar(c,course,track,1/60,{throttle:1,steer:loopSteering(c,track)});
 assert.equal(c.stunt,null);assert.ok(Math.abs(c.t-track.loop.end)<.002);
});

// At every height the ascending and descending roads must remain separate.
// A lateral out-and-back hump can pass endpoint tests yet clip near the foot.
test('loop winds monotonically into a separate exit lane without overlapping its road ribbon',()=>{
 let previous=loopPose(course,track,0).position.z;
 for(let i=1;i<=200;i++){
  const p=loopPose(course,track,i/200).position;
  assert.ok(p.z<previous);previous=p.z;
 }
 for(let i=0;i<=35;i++){
  const a=loopPose(course,track,i/100).position,b=loopPose(course,track,1-i/100).position;
  // Road width runs laterally; intersecting ribbons at equal elevation need
  // both close longitudinal positions and overlapping lateral intervals.
  assert.ok(Math.abs(a.x-b.x)>.5||Math.abs(a.z-b.z)>track.width+.2,`overlap at ${i/100}`);
 }
 assert.ok(Math.abs(loopPose(course,track,1).position.z-loopPose(course,track,0).position.z)>track.width+2);
});

test('nonadjacent triangles of the actual loop ribbon never intersect',()=>{
 const triangles=[];
 for(let i=0;i<160;i++){
  const a=loopPose(course,track,i/160,-track.width/2).position,b=loopPose(course,track,i/160,track.width/2).position;
  const c=loopPose(course,track,(i+1)/160,-track.width/2).position,d=loopPose(course,track,(i+1)/160,track.width/2).position;
  triangles.push([new THREE.Triangle(a,b,c),i],[new THREE.Triangle(b,d,c),i]);
 }
 const ray=new THREE.Ray(),hit=new THREE.Vector3();
 function intersects(a,b){
  for(const [p,q] of [[a.a,a.b],[a.b,a.c],[a.c,a.a]]){
   const length=p.distanceTo(q);ray.set(p,q.clone().sub(p).normalize());
   if(ray.intersectTriangle(b.a,b.b,b.c,false,hit)&&hit.distanceTo(p)<length-1e-6&&hit.distanceTo(p)>1e-6)return true;
  }
  return false;
 }
 for(let i=0;i<triangles.length;i++)for(let j=i+1;j<triangles.length;j++){
  const [a,ai]=triangles[i],[b,bi]=triangles[j];if(Math.abs(ai-bi)<3)continue;
  assert.ok(!intersects(a,b)&&!intersects(b,a),`ribbon triangles cross at segments ${ai}, ${bi}`);
 }
});
