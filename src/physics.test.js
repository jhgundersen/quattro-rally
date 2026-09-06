import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS} from './tracks.js';
import {createCourse} from './course.js';
import {aiControls,driveCar,collideCars} from './physics.js';

for(const track of TRACKS) {
  test(`four drivers finish three laps of ${track.layout}`,()=>{
    const world=createCourse(track);
    const cars=Array.from({length:4},(_,i)=>{
      const t=.035-.022-Math.floor(i/2)*.026;
      const p=world.at(t,i%2?2:-2),d=world.curve.getTangentAt((t+1)%1);
      return {i,x:p.x,z:p.z,vx:0,vz:0,angle:Math.atan2(d.x,d.z),t:(t+1)%1,progress:t-.035,nitro:100,air:0,vy:0,jumpCooldown:0,finished:false};
    });
    let highestJump=0;
    for(let frame=0;frame<60*180&&!cars.every(c=>c.finished);frame++) {
      for(const c of cars){
        const previous=c.progress;
        driveCar(c,world,track,1/60,aiControls(c,world,track,cars));
        assert.ok(Number.isFinite(c.x)&&Number.isFinite(c.z));
        assert.ok(Math.abs(c.progress-previous)<.015,'no teleporting to an adjacent lane');
        highestJump=Math.max(highestJump,c.air);
        if(c.progress>=3&&!c.finished){c.finished=true;c.finishTime=frame/60;}
      }
      collideCars(cars);
    }
    assert.ok(cars.every(c=>c.finished),`stalled drivers: ${cars.map(c=>c.progress.toFixed(2)).join(', ')}`);
    const paceLimits={gravel:58,forest:82,desert:71,alpine:65,garage:74,bog:140,lemans:85};
    assert.ok(Math.max(...cars.map(c=>c.finishTime))<paceLimits[track.id],'rivals maintain competitive three-lap pace');
    if(track.jumps.length)assert.ok(highestJump>.6,'drivers reach the jump sections');
    else assert.equal(highestJump,0,'flat circuits keep cars grounded');
  });
}

import {DRIVERS} from './drivers.js';
const ace=DRIVERS.find(d=>d.ace);

// Skill has to buy real pace, not just a faster-looking number, so compare
// clean time trials rather than a race where traffic decides the order.
function timeTrial(track,skill){
  const world=createCourse(track),t=.035-.022;
  const p=world.at(t,-2),d=world.curve.getTangentAt((t+1)%1);
  const c={i:0,skill,x:p.x,z:p.z,vx:0,vz:0,angle:Math.atan2(d.x,d.z),t:(t+1)%1,progress:t-.035,nitro:100,air:0,vy:0,jumpCooldown:0,finished:false};
  let frame=0;
  for(;frame<60*220&&c.progress<3;frame++)driveCar(c,world,track,1/60,aiControls(c,world,track,[]));
  return frame/60;
}

for(const track of TRACKS) {
  test(`${ace.name} beats the standard rival pace on ${track.layout}`,()=>{
    const rival=timeTrial(track,1),locked=timeTrial(track,ace.skill);
    assert.ok(locked<rival*.9,`${ace.name} ${locked.toFixed(2)}s is no quicker than ${rival.toFixed(2)}s`);
    assert.ok(locked>rival*.5,`${ace.name} ${locked.toFixed(2)}s laps a field running ${rival.toFixed(2)}s`);
    // The gravel pit is the yardstick: a quick human laps it in about 35s, and
    // beating the ace has to stay possible but genuinely hard.
    if(track.id==='gravel')assert.ok(locked>28&&locked<34.5,`${ace.name} runs the gravel pit in ${locked.toFixed(2)}s`);
  });
}
