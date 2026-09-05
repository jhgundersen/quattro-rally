import * as THREE from 'three';
import { createCourse } from './course.js';
export function createWorld(scene,track){
 const group=new THREE.Group();scene.add(group);
 const materials=new Map();const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.94}));return materials.get(color);};
 const mesh=(geometry,color,x=0,y=0,z=0,parent=group)=>{const m=new THREE.Mesh(geometry,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const box=(w,h,d,color,x=0,y=0,z=0,parent=group)=>mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent);
 let seed=track.seed;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const course=createCourse(track);
 const {curve,points,tangents,at,nearest}=course,N=points.length;
 function ribbon(a,b,color,y){const vertices=[],indices=[];for(let i=0;i<=N;i++)for(const offset of [a,b]){const p=at(i/N,offset);vertices.push(p.x,y,p.z);}for(let i=0;i<N;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();mesh(g,color);}
 box(126,1,94,track.ground,0,-.65,0);ribbon(-track.width/2,track.width/2,track.road,.01);ribbon(-2.5,-1.4,track.rut,.025);ribbon(1.4,2.5,track.rut,.025);
 const barrierCount=Math.ceil(course.length/2.5);
 for(let i=0;i<barrierCount;i++)for(const side of [-1,1]){
   const t=i/barrierCount,p=at(t,side*(track.width/2+.85)),d=curve.getTangentAt(t);
   const barrier=box(.65,.65,2.2,i%4<2?track.edge:'#a9513d',p.x,.32,p.z);
   barrier.rotation.y=Math.atan2(d.x,d.z);
 }
 // Direction arrows make adjacent lanes and hairpin exits readable at a glance.
 const arrowShape=new THREE.Shape();arrowShape.moveTo(-.8,-.7);arrowShape.lineTo(0,.8);arrowShape.lineTo(.8,-.7);arrowShape.lineTo(0,-.2);arrowShape.closePath();
 for(let i=0;i<Math.ceil(course.length/28);i++){
   const t=(.09+i*28/course.length)%1,p=at(t),d=curve.getTangentAt(t);
   const arrow=mesh(new THREE.ShapeGeometry(arrowShape),track.edge,p.x,.065,p.z);
   arrow.rotation.set(-Math.PI/2,0,Math.atan2(-d.x,-d.z));arrow.castShadow=false;
 }
 for(let i=0;i<130;i++){const p=at(random(),(random()-.5)*track.width);box(.1+random()*.15,.04,.13,track.rut,p.x,.045,p.z);}
 for(const t of track.jumps){const p=at(t),d=curve.getTangentAt(t);const ramp=box(track.width-.9,.58,3,track.road,p.x,.22,p.z);ramp.rotation.y=Math.atan2(d.x,d.z);ramp.rotation.x=.12;for(let j=-3;j<=3;j+=1.5){const mark=box(.13,.035,1.2,track.edge,j,.34,.1,ramp);mark.rotation.y=.45;}}
 const line=new THREE.Group();line.position.copy(at(.035));const d=curve.getTangentAt(.035);line.rotation.y=Math.atan2(d.x,d.z);group.add(line);
 const tiles=Math.floor(track.width);for(let i=0;i<tiles;i++)for(let j=0;j<2;j++)box(1,.035,.75,(i+j)%2?'#303b31':track.edge,i-(tiles-1)/2,.06,j*.75-.35,line);
 function sign(text,w,h,x,y,z,flat=false){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#28382b';ctx.fillRect(0,0,1024,160);ctx.fillStyle='#e6d9ad';ctx.font='bold 70px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,83);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.25),new THREE.MeshStandardMaterial({map:tex}));m.position.set(x,y,z);if(flat)m.rotation.x=-Math.PI/2;group.add(m);}
 const [bannerX,bannerZ]=track.banner,[landX,landZ]=track.landmark;
 sign(track.name.toUpperCase(),20,2,bannerX,4.5,bannerZ);for(const x of [-9,9])box(.3,5,.3,'#303b31',bannerX+x,2.2,bannerZ);
 sign('OMARCHY QUATTRO',12,1.5,landX,.2,landZ+4,true);
 function tree(x,z,size=1){box(.55*size,2*size,.55*size,'#655441',x,size,z);for(let j=0;j<3;j++)mesh(new THREE.ConeGeometry((1.65-j*.3)*size,2.6*size,7),track.id==='alpine'&&j===2?'#e5eeea':track.foliage,x,(2+j*.9)*size,z);}
 function rock(x,z,r=1){const m=mesh(new THREE.DodecahedronGeometry(r,0),track.rock,x,r*.45,z);m.scale.y=.8;return m;}
 for(let i=0;i<65;i++){const x=(random()-.5)*104,z=(random()-.5)*73;if(nearest(x,z).distance<track.width/2+3||Math.hypot(x-landX,z-landZ)<8||Math.abs(x-bannerX)<12&&Math.abs(z-bannerZ)<4)continue;
  if(track.id==='forest'||track.id==='alpine')tree(x,z,.75+random()*.6);else if(track.id==='desert'){rock(x,z,1+random()*2);if(i%3===0){box(.5,3,.5,track.foliage,x+2,1.5,z);box(1.8,.4,.4,track.foliage,x+2,1.6,z);}}else rock(x,z,.5+random());}
 if(track.id==='gravel'){for(const side of [-1,1])for(let row=0;row<3;row++){box(23,.65,1.6,'#6a715a',side*24,.3+row*.7,-34-row*1.8);for(let j=0;j<18;j++)box(.42,.8,.42,j%2?'#c3aa75':'#8f9a83',side*24-10+j*1.2,.95+row*.7,-34-row*1.8);}}
 else { // Biome landmark: a lake, sandstone mesa, or snowy ridge, outside the circuit.
  if(track.id==='forest'){const lake=mesh(new THREE.CylinderGeometry(4,4,.08,40),'#548e91',landX,.02,landZ-2);lake.scale.z=1.5;}
  if(track.id==='desert')for(let i=0;i<3;i++){const mesa=mesh(new THREE.CylinderGeometry(1.3,2,3+i%2,5),track.rock,landX-5+i*5,1.5,landZ);mesa.rotation.y=i;}
  if(track.id==='alpine')for(let i=0;i<3;i++){mesh(new THREE.ConeGeometry(2.5,5,5),track.rock,landX-5+i*5,2,landZ-1);mesh(new THREE.ConeGeometry(1.1,2.2,5),'#f3f6ee',landX-5+i*5,3.7,landZ-1);}
 }
 const patches=track.patches.map(p=>{const pos=at(p.t,p.lane),d=curve.getTangentAt(p.t);const m=mesh(new THREE.CylinderGeometry(1,1,.055,40),{water:'#538e9f',mud:'#604735',ice:'#91c4d9',sand:'#ecc58c'}[p.type],pos.x,.09,pos.z);m.scale.set(p.width/2,1,p.length/2);m.rotation.y=Math.atan2(d.x,d.z);
  if(p.type==='water'||p.type==='ice'){for(let i=0;i<5;i++){const mark=box(.65+random()*.35,.015,.015,p.type==='water'?'#a0ced3':'#d1edf3',(random()-.5)*.3,.04,(i-2)*.27,m);mark.castShadow=false;}}
  return {...p,x:pos.x,z:pos.z,dx:d.x,dz:d.z};});
 const obstacles=track.obstacles.map(o=>{const p=at(o.t,o.lane);if(o.type==='tree')tree(p.x,p.z,.85);else if(o.type==='log'){const log=mesh(new THREE.CylinderGeometry(.55,.55,2.2,9),'#72523a',p.x,.55,p.z);log.rotation.z=Math.PI/2;}else rock(p.x,p.z,o.radius);return {...o,x:p.x,z:p.z,height:o.type==='tree'?4:o.type==='log'?1:1.3};});
 return {...course,patches,obstacles,dispose(){scene.remove(group);const geometries=new Set(),mats=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)mats.add(o.material);});geometries.forEach(g=>g.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose();});}};
}
