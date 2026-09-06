import * as THREE from 'three';

// A periodic cubic B-spline rounds the control polygon without overshooting it.
// This keeps the inside of a hairpin smooth, unlike an interpolating spline.
class ArenaCurve extends THREE.Curve {
  constructor(points) { super(); this.points=points; this.arcLengthDivisions=2000; }
  getPoint(t,target=new THREE.Vector3()) {
    const n=this.points.length,u=t*n,i=Math.floor(u),v=u-i;
    const weights=[(1-v)**3/6,(3*v**3-6*v*v+4)/6,(-3*v**3+3*v*v+3*v+1)/6,v**3/6];
    target.set(0,0,0);
    for(let j=0;j<4;j++) {
      const p=this.points[(i+j-1+n)%n];
      target.x+=p[0]*weights[j];target.z+=p[1]*weights[j];
    }
    return target;
  }
}

// Shared by scenery, driving, previews, and simulation tests.
export function createCourse(track) {
  // A banked oval is drawn axis-aligned and then turned on the board, so that
  // neither high turn ends up facing the isometric camera edge-on. Banking is
  // still measured in the frame the layout was drawn in.
  const turn=(track.rotation||0)*Math.PI/180,tc=Math.cos(turn),ts=Math.sin(turn);
  const curve = new ArenaCurve(turn?track.points.map(([x,z])=>[x*tc-z*ts,x*ts+z*tc]):track.points);
  const length = curve.getLength();
  const count = 960;
  const points = Array.from({length:count}, (_,i) => curve.getPointAt(i/count));
  const tangents = Array.from({length:count}, (_,i) => curve.getTangentAt(i/count));
  const smooth=(a,b,v)=>{const u=Math.max(0,Math.min(1,(v-a)/(b-a)));return u*u*(3-2*u);};
  function bankAngle(t) {
    if(!track.banking)return 0;
    const p=curve.getPointAt((t%1+1)%1),x=p.x*tc+p.z*ts,z=p.z*tc-p.x*ts;
    const straight=6+12*smooth(-4,20,z);
    return (straight+(31-straight)*smooth(22,40,Math.abs(x)))*Math.PI/180;
  }
  function roadHeight(t,lane=0) {
    return track.banking ? .2+(track.width/2+1.5-lane)*Math.tan(bankAngle(t)) : 0;
  }
  function at(t,lane=0) {
    t=(t%1+1)%1;
    const p=curve.getPointAt(t),d=curve.getTangentAt(t);
    p.y=roadHeight(t,lane);
    return p.add(new THREE.Vector3(-d.z,0,d.x).multiplyScalar(lane));
  }
  function nearest(x,z,previous) {
    let idx=0,min=Infinity;
    for(let i=0;i<count;i++) {
      // At a crossover the route remains on its current branch. The local
      // search also prevents a turn at the X from earning half a lap.
      if(track.crossings && previous!==undefined && Math.abs(((i/count-previous+1.5)%1)-.5)*length>12)continue;
      const p=points[i],d=(p.x-x)**2+(p.z-z)**2;
      if(d<min){min=d;idx=i;}
    }
    return {idx,t:idx/count,distance:Math.sqrt(min),point:points[idx],dir:tangents[idx]};
  }
  function roadFrame(x,z,previous) {
    if(!track.banking)return {height:0,normal:new THREE.Vector3(0,1,0),bank:0};
    const near=nearest(x,z,previous),dx=x-near.point.x,dz=z-near.point.z;
    const t=(near.t+(dx*near.dir.x+dz*near.dir.z)/length+1)%1;
    const lane=-dx*near.dir.z+dz*near.dir.x,bank=bankAngle(t);
    const along=(roadHeight(t+.3/length,lane)-roadHeight(t-.3/length,lane))/.6;
    const across=-Math.tan(bank),d=near.dir;
    return {height:roadHeight(t,lane),bank,normal:new THREE.Vector3(-d.x*along+d.z*across,1,-d.z*along-d.x*across).normalize()};
  }
  const patches=track.patches.map(p=>{
    const pos=at(p.t,p.lane),d=curve.getTangentAt(p.t);
    return {...p,x:pos.x,z:pos.z,dx:d.x,dz:d.z};
  });
  const obstacles=track.obstacles.map(o=>{
    const p=at(o.t,o.lane);
    return {...o,x:p.x,z:p.z,height:o.type==='tree'?4:o.type==='log'?1:1.3};
  });
  return {curve,length,points,tangents,at,nearest,bankAngle,roadHeight,roadFrame,patches,obstacles};
}

export function coursePreview(track) {
  const course=createCourse(track);
  const line=Array.from({length:160},(_,i)=>{
    const p=course.at(i/160);
    return `${i?'L':'M'}${(p.x+54).toFixed(1)},${(p.z+42).toFixed(1)}`;
  }).join(' ')+'Z';
  const start=course.at(.035);
  return `<svg class="course-map" viewBox="-4 -4 116 92" aria-hidden="true"><path d="${line}"/><circle cx="${start.x+54}" cy="${start.z+42}" r="3"/></svg>`;
}
