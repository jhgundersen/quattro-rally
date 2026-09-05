import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTrail, markColor, MARK_COLORS} from './trail.js';

const stubScene=()=>({added:[],add(o){this.added.push(o);},remove(o){this.added.splice(this.added.indexOf(o),1);}});

test('each surface leaves its own mark, with a fallback for anything new',()=>{
 assert.equal(markColor('concrete'),MARK_COLORS.concrete);
 assert.notEqual(markColor('sand'),markColor('mud'));
 assert.equal(markColor('sherbet'),MARK_COLORS.gravel);
});

test('marks are laid at spacing, expire with age, and never outgrow the ribbon',()=>{
 const scene=stubScene(),trail=createTrail(scene,{samples:6,spacing:1,life:2});
 assert.equal(scene.added.length,1);
 assert.equal(trail.sample(0,0,0,'gravel',.5),true);
 assert.equal(trail.sample(0,.4,0,'gravel',.5),false,'too close to be worth a mark');
 for(let i=1;i<=10;i++)trail.sample(0,i,0,'gravel',.5);
 assert.ok(trail.length<=6,'the ring buffer holds the ribbon length');
 trail.fade(1);
 assert.ok(trail.length>0,'marks stay for a while');
 trail.fade(3);
 assert.equal(trail.length,0,'and then they are gone');
});

test('a jump or a grid reset breaks the ribbon instead of dragging it across the arena',()=>{
 const scene=stubScene(),trail=createTrail(scene,{samples:20,spacing:1,life:9});
 trail.sample(0,0,0,'gravel',.5);
 trail.sample(0,1,0,'gravel',.5);
 trail.sample(40,40,0,'gravel',.5);
 assert.equal(trail.length,4,'the old ribbon is closed off and a new one opened');
 const colors=trail.mesh.geometry.attributes.color.array;
 trail.fade(0);
 for(const i of [2,3])assert.equal(colors[(i*4+0)*4+3],0,'the bridging quad is invisible');
 trail.clear();
 assert.equal(trail.length,0);
 trail.dispose();
 assert.equal(scene.added.length,0);
});
