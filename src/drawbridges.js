const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
export function drawbridgeState(bridge,time){
 const phase=((time+(bridge.phase||0))%20+20)%20;
 const angle=.48*smooth((phase-6)/3)*(1-smooth((phase-15)/3));
 return {angle,warning:angle>.05};
}
export function bridgeFrame(course,bridge){
 const p=course.curve.getPointAt(bridge.t),d=course.curve.getTangentAt(bridge.t);return {p,d,half:(bridge.length||9)/2};
}
// Deck height and lip position use exactly the renderer's hinge rotation.
export function bridgeSurface(course,bridge,x,z){
 const {p,d,half}=bridgeFrame(course,bridge),angle=drawbridgeState(bridge,course.traffic.time).angle;
 const along=(x-p.x)*d.x+(z-p.z)*d.z,lane=-(x-p.x)*d.z+(z-p.z)*d.x;
 const gap=half*(1-Math.cos(angle)),sign=along<0?-1:1;
 return {along,lane,half,gap,sign,angle,d,height:Math.max(0,(half-Math.abs(along))*Math.tan(angle)),onDeck:Math.abs(along)<=half&&Math.abs(along)>=gap};
}
export function driveDrawbridges(car,course,track){
 const previous=car.bridgeGround;car.bridgeGround=0;car.bridgeSlope=0;
 for(const [i,bridge] of (track.drawbridges||[]).entries()){
  const s=bridgeSurface(course,bridge,car.x,car.z),speed=car.vx*s.d.x+car.vz*s.d.z;
  if(Math.abs(s.along)>s.half+2||Math.abs(s.lane)>track.width/2+1)continue;
  const was=previous&&Math.abs(previous)===i+1?Math.sign(previous):0;
  // Crossing the rising leaf's tip releases support; preserve its height and
  // convert the ramp slope into upward velocity instead of reflecting the car.
  if(was&&speed*was<0&&s.along*was<s.gap&&s.angle>.02){
   car.air=Math.max(car.air,s.half*Math.sin(s.angle));
   car.vy=Math.max(2,Math.abs(speed)*Math.tan(s.angle));car.jumpCooldown=.3;
   return;
  }
  if(s.onDeck&&(was===s.sign||car.air<=s.height+.12&&car.vy<=0)){
   car.air=s.height;car.vy=0;car.bridgeGround=s.sign*(i+1);car.bridgeSlope=-s.sign*Math.tan(s.angle);car.bridgeHeading=Math.atan2(s.d.x,s.d.z);
  }
 }
}
export function onDrawbridge(track,t,length,padding=0){return (track.drawbridges||[]).some(b=>Math.abs(((t-b.t+1.5)%1)-.5)*length<(b.length||9)/2+padding);}
