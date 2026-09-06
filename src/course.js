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
  const curve = new ArenaCurve(track.points);
  const length = curve.getLength();
  const count = 960;
  const points = Array.from({length:count}, (_,i) => curve.getPointAt(i/count));
  const tangents = Array.from({length:count}, (_,i) => curve.getTangentAt(i/count));
  function at(t,lane=0) {
    t=(t%1+1)%1;
    const p=curve.getPointAt(t),d=curve.getTangentAt(t);
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
  const patches=track.patches.map(p=>{
    const pos=at(p.t,p.lane),d=curve.getTangentAt(p.t);
    return {...p,x:pos.x,z:pos.z,dx:d.x,dz:d.z};
  });
  const obstacles=track.obstacles.map(o=>{
    const p=at(o.t,o.lane);
    return {...o,x:p.x,z:p.z,height:o.type==='tree'?4:o.type==='log'?1:1.3};
  });
  return {curve,length,points,tangents,at,nearest,patches,obstacles};
}

export function coursePreview(track) {
  const course=createCourse(track);
  const line=Array.from({length:160},(_,i)=>{
    const p=course.at(i/160);
    return `${i?'L':'M'}${(p.x+54).toFixed(1)},${(p.z+42).toFixed(1)}`;
  }).join(' ')+'Z';
  const start=course.at(.035);
  return `<svg class="course-map" viewBox="0 0 108 84" aria-hidden="true"><path d="${line}"/><circle cx="${start.x+54}" cy="${start.z+42}" r="3"/></svg>`;
}
