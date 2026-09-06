import * as THREE from 'three';
import { createCourse } from './course.js';
export function createWorld(scene,track){
 const group=new THREE.Group();scene.add(group);
 const materials=new Map();const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.94}));return materials.get(color);};
 const mesh=(geometry,color,x=0,y=0,z=0,parent=group)=>{const m=new THREE.Mesh(geometry,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const box=(w,h,d,color,x=0,y=0,z=0,parent=group)=>mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent);
 let seed=track.seed;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const course=createCourse(track),framingPoints=[];
 const {curve,points,tangents,at,nearest}=course,N=points.length;
 function ribbon(a,b,color,y){const vertices=[],indices=[];for(let i=0;i<=N;i++)for(const offset of [a,b]){const p=at(i/N,offset);vertices.push(p.x,p.y+y,p.z);}for(let i=0;i<N;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();mesh(g,color);}
 box(track.banking?140:126,1,track.banking?128:94,track.ground,0,-.65,0);ribbon(-track.width/2,track.width/2,track.road,.01);ribbon(-2.5,-1.4,track.rut,.025);ribbon(1.4,2.5,track.rut,.025);
 const barrierCount=Math.ceil(course.length/2.5);
 for(let i=0;i<barrierCount;i++)for(const side of [-1,1]){
   const t=i/barrierCount,p=at(t,side*(track.width/2+.85)),d=curve.getTangentAt(t);
   if(track.crossings?.some(c=>Math.hypot(p.x-c.x,p.z-c.z)<c.radius))continue;
   const barrier=box(.65,track.id==='lemans'?.2:.65,2.2,track.banking?track.edge:i%4<2?track.edge:track.id==='lemans'?'#386a9c':'#a9513d',p.x,p.y+(track.id==='lemans'?.1:.32),p.z);
   barrier.rotation.y=Math.atan2(d.x,d.z);
 }
 // Direction arrows make adjacent lanes and hairpin exits readable at a glance.
 const arrowShape=new THREE.Shape();arrowShape.moveTo(-.8,-.7);arrowShape.lineTo(0,.8);arrowShape.lineTo(.8,-.7);arrowShape.lineTo(0,-.2);arrowShape.closePath();
 for(let i=0;i<(track.banking?0:Math.ceil(course.length/28));i++){
   const t=(.09+i*28/course.length)%1,p=at(t),d=curve.getTangentAt(t);
   const arrow=mesh(new THREE.ShapeGeometry(arrowShape),track.edge,p.x,.065,p.z);
   arrow.rotation.set(-Math.PI/2,0,Math.atan2(-d.x,-d.z));arrow.castShadow=false;
 }
 for(let i=0;i<(['garage','lemans','daytona'].includes(track.id)?0:130);i++){const p=at(random(),(random()-.5)*track.width);box(.1+random()*.15,.04,.13,track.rut,p.x,.045,p.z);}
 for(const t of track.jumps){const p=at(t),d=curve.getTangentAt(t);const ramp=box(track.width-.9,.58,3,track.road,p.x,.22,p.z);ramp.rotation.y=Math.atan2(d.x,d.z);ramp.rotation.x=.12;for(let j=-3;j<=3;j+=1.5){const mark=box(.13,.035,1.2,track.edge,j,.34,.1,ramp);mark.rotation.y=.45;}}
 const line=new THREE.Group();line.position.copy(at(.035));const d=curve.getTangentAt(.035);line.rotation.set(0,Math.atan2(d.x,d.z),course.bankAngle(.035),'YXZ');group.add(line);
 const tiles=Math.floor(track.width);for(let i=0;i<tiles;i++)for(let j=0;j<2;j++)box(1,.035,.75,(i+j)%2?'#303b31':track.edge,i-(tiles-1)/2,.06,j*.75-.35,line);
 function sign(text,w,h,x,y,z,flat=false){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#28382b';ctx.fillRect(0,0,1024,160);ctx.fillStyle='#e6d9ad';ctx.font='bold 70px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,83);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.25),new THREE.MeshStandardMaterial({map:tex}));m.position.set(x,y,z);if(flat)m.rotation.x=-Math.PI/2;group.add(m);return m;}
 const [bannerX,bannerZ]=track.banner,[landX,landZ]=track.landmark;
 sign(track.name.toUpperCase(),20,2,bannerX,4.5,bannerZ);for(const x of [-9,9])box(.3,5,.3,'#303b31',bannerX+x,2.2,bannerZ);
 const landmarkSign=sign('OMARCHY QUATTRO',12,1.5,landX,.2,landZ+4,true);
 function tree(x,z,size=1){box(.55*size,2*size,.55*size,'#655441',x,size,z);for(let j=0;j<3;j++)mesh(new THREE.ConeGeometry((1.65-j*.3)*size,2.6*size,7),track.id==='alpine'&&j===2?'#e5eeea':track.foliage,x,(2+j*.9)*size,z);}
 function rock(x,z,r=1){const m=mesh(new THREE.DodecahedronGeometry(r,0),track.rock,x,r*.45,z);m.scale.y=.8;return m;}
 for(let i=0;i<(['garage','daytona'].includes(track.id)?0:65);i++){const x=(random()-.5)*104,z=(random()-.5)*73;if(track.id==='lemans'&&x<-30&&z>-8&&z<20)continue;if(nearest(x,z).distance<track.width/2+3||Math.hypot(x-landX,z-landZ)<8||Math.abs(x-bannerX)<12&&Math.abs(z-bannerZ)<4)continue;
  if(track.id==='forest'||track.id==='alpine'||track.id==='lemans')tree(x,z,.75+random()*.6);else if(track.id==='desert'){rock(x,z,1+random()*2);if(i%3===0){box(.5,3,.5,track.foliage,x+2,1.5,z);box(1.8,.4,.4,track.foliage,x+2,1.6,z);}}else rock(x,z,.5+random());}
 if(track.id==='gravel'){for(const side of [-1,1])for(let row=0;row<3;row++){box(23,.65,1.6,'#6a715a',side*24,.3+row*.7,-34-row*1.8);for(let j=0;j<18;j++)box(.42,.8,.42,j%2?'#c3aa75':'#8f9a83',side*24-10+j*1.2,.95+row*.7,-34-row*1.8);}}
 else { // Biome landmark: a lake, sandstone mesa, or snowy ridge, outside the circuit.
  if(track.id==='forest'){const lake=mesh(new THREE.CylinderGeometry(4,4,.08,40),'#548e91',landX,.02,landZ-2);lake.scale.z=1.5;}
  if(track.id==='desert')for(let i=0;i<3;i++){const mesa=mesh(new THREE.CylinderGeometry(1.3,2,3+i%2,5),track.rock,landX-5+i*5,1.5,landZ);mesa.rotation.y=i;}
  if(track.id==='alpine')for(let i=0;i<3;i++){mesh(new THREE.ConeGeometry(2.5,5,5),track.rock,landX-5+i*5,2,landZ-1);mesh(new THREE.ConeGeometry(1.1,2.2,5),'#f3f6ee',landX-5+i*5,3.7,landZ-1);}
 }
 if(track.id==='daytona'){
  // The banking is earthwork standing on the board, not a shelf hanging over it.
  // Outside, a grass bank falls to a retaining plinth whose foot draws a hard
  // line on the ground; inside, a plain verge runs down to the infield.
  const skirt=(top,bottom,color)=>{
   const vertices=[],indices=[];
   for(let i=0;i<=N;i++){const t=i/N,a=top(t),b=bottom(t);vertices.push(a.x,a.y,a.z,b.x,b.y,b.z);}
   for(let i=0;i<N;i++){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
   const m=mesh(g,color);
   // Both faces are drawn: the two sides of the bowl wind in opposite directions.
   m.material=new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide});
  };
  const PLINTH=1.1,outer=-(track.width/2+.85),inner=track.width/2;
  const run=(t,lane,extra=0)=>{const c=at(t,lane);return 1.4+Math.max(0,c.y-PLINTH)*1.15+extra;};
  const level=(lane,out,extra,y)=>t=>{const p=at(t,lane+out*run(t,lane,extra));p.y=y;return p;};
  // The shoulder out to the barrier crest closes the surface: without it a slot
  // runs the whole lap under the wall and shows daylight beneath the road.
  ribbon(outer,-track.width/2,track.road,0);
  skirt(t=>at(t,outer),level(outer,-1,0,PLINTH),track.bank);
  skirt(level(outer,-1,0,PLINTH),level(outer,-1,.55,-.25),track.rock);
  skirt(t=>at(t,inner),level(inner,1,0,-.25),track.bank);
  ribbon(track.width/2-.35,track.width/2-.12,'#f1cf4c',.035);
  ribbon(-track.width/2+.15,-track.width/2+.3,'#e7ece7',.035);
  // Raised lane dashes emphasize the actual cross-slope through each turn.
  for(let i=0;i<100;i++)for(const lane of [-2,2]){
   const p=at(i/100,lane),d=curve.getTangentAt(i/100);
   const dash=box(.13,.035,1.8,'#dce2df',p.x,p.y+.05,p.z);
   dash.rotation.set(0,Math.atan2(d.x,d.z),course.bankAngle(i/100),'YXZ');
  }
  // Infield and grandstands are laid out square to the oval, then turned with it.
  const infield=new THREE.Group();infield.rotation.y=-(track.rotation||0)*Math.PI/180;group.add(infield);infield.updateMatrixWorld(true);
  infield.add(landmarkSign);
  const lake=mesh(new THREE.CylinderGeometry(11,11,.08,48),'#5bafc1',12,.015,-1,infield);lake.scale.z=.62;
  infield.add(sign('LAKE LLOYD',9,1,12,.15,-1,true));
  box(39,.1,4,'#737d82',-8,.01,15,infield);
  for(let i=0;i<9;i++){
   box(3.6,1.1,3,'#e0e4dc',-24+i*4,1,19,infield);
   box(3.9,.15,3.4,i%2?'#66a7c1':'#e4ca66',-24+i*4,1.65,19,infield);
  }
  // The stands stand clear of the backstretch embankment behind them.
  for(let row=0;row<4;row++)for(const side of [-1,1]){
   box(25,.7,1.5,'#a8b4b4',side*26,.4+row*.8,-44-row*2,infield);
   for(let i=0;i<18;i++)box(.55,.7,.55,i%3===0?'#ebce67':i%2?'#6ba8c1':'#e0e7df',side*26-11+i*1.25,1+row*.8,-44-row*2,infield);
  }
  for(const x of [-40,40])for(const z of [-51,-43])framingPoints.push(infield.localToWorld(new THREE.Vector3(x,5,z)));
  infield.add(sign('DAYTONA / HIGH BANKS',22,2,-10,.15,-5,true));
 }
 if(track.id==='lemans'){
  // Asphalt edge lines and low blue/yellow kerbs echo the road circuit.
  ribbon(-track.width/2+.15,-track.width/2+.3,'#e8e8d9',.04);
  ribbon(track.width/2-.3,track.width/2-.15,'#e8e8d9',.04);
  const pits=new THREE.Group(),p=at(.025,-10),d=curve.getTangentAt(.025);
  pits.position.copy(p);pits.rotation.y=Math.atan2(d.x,d.z);group.add(pits);
  pits.updateMatrixWorld(true);
  for(const x of [-3,3])for(const z of [-10,10])for(const y of [0,3])framingPoints.push(pits.localToWorld(new THREE.Vector3(x,y,z)));
  for(const x of [-34,-14])for(const z of [-42,-36])framingPoints.push(new THREE.Vector3(x,3.5,z));
  box(5,2.4,19,'#d8dbd3',0,1.2,0,pits);box(5.8,.25,20,'#567c99',0,2.5,0,pits);
  for(let i=0;i<6;i++){
   box(.06,1.5,2.4,'#293e49',2.53,1,-7.5+i*3,pits);
   box(.08,.25,2.4,i%2?'#e5c64f':'#3d72a1',2.57,1.9,-7.5+i*3,pits);
  }
  const bridge=new THREE.Group(),bp=at(.10),bd=curve.getTangentAt(.10);
  bridge.position.copy(bp);bridge.rotation.y=Math.atan2(bd.x,bd.z);group.add(bridge);
  for(const side of [-1,1])box(.65,4.5,1,'#c7bb7d',side*(track.width/2+1.4),2.25,0,bridge);
  box(track.width+3.4,.7,1,'#e2c94f',0,4.5,0,bridge);
  sign('DUNLOP',track.width+2,.9,bp.x,4.9,bp.z).rotation.y=Math.atan2(bd.x,bd.z);
  for(let row=0;row<3;row++){
   box(19,.6,1.8,'#8f9b99',-24,.3+row*.65,-37-row*1.7);
   for(let i=0;i<14;i++)box(.5,.65,.5,i%3===0?'#e6cb62':i%2?'#7798b3':'#d6dbcf',-32+i*1.2,.9+row*.65,-37-row*1.7);
  }
  sign('24H / LA SARTHE',17,2,-7,.2,2,true);
  // Corner boards sit off the road and describe the compressed real route.
  for(const [label,x,z] of [['MULSANNE',37,0],['ARNAGE',12,37],['PORSCHE',-8,12]]){
   if(nearest(x,z).distance>track.width/2+2)sign(label,9,1.1,x,1.2,z);
  }
 }
 if(track.id==='bog'){
  // Waterlogged infields, reeds and churned banks stay clear of both lanes.
  for(const x of [-29,29]){
   const pool=mesh(new THREE.CylinderGeometry(5,6,.12,32),'#494a30',x,.015,0);pool.scale.z=1.65;
   for(let i=0;i<22;i++){const a=i/22*Math.PI*2,rx=x+Math.cos(a)*6.5,rz=Math.sin(a)*10;
    if(nearest(rx,rz).distance<track.width/2+2)continue;
    for(let j=0;j<3;j++)box(.12,.7+random()*.7,.12,track.foliage,rx+j*.25,.5,rz+j*.18);
   }
  }
  sign('CROSS TRAFFIC',13,1.5,0,2.4,-15);
  for(const x of [-6,6])box(.2,2.5,.2,'#493322',x,1.2,-15);
  for(let i=0;i<70;i++){const x=(random()-.5)*108,z=(random()-.5)*76;
   if(nearest(x,z).distance<track.width/2+2)continue;
   const bank=mesh(new THREE.DodecahedronGeometry(1+random()*1.4,0),track.road,x,.1,z);bank.scale.y=.25;
  }
 }
 if(track.id==='garage'){
  // An exposed parking-house floor: low front walls keep the whole race visible.
  box(112,1.2,82,'#a1aeb5',0,-1.1,0);
  for(const z of [-40,40])box(112,.8,.6,'#b3bdc2',0,.3,z);
  for(const x of [-56,56])box(.6,.8,80,'#b3bdc2',x,.3,0);
  for(const x of [-50,-25,0,25,50]){
   box(1.5,5,1.5,'#acb7bd',x,2.4,-38);
   box(1.65,1.2,1.65,'#e8bd58',x,.7,-38);
   box(10,.18,.6,'#e3f3ff',x,5,-38);
  }
  box(104,.7,1.8,'#9aa8b2',0,5.2,-38);
  sign('P  /  LEVEL 04',14,2,0,3,1);
  box(.4,3,.4,'#bdc8cd',-6,1.5,1);box(.4,3,.4,'#bdc8cd',6,1.5,1);
  const parkedColors=['#d9d4c4','#647f95','#aa695a','#a5b5ac'];
  const bays=[...[-50,50].flatMap(x=>[-24,-12,0,12,24].map(z=>[x,z])),...[-17,15].flatMap(z=>[-32,-24,-16,-8,0,8,16,24,32].map(x=>[x,z]))];
  for(const [x,z] of bays){
   if(nearest(x,z).distance<track.width/2+3.5)continue;
   for(const side of [-1,1])box(.12,.035,6,'#dbe1d9',x+side*2.6,.03,z);
   box(5.3,.035,.12,'#dbe1d9',x,.03,z-3);
   if((x+48)%24===0)continue;
   box(2.5,.85,4.5,parkedColors[Math.floor((x+56)/8)%4],x,.5,z);
   box(2,.65,2.3,'#354652',x,1.22,z-.25);
   box(2.1,.12,1.8,parkedColors[Math.floor((x+56)/8)%4],x,1.58,z-.3);
   for(const dx of [-1.25,1.25])for(const dz of [-1.3,1.3])box(.3,.6,.7,'#25313a',x+dx,.35,z+dz);
  }
  // Ticket machine and the rather optimistic entry barrier.
  box(1.4,2,1,'#efbd56',-49,1,32);box(.8,.6,.06,'#344756',-49,1.3,32.53);
  box(.4,2,.4,'#e6e2cf',-45,1,33);box(6,.25,.3,'#e6e2cf',-42,2,33);
  for(let x=-44;x<-39;x+=1.2)box(.5,.27,.32,'#d56e59',x,2,33);
 }
 const patches=track.patches.map(p=>{const pos=at(p.t,p.lane),d=curve.getTangentAt(p.t);const m=mesh(new THREE.CylinderGeometry(1,1,.055,40),{water:'#538e9f',mud:'#604735',ice:'#91c4d9',sand:'#ecc58c',oil:'#393346'}[p.type],pos.x,.09,pos.z);m.scale.set(p.width/2,1,p.length/2);m.rotation.y=Math.atan2(d.x,d.z);
  if(p.type==='water'||p.type==='ice'){for(let i=0;i<5;i++){const mark=box(.65+random()*.35,.015,.015,p.type==='water'?'#a0ced3':'#d1edf3',(random()-.5)*.3,.04,(i-2)*.27,m);mark.castShadow=false;}}
  return {...p,x:pos.x,z:pos.z,dx:d.x,dz:d.z};});
 const obstacles=track.obstacles.map(o=>{const p=at(o.t,o.lane);if(o.type==='cone'){box(1.3,.15,1.3,'#303943',p.x,.075,p.z);mesh(new THREE.ConeGeometry(.55,1.5,8),'#f19b4c',p.x,.8,p.z);mesh(new THREE.ConeGeometry(.3,.4,8),'#fff1d6',p.x,1,p.z);}else if(o.type==='tree')tree(p.x,p.z,.85);else if(o.type==='log'){const log=mesh(new THREE.CylinderGeometry(.55,.55,2.2,9),'#72523a',p.x,.55,p.z);log.rotation.z=Math.PI/2;}else rock(p.x,p.z,o.radius);return {...o,x:p.x,z:p.z,height:o.type==='tree'?4:o.type==='log'?1:1.3};});
 return {...course,framingPoints,patches,obstacles,dispose(){scene.remove(group);const geometries=new Set(),mats=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)mats.add(o.material);});geometries.forEach(g=>g.dispose());mats.forEach(m=>{m.map?.dispose();m.dispose();});}};
}
