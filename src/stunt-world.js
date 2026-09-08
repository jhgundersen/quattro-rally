import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {onDrawbridge} from './drawbridges.js';
import {loopPose} from './stunt-motion.js';
export function createStuntPark(group,course,track){
 const parts=new Map(),mats=new Map(),frames=[];
 const material=color=>{if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.8,side:THREE.DoubleSide}));return mats.get(color);};
 function mesh(geo,color,pos=new THREE.Vector3(),rotation){
  const m=new THREE.Mesh(geo,material(color));m.position.copy(pos);if(rotation)m.quaternion.copy(rotation);m.updateMatrix();
  const g=geo.index?geo.toNonIndexed():geo.clone();g.applyMatrix4(m.matrix);g.deleteAttribute('uv');if(!parts.has(color))parts.set(color,[]);parts.get(color).push(g);geo.dispose();
 }
 function box(w,h,d,color,pos,rotation){mesh(new THREE.BoxGeometry(w,h,d),color,pos,rotation);}
 function strip(sample,count,width,color){
  const v=[],idx=[];for(let i=0;i<=count;i++)for(const lane of [-width/2,width/2]){const p=sample(i/count,lane);v.push(p.x,p.y,p.z);frames.push(p.clone().add(new THREE.Vector3(0,3,0)));}
  for(let i=0;i<count;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(geo,color);
 }
 // A complete drivable vertical loop, with yellow rails and concrete feet.
 strip((u,lane)=>loopPose(course,track,u,lane).position,160,track.width,'#50565c');
 for(const side of [-1,1])strip((u,lane)=>{const p=loopPose(course,track,u,side*(track.width/2-.18)+lane);return p.position.addScaledVector(p.normal,.07);},160,.23,'#f4cf48');
 for(let i=0;i<36;i+=2)strip((v,lane)=>{const u=(i+v)/36,p=loopPose(course,track,u,lane);return p.position.addScaledVector(p.normal,.035);},2,.18,'#f4cf48');
 // Self-supporting side hoops leave the drivable opening clear. Vertical
 // crown posts would pierce the lower half of the offset road.
 for(const side of [-1,1])strip((u,lane)=>{const p=loopPose(course,track,u,side*(track.width/2-.12)+lane);return p.position.addScaledVector(p.normal,-.18);},160,.32,'#536879');
 for(const u of [0,1])for(const side of [-1,1]){
  const p=loopPose(course,track,u,side*(track.width/2+.4)).position;
  box(.7,.35,1.3,'#b4b3a2',p.add(new THREE.Vector3(0,.05,0)));
 }
 // Faceted steel pipe: the road runs through it, with broad entrance rings.
 const {start,end}=track.pipe;
 for(let i=0;i<12;i++){
  const t=start+(end-start)*(i+.5)/12,p=course.at(t),d=course.curve.getTangentAt(t),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.atan2(d.x,d.z));
  const ring=new THREE.CylinderGeometry(5.1,5.1,course.length*(end-start)/12+.06,12,1,true);ring.rotateX(Math.PI/2);
  p.y+=2.9;mesh(ring,i%3===0?'#d6d9d2':'#7b94a3',p,q);
 }
 // Raised skyway with regular piers and a visible underside.
 for(let i=0;i<40;i++){
  const t=.55+i*.18/39,p=course.at(t),d=course.curve.getTangentAt(t),frame=course.roadFrame(p.x,p.z,t);
  if(p.y<.4)continue;
  const forward=d.clone().addScaledVector(frame.normal,-d.dot(frame.normal)).normalize(),right=new THREE.Vector3().crossVectors(frame.normal,forward).normalize();
  const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,frame.normal,forward));
  box(track.width,.32,course.length*.18/39+.15,'#616d78',p.clone().addScaledVector(frame.normal,-.22),q);
  if(i%5===0)for(const lane of [-3,3]){const foot=course.at(t,lane);box(.7,foot.y,.7,'#d1cbb4',new THREE.Vector3(foot.x,foot.y/2,foot.z));}
 }
 // White lane paint, red/white kerbs and original DOS-era scenery.
 for(let i=0;i<100;i++){
  const t=i/100;if(t>track.loop.start&&t<track.loop.end||onDrawbridge(track,t,course.length,1))continue;
  const p=course.at(t),d=course.curve.getTangentAt(t);box(.15,.025,1.5,'#eeeade',p.clone().add(new THREE.Vector3(0,.06,0)),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.atan2(d.x,d.z)));
 }
 for(const [x,z] of [[-33,-3],[-28,8],[0,20],[30,8],[31,-11]]){
  if(course.nearest(x,z).distance<9)continue;
  box(.6,3,.6,'#795934',new THREE.Vector3(x,1.5,z));mesh(new THREE.ConeGeometry(2.7,6,5),'#265e3d',new THREE.Vector3(x,5,z));
 }
 // A red barn and windmill recall the sparse polygonal original landscape.
 box(9,4,6,'#a43c30',new THREE.Vector3(-31,2,-9));
 const roof=new THREE.CylinderGeometry(0,6,3,4);roof.rotateY(Math.PI/4);mesh(roof,'#e6e3d2',new THREE.Vector3(-31,5.3,-9));
 box(2,2.8,.05,'#e9e4cf',new THREE.Vector3(-31,1.4,-5.97));
 box(2,8,2,'#d7ccb1',new THREE.Vector3(28,4,-5));
 for(const angle of [Math.PI/4,-Math.PI/4])box(.4,9,.2,'#eadbc0',new THREE.Vector3(28,7,-3.8),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),angle));
 for(const [color,geos] of parts){const m=new THREE.Mesh(mergeGeometries(geos),material(color));m.castShadow=true;m.receiveShadow=true;group.add(m);geos.forEach(g=>g.dispose());}
 return {framingPoints:frames};
}
