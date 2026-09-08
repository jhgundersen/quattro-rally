import {test} from 'node:test';
import assert from 'node:assert/strict';
import {carContact,collideCars,driveCar} from './physics.js';
import {Room} from '../server/rooms.js';
const car=(x,z,angle=0,vx=0,vz=0)=>({x,z,angle,vx,vz,air:0});
const energy=cars=>cars.reduce((sum,c)=>sum+c.vx*c.vx+c.vz*c.vz,0);

test('bumper contact transfers momentum before bodywork overlaps deeply',()=>{
 const a=car(0,0,0,0,20),b=car(0,3.6,0,0,5);
 assert.ok(carContact(a,b));collideCars([a,b]);
 assert.equal(carContact(a,b),null);
 assert.ok(a.vz<20&&b.vz>5&&b.vz>a.vz);
 assert.ok(Math.abs(a.vz+b.vz-25)<1e-10);
 assert.ok(energy([a,b])<=425);
});

test('doors rub, perpendicular cars bump, and nearby clear lanes stay clear',()=>{
 for(const [a,b] of [[car(0,0,0,5,12),car(2.1,0,0,0,12)],[car(0,0,0,0,12),car(1.8,1.8,Math.PI/2,-10,0)]]){
  const before=energy([a,b]);assert.ok(carContact(a,b));collideCars([a,b]);
  assert.equal(carContact(a,b),null);assert.ok(energy([a,b])<=before+1e-9);
 }
 const clear=[car(0,0),car(2.5,0)],before=structuredClone(clear);
 collideCars(clear);assert.deepEqual(clear,before);
});

test('coincident cars separate finitely, receding cars get no extra impulse, and jumps clear traffic',()=>{
 const pile=[car(0,0),car(0,0)];collideCars(pile);
 assert.equal(carContact(...pile),null);
 assert.ok(pile.every(c=>Number.isFinite(c.x)&&Number.isFinite(c.z)));
 const apart=[car(0,0,0,-2,0),car(2.1,0,0,2,0)];collideCars(apart);
 assert.equal(apart[0].vx,-2);assert.equal(apart[1].vx,2);
 const jump=[car(0,0),{...car(0,0),air:2}],before=structuredClone(jump);
 collideCars(jump);assert.deepEqual(jump,before);
});

test('online cars pass through one another without contact impulses or position corrections',()=>{
 const room=new Room('gravel',0);
 for(let i=0;i<4;i++){room.join(`Driver ${i}`,null,0);room.action(i,{type:'ready',ready:true},0);}
 room.action(0,{type:'start'},0);room.phase='racing';
 const t=.12,p=room.world.at(t),d=room.world.curve.getTangentAt(t),angle=Math.atan2(d.x,d.z);
 for(let i=0;i<4;i++){
  const c=room.cars[i],offset=i===1?3.65:0;
  const pos=i<2?{x:p.x+d.x*offset,z:p.z+d.z*offset}:room.world.at(.45+i*.12);
  Object.assign(c,{x:pos.x,z:pos.z,t:i<2?t:.45+i*.12,angle,vx:i===0?d.x*20:0,vz:i===0?d.z*20:0});
 }
 const independent=structuredClone(room.cars);
 let overlap=false;
 for(let frame=0;frame<30;frame++){
  for(const c of independent)driveCar(c,room.world,room.track,1/60,{});
  room.tick(1/60,10+frame*17);
  const [a,b]=room.snapshot().cars;overlap||=!!carContact(a,b);
  for(const i of [0,1])for(const key of ['x','z','vx','vz'])assert.equal(room.cars[i][key],independent[i][key],`online ${key} matches driving without contact`);
 }
 assert.ok(overlap,'the test actually exercises overlapping cars');
});
