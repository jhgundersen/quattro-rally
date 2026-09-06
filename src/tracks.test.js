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
test('every track has distinct geometry, valid difficulty and passable obstacles',()=>{
 assert.equal(new Set(TRACKS.map(t=>t.id)).size,TRACKS.length);
 assert.equal(new Set(TRACKS.map(t=>JSON.stringify(t.points))).size,TRACKS.length);
 TRACKS.forEach((t,i)=>{assert.ok(t.difficulty>=1&&t.difficulty<=4);if(i&&i<4){assert.ok(t.width<TRACKS[i-1].width);assert.ok(t.aiSpeed>TRACKS[i-1].aiSpeed);}
  for(const o of t.obstacles)assert.ok(t.width/2+Math.abs(o.lane)-o.radius>3,'obstacles leave a drivable lane');
  for(const p of t.patches)assert.ok(SURFACES[p.type]);
  const {curve,length}=createCourse(t);
  // Inner road edges and barrier offsets must never fold across a hairpin.
  for(let j=0;j<1200;j++){
    const a=curve.getTangentAt(j/1200),b=curve.getTangentAt((j/1200+.1/length)%1);
    assert.ok(.1/a.angleTo(b)>t.width/2+.85,`${t.id}: hairpin radius too small for barriers`);
  }
  // Only declared crossings may overlap; all other lanes retain clearance.
  const samples=Array.from({length:160},(_,j)=>curve.getPointAt(j/160));
  for(let a=0;a<160;a++)for(let b=a+1;b<160;b++){
   const separation=Math.min(b-a,160-(b-a))*length/160;
   const crossing=t.crossings?.some(c=>
    Math.hypot(samples[a].x-c.x,samples[a].z-c.z)<c.radius &&
    Math.hypot(samples[b].x-c.x,samples[b].z-c.z)<c.radius);
   if(separation>t.width*2&&!crossing)assert.ok(samples[a].distanceTo(samples[b])>t.width+1.7,`${t.id}: overlapping course sections`);
  }
 });
});

test('garage concrete provides grip while oil is slippery, including surface reset after a patch',()=>{
 assert.ok(SURFACES.concrete.grip>SURFACES.gravel.grip);
 assert.ok(SURFACES.oil.grip<SURFACES.concrete.grip/2);
 const patch={x:0,z:0,dx:0,dz:1,length:8,width:4,type:'oil'};
 assert.equal(surfaceAt(0,0,0,[patch],'concrete'),'oil');
 assert.equal(surfaceAt(8,0,0,[patch],'concrete'),'concrete');
 assert.equal(surfaceAt(0,0,1,[patch],'concrete'),'concrete');
});
