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
        driveCar(c,world,track,1/60,aiControls(c,world,track));
        assert.ok(Number.isFinite(c.x)&&Number.isFinite(c.z));
        assert.ok(Math.abs(c.progress-previous)<.015,'no teleporting to an adjacent lane');
        highestJump=Math.max(highestJump,c.air);
        if(c.progress>=3&&!c.finished){c.finished=true;c.finishTime=frame/60;}
      }
      collideCars(cars);
    }
    assert.ok(cars.every(c=>c.finished),`stalled drivers: ${cars.map(c=>c.progress.toFixed(2)).join(', ')}`);
    assert.ok(highestJump>.6,'drivers reach the jump sections');
  });
}
