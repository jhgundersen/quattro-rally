import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDust, dustDensity, DUST_DENSITY} from './dust.js';

const stubScene=()=>({added:[],add(o){this.added.push(o);},remove(o){this.added.splice(this.added.indexOf(o),1);}});

test('loose surfaces smoke, hard ones barely do, and anything new is treated as dirt',()=>{
 assert.ok(dustDensity('sand')>dustDensity('gravel'));
 assert.ok(dustDensity('concrete')<.2,'a parking garage does not throw up dirt');
 assert.equal(dustDensity('marzipan'),DUST_DENSITY.gravel);
});

test('a puff billows in, thins out, and frees its slot',()=>{
 const scene=stubScene(),dust=createDust(scene,{count:4});
 assert.equal(scene.added.length,1);
 dust.spawn(0,.3,0,'#cfb78b',{opacity:.5,seconds:1,vy:2});
 assert.equal(dust.live,1);
 const alpha=dust.points.geometry.attributes.alpha.array;
 const size=dust.points.geometry.attributes.size.array;
 const y=()=>dust.points.geometry.attributes.position.array[1];
 dust.update(.08);
 assert.ok(alpha[0]>0&&alpha[0]<.5,'it fades in rather than popping');
 const grown=size[0];
 dust.update(.5);
 assert.ok(alpha[0]>0&&alpha[0]<.5,'and thins out over the rest of its life');
 assert.ok(size[0]>grown,'the cloud keeps spreading');
 assert.ok(y()>.3,'and drifts upward');
 dust.update(1);
 assert.equal(dust.live,0);
 assert.equal(alpha[0],0);
});

test('the pool recycles oldest-first and can be wiped for a new race',()=>{
 const scene=stubScene(),dust=createDust(scene,{count:3});
 for(let i=0;i<3;i++)dust.spawn(i,0,0,'#cfb78b',{seconds:5});
 assert.equal(dust.live,3);
 assert.equal(dust.spawn(9,0,0,'#cfb78b',{seconds:5}),0,'the fourth puff takes the first slot back');
 assert.equal(dust.points.geometry.attributes.position.array[0],9);
 assert.equal(dust.live,3,'a fixed pool never grows');
 dust.clear();
 assert.equal(dust.live,0);
 dust.dispose();
 assert.equal(scene.added.length,0);
});
