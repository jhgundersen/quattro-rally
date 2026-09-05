import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS,SURFACES,surfaceAt,collideObstacle} from './tracks.js';
import {createCourse} from './course.js';

test('surface detection follows a rotated patch and ignores cars jumping over it',()=>{
 const patch={x:10,z:20,dx:1,dz:0,length:8,width:4,type:'water'};
 assert.equal(surfaceAt(13,20,0,[patch]),'water');
 assert.equal(surfaceAt(10,23,0,[patch]),'gravel');
 assert.equal(surfaceAt(13,20,1,[patch]),'gravel');
});
test('mud and water resist motion, ice reduces grip',()=>{
 for(const type of ['mud','water','sand']){assert.ok(SURFACES[type].drag>SURFACES.gravel.drag);assert.ok(SURFACES[type].power<1);}
 assert.ok(SURFACES.ice.grip<SURFACES.gravel.grip/2);
});
test('solid obstacle separates a car and reflects incoming velocity',()=>{
 const car={x:1,z:0,vx:-10,vz:2,air:0};
 assert.equal(collideObstacle(car,{x:0,z:0,radius:1,height:2}),true);
 assert.equal(car.x,1.95);assert.ok(car.vx>0);assert.equal(car.vz,2);
});
test('airborne cars clear low obstacles but not trees',()=>{
 const car={x:1,z:0,vx:-10,vz:0,air:2};
 assert.equal(collideObstacle(car,{x:0,z:0,radius:1,height:1}),false);
 assert.equal(collideObstacle(car,{x:0,z:0,radius:1,height:4}),true);
});
test('exact obstacle-center collision remains finite',()=>{
 const car={x:0,z:0,vx:0,vz:0,air:0};collideObstacle(car,{x:0,z:0,radius:1,height:1});
 assert.ok(Number.isFinite(car.x));assert.ok(Math.hypot(car.x,car.z)>1);
});
test('every track has distinct geometry and increasing difficulty, with passable obstacles',()=>{
 assert.equal(new Set(TRACKS.map(t=>t.id)).size,4);
 assert.equal(new Set(TRACKS.map(t=>JSON.stringify(t.points))).size,4);
 TRACKS.forEach((t,i)=>{assert.equal(t.difficulty,i+1);if(i){assert.ok(t.width<TRACKS[i-1].width);assert.ok(t.aiSpeed>TRACKS[i-1].aiSpeed);}
  for(const o of t.obstacles)assert.ok(t.width/2+Math.abs(o.lane)-o.radius>3,'obstacles leave a drivable lane');
  for(const p of t.patches)assert.ok(SURFACES[p.type]);
  const {curve,length}=createCourse(t);
  // Inner road edges and barrier offsets must never fold across a hairpin.
  for(let j=0;j<1200;j++){
    const a=curve.getTangentAt(j/1200),b=curve.getTangentAt((j/1200+.1/length)%1);
    assert.ok(.1/a.angleTo(b)>t.width/2+.85,`${t.id}: hairpin radius too small for barriers`);
  }
  // Distant course sections must not overlap and allow ambiguous lap tracking.
  const samples=Array.from({length:160},(_,j)=>curve.getPointAt(j/160));
  for(let a=0;a<160;a++)for(let b=a+1;b<160;b++){const separation=Math.min(b-a,160-(b-a))*length/160;if(separation>t.width*2)assert.ok(samples[a].distanceTo(samples[b])>t.width+1.7,`${t.id}: overlapping course sections`);}
 });
});
