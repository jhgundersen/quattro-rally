import {wrap,advanceProgress} from './race.js';
import {SURFACES,surfaceAt,collideObstacle} from './tracks.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function aiControls(c,world,track,cars=[]) {
  const near=world.nearest(c.x,c.z),speed=Math.hypot(c.vx,c.vz);
  // Skill above 1 is the locked ace: a racing line, later braking, freer nitro.
  const skill=c.skill||1;
  // Use a physical corner speed and braking distance, instead of slowing
  // through the entire approach to every bend. Player and AI share forces.
  let desired=(track.aiSpeed+5+c.i*.35)*skill,maxTurn=0,bend=0;
  const grip=SURFACES[surfaceAt(c.x,c.z,c.air,world.patches,track.surface)].grip;
  for(const distance of [3,7,12,19]){
    const a=world.curve.getTangentAt((near.t+distance/world.length)%1);
    const b=world.curve.getTangentAt((near.t+(distance+2)/world.length)%1);
    const curvature=Math.max(.001,a.angleTo(b)/2);
    // A quick driver still cannot out-corner the steering rack: yaw rate tops
    // out at 2.15 rad/s, so the radius sets the ceiling. A little over that is
    // the slide they are willing to carry; much over it just runs them wide.
    let corner=Math.min(25,Math.sqrt((grip<2?12:23)/curvature))*(1+(skill-1)*.8);
    if(skill>1)corner=Math.min(corner,2.4/curvature);
    desired=Math.min(desired,Math.sqrt(corner*corner+2*10*Math.max(0,distance-3)));
    maxTurn=Math.max(maxTurn,Math.abs(wrap(Math.atan2(a.x,a.z)-Math.atan2(near.dir.x,near.dir.z))));
    // Positive lane is the +normal side, so the sign points at the inside kerb.
    bend+=Math.sign((b.x-a.x)*-a.z+(b.z-a.z)*a.x)*a.angleTo(b);
  }
  // Grid offset for the pack; the ace hunts the inside of the next corner.
  const reach=Math.min(1.6*skill*skill,track.width/2-1.5);
  let lane=skill>1?clamp(bend*24*skill,-reach,reach):(c.i-1.5)*.65;
  // Commit to a clear passing lane before reaching a slower car. A quick driver
  // closes sooner, but only leaves the racing line for cars actually in the way.
  const room=track.width/2-1.2;
  let passing=false;
  for(const other of cars){
    if(other===c)continue;
    const gap=((other.t-near.t+1)%1)*world.length,closing=speed-Math.hypot(other.vx,other.vz);
    if(gap>1&&gap<(skill>1?Math.min(22,Math.max(10,4+closing*1.4)):10)&&closing>-1){
      const otherLane=(other.x-near.point.x)*-near.dir.z+(other.z-near.point.z)*near.dir.x;
      if(skill>1){if(Math.abs(otherLane-lane)<1.8){lane=clamp(otherLane+(otherLane>0?-2.4:2.4),-room,room);passing=true;}}
      else lane=otherLane>0?-1.8:1.8;
    }
  }
  for(const o of track.obstacles) {
    if(((o.t-near.t+1)%1)*world.length<16)lane=o.lane>0?-1.7:1.7;
  }
  // Aim further ahead when moving off line, so the pass is a drift across the
  // road rather than a jink that scrubs speed and cuts the nitro.
  const lookahead=(3.4+speed*.18)*(passing?2.2:skill>1?1.4:1)/world.length;
  const target=world.at(near.t+lookahead,lane);
  const error=wrap(Math.atan2(target.x-c.x,target.z-c.z)-c.angle);
  desired*=1-Math.min(Math.abs(error)*.12,.3);
  return {
    throttle:speed>desired+1?-.8:speed>desired?0:1,
    steer:clamp(error*2.6,-1,1),
    boost:maxTurn<.32*skill*skill&&Math.abs(error)<.17*skill&&c.nitro>8/skill&&speed>10&&speed<desired+2&&near.distance<track.width*.3*skill,
    brake:false,
  };
}

export function driveCar(c,world,track,dt,controls) {
  const near=world.nearest(c.x,c.z);
  c.surface=surfaceAt(c.x,c.z,c.air,world.patches,track.surface);
  const surface=SURFACES[c.surface];
  let {throttle=0,steer=0,brake=false,boost=false}=controls;
  const skill=c.skill||1;
  const speed=Math.hypot(c.vx,c.vz),forward=c.vx*Math.sin(c.angle)+c.vz*Math.cos(c.angle);
  if(c.finished){throttle=.3;boost=false;}
  c.angle+=steer*2.15*Math.min(speed/5,1)*(forward<-.5?-1:1)*(c.air>.1?.25:1)*dt;
  if(brake)throttle=forward>1?-1.8:-.5;
  boost=boost&&c.nitro>0;
  const acceleration=(throttle*12+(boost?17:0))*(c.air>.4?1:surface.power);
  // Skilled drivers spend the bottle freely because it comes back quicker.
  c.nitro=clamp(c.nitro+(boost?-30/skill:5*skill*skill)*dt,0,100);
  const fx=Math.sin(c.angle),fz=Math.cos(c.angle),side=c.vx*fz-c.vz*fx;
  const grip=c.air>.1?.15:surface.grip,drag=c.air>.4?.3:surface.drag;
  c.vx+=(fx*acceleration-c.vx*drag-side*fz*grip)*dt;
  c.vz+=(fz*acceleration-c.vz*drag+side*fx*grip)*dt;
  if(near.distance>track.width/2){c.vx*=Math.exp(-1.8*dt);c.vz*=Math.exp(-1.8*dt);}
  c.x+=c.vx*dt;c.z+=c.vz*dt;
  const edge=track.width/2+.9;
  const boundary=world.nearest(c.x,c.z);
  if(boundary.distance>edge){
    const nx=(c.x-boundary.point.x)/boundary.distance,nz=(c.z-boundary.point.z)/boundary.distance;
    c.x=boundary.point.x+nx*edge;c.z=boundary.point.z+nz*edge;
    const outward=c.vx*nx+c.vz*nz;
    if(outward>0){c.vx-=nx*outward*1.4;c.vz-=nz*outward*1.4;}
  }
  c.jumpCooldown=Math.max(0,c.jumpCooldown-dt);
  if(c.air<=0&&c.jumpCooldown===0&&speed>9&&track.jumps.some(t=>Math.abs(near.t-t)*world.length<1.6)){
    c.vy=4+speed*.12;c.jumpCooldown=.65;
  }
  c.vy-=16*dt;c.air=Math.max(0,c.air+c.vy*dt);if(c.air===0)c.vy=Math.max(0,c.vy);
  for(const o of world.obstacles)collideObstacle(c,o);
  const next=world.nearest(c.x,c.z).t;
  c.progress=advanceProgress(c.t,next,c.progress);c.t=next;
  return {speed,fx,fz,surface};
}

export function collideCars(cars) {
  for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
    const a=cars[i],b=cars[j];if(Math.abs(a.air-b.air)>1)continue;
    const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
    if(d>0&&d<2){
      const nx=dx/d,nz=dz/d,push=(2-d)*.5;
      a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;
      const v=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;
      if(v>0){a.vx-=nx*v*.65;a.vz-=nz*v*.65;b.vx+=nx*v*.65;b.vz+=nz*v*.65;}
    }
  }
}
