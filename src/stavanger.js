import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// A compressed old-town stage, not a street map. All scenery shares the road's
// hillside; foundations meet the earth instead of hovering above it.
export function createStavanger(group,course,track){
 const town=new THREE.Group();group.add(town);
 const materials=new Map(),framing=[];
 const material=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.92}));return materials.get(color);};
 const mesh=(geo,color,x=0,y=0,z=0,parent=town)=>{const m=new THREE.Mesh(geo,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const box=(w,h,d,color,x,y,z,parent)=>mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent);
 const height=course.terrainHeight;
 let seed=track.seed;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const terrain=new THREE.PlaneGeometry(110,88,110,88);terrain.rotateX(-Math.PI/2);terrain.translate(-6,0,0);
 const vertices=terrain.attributes.position;
 for(let i=0;i<vertices.count;i++)vertices.setY(i,height(vertices.getX(i),vertices.getZ(i))-.055);
 terrain.computeVertexNormals();mesh(terrain,track.ground);
 // Stone-sided diorama, with the harbour along its eastern edge.
 for(const z of [-44,44])box(110,.8,.5,'#7b8079',-6,-.18,z);
 box(.65,1.05,88,'#8b918a',49,-.1,0);
 box(27,.16,88,'#467e8b',62.5,-.06,0);
 for(let i=0;i<60;i++)box(.6+random()*2,.015,.08,'#6c9ba4',50+random()*25,.04,-42+random()*84);

 // Individually shaded staggered granite setts, baked to one repeating map.
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#777970';ctx.fillRect(0,0,256,256);
 for(let row=0;row<8;row++)for(let col=-1;col<8;col++){
  const x=col*40+(row%2)*20,y=row*32,v=132+Math.floor(random()*34);
  ctx.fillStyle=`rgb(${v+5},${v+3},${v-3})`;ctx.beginPath();ctx.roundRect(x+2,y+2,36,28,4);ctx.fill();
  ctx.fillStyle='#d3cfc044';ctx.fillRect(x+6,y+4,28,2);
 }
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=8;
 const pos=[],uv=[],indices=[];
 for(let i=0;i<=960;i++)for(const lane of [-track.width/2,track.width/2]){const p=course.at(i/960,lane);pos.push(p.x,p.y+.045,p.z);uv.push((lane+track.width/2)/4,i/960*course.length/4);}
 for(let i=0;i<960;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
 const road=new THREE.BufferGeometry();road.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));road.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));road.setIndex(indices);road.computeVertexNormals();
 const cobbles=new THREE.Mesh(road,new THREE.MeshStandardMaterial({map:tex,roughness:.98}));cobbles.receiveShadow=true;group.add(cobbles);

 function house(x,z,w,d,h,angle,index,paint='#f0eee4'){
  const g=new THREE.Group();g.position.set(x,height(x,z),z);g.rotation.y=angle;town.add(g);
  const base=.35,roofH=w*.40,roof=['#a15d46','#754d42','#8e5542','#65706f'][index%4];
  box(w+.25,1.1,d+.25,'#8c8b80',0,-.2,0,g);
  box(w,h,d,paint,0,h/2+base,0,g);
  // Triangular gable extrusion: ridge strictly above both eaves.
  const shape=new THREE.Shape();shape.moveTo(-w/2-.25,0);shape.lineTo(w/2+.25,0);shape.lineTo(0,roofH);shape.closePath();
  const roofGeo=new THREE.ExtrudeGeometry(shape,{depth:d+.5,bevelEnabled:false});
  mesh(roofGeo,roof,0,h+base,-d/2-.25,g);
  // White gable inset at both ends, leaving the red tile eaves exposed.
  const front=new THREE.Shape();front.moveTo(-w/2,0);front.lineTo(w/2,0);front.lineTo(0,roofH-.18);front.closePath();
  for(const side of [-1,1]){const m=mesh(new THREE.ShapeGeometry(front),paint,0,h+base,side*(d/2+.26),g);if(side<0)m.rotation.y=Math.PI;}
  box(.55,1.5,.6,'#b5a28c',w*.25,h+roofH+.05,-d*.18,g);
  box(.72,.15,.76,'#676962',w*.25,h+roofH+.8,-d*.18,g);
  // Horizontal clapboards, corner boards and cross-paned windows.
  for(let y=.7;y<h+.25;y+=.38)for(const side of [-1,1])box(w,.025,.025,'#d8d8cd',0,y,side*(d/2+.02),g);
  for(const side of [-1,1]){
   for(const xx of [-w/2+.08,w/2-.08])box(.13,h,.12,'#ffffff',xx,h/2+base,side*(d/2+.05),g);
   for(const xx of [-w*.28,w*.28]){
    box(.97,1.12,.11,'#fff9e9',xx,h*.64,side*(d/2+.07),g);
    box(.73,.87,.13,'#54757c',xx,h*.64,side*(d/2+.09),g);
    box(.07,.9,.15,'#f9f2dc',xx,h*.64,side*(d/2+.11),g);box(.76,.07,.15,'#f9f2dc',xx,h*.64,side*(d/2+.11),g);
    box(1.08,.22,.4,'#597449',xx,h*.64-.68,side*(d/2+.18),g);
    for(let j=0;j<3;j++)mesh(new THREE.IcosahedronGeometry(.16,0),index%2?'#db96ad':'#d0bce0',xx+(j-1)*.3,h*.64-.49,side*(d/2+.22),g);
   }
  }
  box(.8,1.55,.12,['#52736c','#99604b','#617482'][index%3],0,1.1,d/2+.08,g);
  box(1.3,.2,.7,'#b8b5a7',0,.15,d/2+.4,g);
  // Small enclosed garden on the back of each cottage.
  for(const xx of [-w/2,w/2])box(.15,.65,1.5,'#e7e6dc',xx,.4,-d/2-.8,g);
  box(w,.65,.12,'#e7e6dc',0,.4,-d/2-1.5,g);
  for(const dx of [-3.5,3.5])for(const dz of [-3.5,3.5])framing.push(new THREE.Vector3(x+dx,height(x,z)+h+roofH+1,z+dz));
 }
 // Place houses along the actual street, with room for roof overhangs and
 // gardens. Reject footprints close to any other branch of the course.
 const placed=[];
 for(let i=0;i<64;i++)for(const side of [-1,1]){
  const t=i/64,p=course.at(t,side*(track.width/2+5.1));
  if(Math.hypot(p.x+25,p.z+11)<8||p.x>43||p.x<-54||Math.abs(p.z)>36||course.nearest(p.x,p.z).distance<8.2)continue;
  if(placed.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<6.4))continue;
  const d=course.curve.getTangentAt(t),angle=Math.atan2(d.x,d.z)+ (side>0?Math.PI/2:-Math.PI/2);
  placed.push(p);house(p.x,p.z,3.7+random()*.6,3.8+random()*.5,2.5+random()*.9,angle,i);
 }
 // A small cannery yard and brick chimney recall the old town's industry.
 const factoryY=height(-25,-11);
 box(7,3.1,4.5,'#aa7961',-25,factoryY+1.15,-11);
 box(7.5,.25,5,'#656d68',-25,factoryY+2.85,-11);
 box(1.15,6.6,1.15,'#92614e',-27,factoryY+3.3,-12);
 box(1.45,.25,1.45,'#795b4e',-27,factoryY+6.6,-12);
 for(const x of [-27,-25,-23])box(.85,.95,.1,'#c2d2cb',x,factoryY+1.7,-8.7);
 framing.push(new THREE.Vector3(-27,factoryY+7,-12));
 function label(text,x,z,w){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=112;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#324b49';ctx.fillRect(0,0,768,112);ctx.strokeStyle='#c9caba';ctx.lineWidth=5;ctx.strokeRect(8,8,752,96);
  ctx.fillStyle='#f2eddb';ctx.font='bold 57px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,58);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.BoxGeometry(w,1.3,.12),new THREE.MeshStandardMaterial({map:texture}));
  sign.position.set(x,height(x,z)+1.6,z);sign.rotation.y=Math.PI/4;group.add(sign);
 }
 label('GAMLE STAVANGER',-24,-7,10);label('VÅGEN',54,33,5);
 // Stavanger Konserthus: the paired red-concrete hall and glass prism,
 // facing the water, with a broad stepped forecourt. Compressed for the arena.
 // Reference: stavanger-konserthus.no/om-konserthuset/arkitekturen/
 box(17,.45,19,'#babcb0',53,.3,-31);
 box(14,7.4,6,'#914e43',52.5,4,-36);
 box(14.4,.24,6.4,'#784c45',52.5,7.8,-36);
 for(let i=0;i<7;i++)box(.055,7.1,.06,'#b07060',46.5+i*2,4,-32.96);
 for(const y of [1.1,2,3.2,4.8,6.5])box(14,.045,.07,'#714a42',52.5,y,-32.95);
 // Opaque tinted panes make the glass legible at whole-course zoom, without
 // transparent sorting artefacts or a forest of interior geometry.
 box(14,5.5,7.1,'#77999a',52.5,3.05,-29.4);
 box(14.6,.28,7.7,'#b9c5be',52.5,5.94,-29.4);
 for(let i=0;i<10;i++){
  const x=46.2+i*1.4;
  box(1.25,4.9,.04,i%3===0?'#a9bcb2':i%3===1?'#597d83':'#87a7a6',x,3,-25.82);
  box(.085,5.45,.12,'#d0d6c9',x-.66,3.05,-25.75);
 }
 for(const y of [.65,2.3,3.95,5.7])box(14,.09,.15,'#d3d6c8',52.5,y,-25.73);
 for(let i=0;i<5;i++)box(.14,5.4,.075,'#cfdbd1',59.56,3.05,-32.1+i*1.4);
 for(const y of [2.3,3.95])box(.15,.09,7,'#d0d9ce',59.57,y,-29.4);
 for(let i=0;i<4;i++)box(12,.24,1.1,'#bcbdae',53,.75-i*.17,-24.6+i*.9);
 for(let i=0;i<3;i++){
  box(.075,3.3,.075,'#cbd1c7',60.8,1.9,-35+i*4);
  box(.06,1.5,.65,'#b65846',60.8,2.7,-34.7+i*4);
 }
 label('STAVANGER KONSERTHUS',54,-21,12);
 for(const x of [44,61])for(const z of [-40,-20])framing.push(new THREE.Vector3(x,9,z));
 // A few traditional sea houses link the modern hall back to the old town.
 for(let i=0;i<3;i++)house(52,2+i*9,4.8,4.5,3.6,Math.PI/2,i,['#a95443','#d0a254','#ece9dc'][i]);

 // Docked cruise liner: shaped bow, tiered decks, balcony bands, lifeboats,
 // pool and mooring lines. It sits beyond the quay, clear of every road branch.
 const ship=new THREE.Group();ship.position.set(65,0,-4);town.add(ship);
 const outline=new THREE.Shape();outline.moveTo(-3.7,-14);outline.lineTo(3.7,-14);outline.lineTo(3.7,10);outline.quadraticCurveTo(3.5,14.5,0,17);outline.quadraticCurveTo(-3.5,14.5,-3.7,10);outline.closePath();
 for(const [y,depth,color] of [[.05,1.1,'#344e5c'],[1.1,1.6,'#eceee5']]){
  const geo=new THREE.ExtrudeGeometry(outline,{depth,bevelEnabled:false,curveSegments:8});geo.rotateX(-Math.PI/2);mesh(geo,color,0,y,0,ship);
 }
 for(let deck=0;deck<4;deck++){
  const w=7-deck*.6,len=25-deck*2.8,z=1+deck*.7,y=3+deck*1.05;
  box(w,.9,len,'#edf0e9',0,y,z,ship);box(w+.2,.15,len+.4,'#c7d0c9',0,y+.5,z,ship);
  for(const side of [-1,1]){
   box(.055,.42,len-1,'#456772',side*(w/2+.025),y+.02,z,ship);
   for(let j=0;j<Math.floor(len/1.3);j++)box(.08,.5,.09,'#e5e9e0',side*(w/2+.06),y+.04,z-len/2+.6+j*1.3,ship);
  }
 }
 box(4.7,.85,3.2,'#d8e5df',0,6.8,-9.5,ship);box(4.8,.4,.08,'#365d6a',0,6.85,-11.14,ship);
 box(2.1,1.9,2.6,'#bb6651',0,7.4,5,ship);box(2.3,.32,2.8,'#344a50',0,8.45,5,ship);
 box(2.3,.06,4.2,'#55a6b3',0,6.69,-.4,ship);
 for(const side of [-1,1])for(let i=0;i<4;i++){
  const life=mesh(new THREE.SphereGeometry(1,8,6),'#d88d43',side*3.8,2.9,-6+i*4.2,ship);life.scale.set(.45,.4,1.25);
 }
 for(const z of [-15,8]){
  box(.4,.6,.4,'#4c5e59',57,.45,z);
  const a=new THREE.Vector3(57,.7,z),b=new THREE.Vector3(61.3,1.8,z+1),delta=b.clone().sub(a);
  const rope=mesh(new THREE.CylinderGeometry(.035,.035,delta.length(),5),'#b6a68a',...(a.clone().add(b).multiplyScalar(.5).toArray()));rope.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 }
 box(6,.22,1.2,'#a7b4af',59,1.3,3);
 for(const x of [61,70])for(const z of [-22,12])framing.push(new THREE.Vector3(x,10,z));
 // One small harbour boat for scale beside the liner.
 const hull=mesh(new THREE.SphereGeometry(1,12,6),'#ecebdd',62,.45,29);hull.scale.set(1.5,.6,3.8);
 box(1.8,1,2,'#c7d5cd',62,1.1,29);box(7,.2,1,'#a69a80',56,.2,32);
 // Pocket gardens give the folded infield readable blocks instead of empty lawn.
 for(let i=0;i<35;i++){
  const x=-48+random()*84,z=-33+random()*66;
  if(course.nearest(x,z).distance<7||placed.some(p=>Math.hypot(x-p.x,z-p.z)<4))continue;
  const y=height(x,z);box(.22,1.8,.22,'#796854',x,y+.9,z);
  const crown=mesh(new THREE.IcosahedronGeometry(1.3,1),'#57734e',x,y+2.1,z);crown.scale.y=.85;
 }
 // Slender black street lamps stay below roof height and clear of the road.
 for(let i=0;i<24;i++){
  const p=course.at(i/24,-track.width/2-1.5);
  box(.12,2.6,.12,'#394b4b',p.x,p.y+1.3,p.z);box(.44,.5,.44,'#efe0aa',p.x,p.y+2.7,p.z);box(.6,.12,.6,'#394b4b',p.x,p.y+3,p.z);
 }
 // Batch the many little clapboards, flowers and windows by material.
 town.updateMatrixWorld(true);
 const batches=new Map();town.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);geo.deleteAttribute('uv');if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(geo);o.geometry.dispose();});
 town.clear();
 for(const [mat,geos] of batches){const geo=mergeGeometries(geos);geos.forEach(g=>g.dispose());const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;town.add(m);}
 framing.push(new THREE.Vector3(74,6,34),new THREE.Vector3(50,5,-34));
 return framing;
}
