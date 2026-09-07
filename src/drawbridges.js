const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
export function drawbridgeState(bridge,time){
 const phase=((time+(bridge.phase||0))%20+20)%20;
 const angle=.95*smooth((phase-10)/2)*(1-smooth((phase-15)/2));
 return {angle,blocked:phase>=8&&phase<17.3,warning:phase>=6&&phase<17.3};
}
export function bridgeFrame(course,bridge){
 const p=course.curve.getPointAt(bridge.t),d=course.curve.getTangentAt(bridge.t);return {p,d,half:(bridge.length||9)/2};
}
export function collideDrawbridges(car,course,track){
 for(const bridge of track.drawbridges||[]){
  if(!drawbridgeState(bridge,course.traffic.time).blocked||car.air>5)continue;
  if(Math.abs(((car.t-bridge.t+1.5)%1)-.5)*course.length>18)continue;
  const {p,d,half}=bridgeFrame(course,bridge),dx=car.x-p.x,dz=car.z-p.z;
  const along=dx*d.x+dz*d.z,lane=-dx*d.z+dz*d.x,limit=half+2;
  if(Math.abs(along)>=limit||Math.abs(lane)>track.width/2+1.2)continue;
  const sign=along<0?-1:1,push=sign*limit-along;
  car.x+=d.x*push;car.z+=d.z*push;
  const speed=car.vx*d.x+car.vz*d.z;
  if(speed*sign<0){car.vx-=d.x*speed*1.15;car.vz-=d.z*speed*1.15;}
 }
}
export function onDrawbridge(track,t,length,padding=0){return (track.drawbridges||[]).some(b=>Math.abs(((t-b.t+1.5)%1)-.5)*length<(b.length||9)/2+padding);}
