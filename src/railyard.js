import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {crossingBlocked} from './trains.js';

export function createRailyard(group,course,track){
 const yard=new THREE.Group();group.add(yard);
 const mats=new Map(),frames=[];
 const mat=color=>{if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.92}));return mats.get(color);};
 const mesh=(geo,color,x=0,y=0,z=0,parent=yard)=>{const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const box=(w,h,d,color,x=0,y=0,z=0,parent=yard)=>mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent);
 const steel='#515e5b',rust='#98644b',wood='#756454';
 function rails(z,from=-71,to=71){
  box(to-from,.04,3.8,'#696c62',(from+to)/2,.008,z);
  for(let x=from;x<to;x+=1.3)box(.28,.035,3.15,wood,x,.025,z);
  for(const side of [-1,1])box(to-from,.04,.11,steel,(from+to)/2,.045,z+side*1.08);
 }
 for(const rail of track.rails)rails(rail.z);
 rails(-38,-48,44);rails(37,-48,43);
 // Buffers, rusty parked stock, and an old switch fan beyond the racing lanes.
 for(const z of [-38,37])for(const x of [-49,44]){
  box(.5,.9,3.6,rust,x,.5,z);box(.55,.5,.55,'#333f3d',x+.2,.6,z-1.1);box(.55,.5,.55,'#333f3d',x+.2,.6,z+1.1);
 }
 function wagon(loco,line){
  const g=new THREE.Group(),tone=line===0?'#546d5c':'#b1714d';
  box(6.5,.45,2.65,'#3e4945',0,.62,0,g);
  if(loco){
   box(3.7,1.55,2.5,tone,-.7,1.62,0,g);box(1.9,2.6,2.7,tone,1.8,2,0,g);
   box(2.12,.22,2.95,'#c4baa0',1.8,3.4,0,g);
   for(const z of [-1.36,1.36])box(1.2,.8,.035,'#a6c5bc',1.8,2.65,z,g);
   box(.035,.75,1.8,'#abc9bf',2.77,2.65,0,g);
   for(let i=0;i<8;i++)for(const side of [-1,1])box(.075,.9,.035,'#263f3b',-2.25+i*.4,1.7,side*1.27,g);
   box(.45,.8,.55,'#2e3935',-.3,2.8,0,g);
   for(const side of [-1,1])box(.18,.45,.4,'#eeddb0',-3.28,1.5,side*.9,g);
   box(.08,.32,2.65,'#d2b065',-3.3,1.03,0,g);
  }else{
   box(5.9,2.5,2.8,line===0?'#a97154':'#698383',0,2,0,g);
   box(6.1,.2,3,'#777d6c',0,3.33,0,g);
   for(let x=-2.7;x<3;x+=.5)for(const side of [-1,1])box(.065,2.4,.09,'#4f6258',x,2,side*1.42,g);
   for(const side of [-1,1]){box(1.3,1.95,.1,'#87654f',0,1.85,side*1.47,g);box(.45,.38,.12,'#d8c5a0',1.7,2.05,side*1.47,g);}
  }
  for(const x of [-2.05,2.05])for(const z of [-1.25,1.25]){const w=mesh(new THREE.CylinderGeometry(.45,.45,.25,12),'#303d39',x,.45,z,g);w.rotation.x=Math.PI/2;}
  for(const x of [-3.55,3.55])box(.7,.16,.35,'#333f3b',x,.7,0,g);
  return g;
 }
 for(const [x,z,line] of [[-32,-38,0],[-24,-38,0],[26,37,1],[34,37,1]]){const g=wagon(false,line);g.position.set(x,0,z);yard.add(g);}
 // Brick locomotive shop with three dark doors and a sawtooth roof.
 box(15,4.7,9,'#936b52',-28,2.35,-.5);
 for(const x of [-33,-28,-23]){
  box(3.1,3.2,.06,'#30423d',x,1.65,4.03);
  box(3.6,.2,.35,'#c4ae82',x,3.5,4.1);
  const shape=new THREE.Shape();shape.moveTo(-2.5,0);shape.lineTo(2.5,0);shape.lineTo(1.9,1.2);shape.closePath();
  mesh(new THREE.ExtrudeGeometry(shape,{depth:9.5,bevelEnabled:false}),'#61706a',x,4.7,-5.2);
  box(4,.7,.08,'#a4b9aa',x,4.13,4.06);
 }
 box(1.4,8,1.4,'#82563f',-35,4,-3);box(1.75,.3,1.75,'#685344',-35,8,-3);
 // Freight office, loading platform and corrugated canopy in the eastern pocket.
 box(12,.75,9,'#8a8570',26,.3,-.5);box(8,3.9,5.5,'#c0b797',27,2,-1.5);
 box(12,.22,9,'#4e6862',26,4.2,-.5);
 for(const x of [21,31])for(const z of [-4,3])box(.18,4.1,.18,steel,x,2,z);
 for(const x of [24.5,27,29.5])box(1.1,1.1,.04,'#526d6b',x,2.6,1.28);
 for(const [x,z] of [[21,1],[21,-2],[29,4]])box(1.5,1.5,1.4,'#a88b5f',x,1.1,z);
 // Covered portals conceal off-stage train wrapping at both ends of each line.
 for(const rail of track.rails)for(const x of [-65,65]){
  box(11,.4,5.4,'#7c7867',x,4.4,rail.z);
  for(const side of [-1,1])box(11,4.2,.4,'#8c7259',x,2.1,rail.z+side*2.5);
  for(const dx of [-6,6])for(const dz of [-3,3])for(const y of [0,6])frames.push(new THREE.Vector3(x+dx,y,rail.z+dz));
 }
 // Crossbuck signs and alternating warning lamps at each real road crossing.
 const lamps=[];
 for(const crossing of course.railCrossings){
  for(const side of [-1,1]){
   const p=course.at(crossing.t+side*4.5/course.length,track.width/2+1.25);
   box(.15,2.8,.15,steel,p.x,1.4,p.z);
   for(const angle of [-.65,.65]){const arm=box(1.5,.17,.09,'#e6d4a7',p.x,2.7,p.z);arm.rotation.z=angle;}
   box(1.15,.53,.17,'#364743',p.x,2.06,p.z);
   for(const blink of [0,1]){
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),new THREE.MeshBasicMaterial({color:'#5a4131'}));lamp.position.set(p.x+(blink?-.3:.3),2.07,p.z+.15);group.add(lamp);lamps.push({lamp,crossing,blink});
   }
  }
 }
 // Low weeds, discarded sleepers and cable drums, all clear of the road/rails.
 for(let i=0;i<45;i++){
  const x=Math.sin(i*13.7)*53,z=Math.cos(i*8.3)*32;
  if(course.nearest(x,z).distance<8||track.rails.some(r=>Math.abs(r.z-z)<4)||Math.abs(z)<6)continue;
  if(i%3===0){const drum=mesh(new THREE.CylinderGeometry(.7,.7,.85,10),'#9b835a',x,.7,z);drum.rotation.z=Math.PI/2;}
  else for(let j=0;j<3;j++){const sleeper=box(2.3,.18,.25,wood,x,.15+j*.18,z);sleeper.rotation.y=i*.5;}
 }
 yard.updateMatrixWorld(true);const batches=new Map();
 yard.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);g.deleteAttribute('uv');if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);o.geometry.dispose();});yard.clear();
 for(const [material,geos] of batches){const g=mergeGeometries(geos);geos.forEach(g=>g.dispose());const m=new THREE.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;yard.add(m);}
 const trains=course.traffic.trains.map(t=>{const g=wagon(t.car===0,t.line);g.userData.train={line:t.line,car:t.car};group.add(g);return g;});
 function updateTraffic(){
  course.traffic.trains.forEach((t,i)=>{const g=trains[i];g.position.set(t.x,0,t.z);g.rotation.y=t.vx>0?Math.PI:0;g.visible=Math.abs(t.x)<71;});
  for(const {lamp,crossing,blink} of lamps){const warning=crossingBlocked(track,crossing,course.traffic.time,3)||crossingBlocked(track,crossing,course.traffic.time+1.2,3);lamp.material.color.set(warning&&(Math.floor(course.traffic.time*4)%2===blink)?'#ff5940':'#553d30');}
 }
 updateTraffic();frames.push(new THREE.Vector3(-35,9,-3));
 return {framingPoints:frames,updateTraffic};
}
