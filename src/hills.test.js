import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS} from './tracks.js';
import {createCourse} from './course.js';
import {driveCar} from './physics.js';
const track=TRACKS.find(t=>t.id==='stavanger'),world=createCourse(track);

test('Stavanger climbs and descends continuous cobbles with matching car contact',()=>{
 let low=Infinity,high=0,up=0,down=0;
 assert.equal(track.surface,'cobble');
 for(let i=0;i<960;i++){
  const t=i/960,p=world.at(t),next=world.at(t+.4/world.length);
  low=Math.min(low,p.y);high=Math.max(high,p.y);
  if(next.y-p.y>.04)up++;if(next.y-p.y<-.04)down++;
  assert.ok(Math.abs(next.y-p.y)<.13,'no abrupt crests or seam');
  for(const lane of [-track.width/2,0,track.width/2]){
   const p=world.at(t,lane),frame=world.roadFrame(p.x,p.z,t);
   assert.ok(Math.abs(p.y-frame.height)<.035,'cars follow the visible road across its width');
   assert.equal(p.y,world.terrainHeight(p.x,p.z),'road meets the hillside');
   assert.ok(frame.normal.y>.95,'gentle street gradients');
  }
 }
 assert.ok(high-low>5,'meaningful vertical relief');
 assert.ok(up>80&&down>80,'extended climbs and descents');
});

test('a coasting car rolls downhill on the Stavanger streets',()=>{
 let t=0,slope=0;
 for(let i=0;i<960;i++){const p=world.at(i/960),q=world.at(i/960+.4/world.length);if(q.y-p.y>slope){t=i/960;slope=q.y-p.y;}}
 const p=world.at(t),d=world.curve.getTangentAt(t),c={i:0,x:p.x,z:p.z,t,progress:0,vx:0,vz:0,angle:Math.atan2(d.x,d.z),air:0,vy:0,nitro:100,jumpCooldown:0};
 driveCar(c,world,track,1/60,{});
 assert.ok(c.vx*d.x+c.vz*d.z<0,'gravity pulls against the uphill tangent');
 assert.equal(c.air,0);
});
