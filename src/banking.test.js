import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS} from './tracks.js';
import {createCourse} from './course.js';
import {driveCar} from './physics.js';
import {createTrail} from './trail.js';
const track=TRACKS.find(t=>t.id==='daytona'),world=createCourse(track);

test('Daytona has 31-degree raised outer turns and gentler straights with continuous transitions',()=>{
 let maxBank=0,minBank=Infinity;
 for(let i=0;i<1000;i++){
  const t=i/1000,bank=world.bankAngle(t),inner=world.at(t,track.width/2),outer=world.at(t,-track.width/2);
  maxBank=Math.max(maxBank,bank);minBank=Math.min(minBank,bank);
  assert.ok(outer.y>inner.y,'outer lane is higher');
  assert.ok(Math.abs((outer.y-inner.y)/track.width-Math.tan(bank))<1e-8);
  assert.ok(Math.abs(outer.y-world.at(t+.001,-track.width/2).y)<.2,'no steps at the bank transitions or lap seam');
  for(const lane of [-4,0,4]){
   const p=world.at(t,lane),frame=world.roadFrame(p.x,p.z);
   assert.ok(Math.abs(frame.height-p.y)<.03,'car contact follows rendered road');
   assert.ok(frame.normal.y>.7&&frame.normal.y<=1,'normal tilts upward');
  }
 }
 assert.ok(Math.abs(maxBank*180/Math.PI-31)<.01);
 assert.ok(minBank*180/Math.PI<7);
});

test('bank gravity pulls a coasting car toward the lower lane',()=>{
 // Pick the steepest point of the banking rather than a fixed coordinate, so
 // the test follows the layout when the course is turned on the board.
 let t=0;for(let i=0;i<world.points.length;i++)if(world.bankAngle(i/world.points.length)>world.bankAngle(t))t=i/world.points.length;
 const p=world.at(t),d=world.curve.getTangentAt(t);
 const c={i:0,x:p.x,z:p.z,t,progress:0,vx:0,vz:0,angle:Math.atan2(d.x,d.z),air:0,vy:0,nitro:100,jumpCooldown:0};
 driveCar(c,world,track,1/60,{});
 assert.ok(c.vx*-d.z+c.vz*d.x>0,'gravity acts inward along the slope');
});

test('unbanked courses retain zero road elevation',()=>{
 for(const track of TRACKS.filter(t=>!t.banking)){
  const world=createCourse(track);
  for(const t of [0,.25,.5,.75])assert.equal(world.at(t,3).y,0);
  assert.equal(world.roadFrame(0,0).height,0);
 }
});

test('tyre strips follow the sloped surface at each wheel',()=>{
 const scene={add(){},remove(){}},trail=createTrail(scene);
 const height=(x,z)=>2+x*.5;
 trail.sample(0,0,0,'asphalt',.5,height);trail.sample(0,1,0,'asphalt',.5,height);trail.fade(0);
 const p=trail.mesh.geometry.attributes.position.array;
 for(let i=0;i<8;i++)assert.ok(Math.abs(p[i*3+1]-height(p[i*3],p[i*3+2])-.055)<1e-6);
 trail.dispose();
});
