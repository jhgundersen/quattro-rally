// Train motion is a function of race time, shared by renderer, AI, prediction
// and server. Wraps happen entirely beyond the visible yard portals.
export function trainCars(track,time=0){
 return (track.rails||[]).flatMap((rail,line)=>{
  const direction=Math.sign(rail.speed),span=200;
  const lead=((time*Math.abs(rail.speed)+rail.phase)%span+span)%span-100;
  return Array.from({length:3},(_,car)=>({line,car,x:direction*(lead-car*7.2),z:rail.z,vx:rail.speed,halfX:3.25,halfZ:1.5,height:3.5}));
 });
}
export function crossingBlocked(track,crossing,time,margin=0){
 return trainCars(track,time).some(train=>train.line===crossing.line&&Math.abs(train.x-crossing.x)<train.halfX+track.width*.65+margin);
}
export function collideTrain(car,train){
 if(car.air>train.height)return false;
 const dx=car.x-train.x,dz=car.z-train.z;
 const x=Math.max(-train.halfX,Math.min(train.halfX,dx)),z=Math.max(-train.halfZ,Math.min(train.halfZ,dz));
 const rx=dx-x,rz=dz-z,d=Math.hypot(rx,rz),radius=.95;
 if(d>=radius)return false;
 let nx,nz,push;
 if(d>.0001){nx=rx/d;nz=rz/d;push=radius-d;}
 else if(train.halfX-Math.abs(dx)<train.halfZ-Math.abs(dz)){nx=dx<0?-1:1;nz=0;push=train.halfX-Math.abs(dx)+radius;}
 else{nx=0;nz=dz<0?-1:1;push=train.halfZ-Math.abs(dz)+radius;}
 car.x+=nx*push;car.z+=nz*push;
 const inward=car.vx*nx+car.vz*nz;
 if(inward<0){car.vx-=nx*inward*1.25;car.vz-=nz*inward*1.25;}
 car.vx*=.55;car.vz*=.55;
 return true;
}
