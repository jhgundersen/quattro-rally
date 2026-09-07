import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWheelMotion} from './wheels.js';

test('wheels roll with distance, reverse direction and freeze while paused',()=>{
 const update=createWheelMotion(),car={x:0,z:0,angle:0};update(car,0);
 car.z=.22;const forward=update(car,.1);assert.ok(Math.abs(forward.spin-.5)<1e-10);
 assert.deepEqual(update(car,.1),forward);
 car.z=0;assert.ok(Math.abs(update(car,.2).spin)<1e-10);
});

test('front steering follows bends, handles heading wrap and ignores resets',()=>{
 const update=createWheelMotion(),car={x:0,z:0,angle:Math.PI-.02};update(car,0);
 car.z=-.2;car.angle=-Math.PI+.02;const bend=update(car,.1);
 assert.ok(bend.steer>0&&bend.steer<=.48);
 car.x=40;assert.deepEqual(update(car,.2),{spin:0,steer:0});
 car.z=20;assert.deepEqual(update(car,0),{spin:0,steer:0});
});
