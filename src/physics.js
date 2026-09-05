import {wrap,advanceProgress} from './race.js';
import {SURFACES,surfaceAt,collideObstacle} from './tracks.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function aiControls(c,world,track) {
  const near=world.nearest(c.x,c.z),speed=Math.hypot(c.vx,c.vz);
  // Measure lookahead in metres so long, folded courses don't cut hairpins.
  let lane=(c.i-2)*.85;
  for(const o of track.obstacles) {
    if(((o.t-near.t+1)%1)*world.length<13)lane=o.lane>0?-1.5:1.5;
  }
  const lookahead=(3.1+speed*.17)/world.length;
  const target=world.at(near.t+lookahead,lane);
  const error=wrap(Math.atan2(target.x-c.x,target.z-c.z)-c.angle);
  const ahead=world.curve.getTangentAt((near.t+10/world.length)%1);
  const turn=Math.abs(wrap(Math.atan2(ahead.x,ahead.z)-Math.atan2(near.dir.x,near.dir.z)));
  const desired=Math.max(9,(track.aiSpeed+c.i*.6)*(1-Math.min(turn*.48,.53)));
  return {
    throttle:speed>desired+1.5?-.7:speed>desired?0:1,
    steer:clamp(error*2.3,-1,1),
    boost:turn<.12&&Math.abs(error)<.12&&c.nitro>30&&speed>13,
    brake:false,
  };
}

export function driveCar(c,world,track,dt,controls) {
  const near=world.nearest(c.x,c.z);
  c.surface=surfaceAt(c.x,c.z,c.air,world.patches);
  const surface=SURFACES[c.surface];
  let {throttle=0,steer=0,brake=false,boost=false}=controls;
  const speed=Math.hypot(c.vx,c.vz),forward=c.vx*Math.sin(c.angle)+c.vz*Math.cos(c.angle);
  if(c.finished){throttle=.3;boost=false;}
  c.angle+=steer*2.15*Math.min(speed/5,1)*(forward<-.5?-1:1)*(c.air>.1?.25:1)*dt;
  if(brake)throttle=forward>1?-1.8:-.5;
  boost=boost&&c.nitro>0;
  const acceleration=(throttle*12+(boost?17:0))*(c.air>.4?1:surface.power);
  c.nitro=clamp(c.nitro+(boost?-30:5)*dt,0,100);
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
