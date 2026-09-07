import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createWheelMotion} from './wheels.js';

// Original short-wheelbase rally coupe. Forward is +Z, as in driving physics.
export function createCar(scene,color,index){
 const g=new THREE.Group();
 const material=(color,roughness=.65,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const paint=material(color,.42),trim=material('#252c25'),rubber=material('#151b1d',.96);
 const glass=material('#334f59',.2,.25),alloy=material('#dddccf',.35,.55),white=material('#f0ecdc');
 const red=material('#b43e32'),amber=material('#eaa34e'),lamp=material('#fff2ca',.23);
 lamp.emissive.set('#fff0be');lamp.emissiveIntensity=.18;
 let parts=new Map();
 function part(geo,mat,x=0,y=0,z=0,rotation){
  const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(rotation)m.rotation.set(...rotation);m.updateMatrix();
  const transformed=geo.index?geo.toNonIndexed():geo.clone();transformed.applyMatrix4(m.matrix);transformed.deleteAttribute('uv');
  if(!parts.has(mat))parts.set(mat,[]);parts.get(mat).push(transformed);geo.dispose();
 }
 const box=(w,h,d,mat,x=0,y=0,z=0,rotation)=>part(new THREE.BoxGeometry(w,h,d),mat,x,y,z,rotation);
 function shell(sections,mat){
  const vertices=[],indices=[];
  for(const [z,bottom,top,lower,upper] of sections)vertices.push(-lower,bottom,z,lower,bottom,z,upper,top,z,-upper,top,z);
  for(let r=0;r<sections.length-1;r++)for(let i=0;i<4;i++){const a=r*4+i,b=r*4+(i+1)%4;indices.push(a,b,b+4,a,b+4,a+4);}
  const end=(sections.length-1)*4;indices.push(0,2,1,0,3,2,end,end+1,end+2,end,end+2,end+3);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();part(geo,mat);
 }
 function bar(from,to,width,depth,mat){
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),direction=b.clone().sub(a);
  const geo=new THREE.BoxGeometry(width,direction.length(),depth);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()));
  const center=a.add(b).multiplyScalar(.5);part(geo,mat,center.x,center.y,center.z);
 }
 // Narrow lower tub leaves genuine space around the tyres, beneath the wings.
 shell([[-1.8,.4,.86,.7,.87],[-1.35,.4,1.0,.7,.91],[.55,.4,1.0,.7,.91],[1.8,.4,.83,.7,.86]],paint);
 box(1.88,.23,.4,paint,0,.69,1.6);box(1.9,.28,.38,paint,0,.68,-1.59);
 // Flat-topped, angular wheel-arch extensions with open semicircular cutouts.
 for(const side of [-1,1])for(const z of [-1.13,1.1]){
  const shape=new THREE.Shape();shape.moveTo(-.66,-.06);shape.lineTo(-.66,.38);shape.lineTo(-.44,.63);shape.lineTo(.44,.63);shape.lineTo(.66,.38);shape.lineTo(.66,-.06);shape.lineTo(.51,-.06);
  for(let i=0;i<=12;i++){const angle=i*Math.PI/12;shape.lineTo(Math.cos(angle)*.51,Math.sin(angle)*.51);}
  shape.lineTo(-.51,-.06);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.24,bevelEnabled:false,curveSegments:12});
  part(geo,paint,side*.84,.44,z,[0,side*Math.PI/2,0]);
  box(.13,.27,.12,rubber,side*.94,.3,z-.5);
 }
 for(const side of [-1,1]){
  box(.13,.19,1.16,trim,side*.91,.43,0);
  box(.026,.055,1.0,trim,side*.918,.91,-.03);
  box(.033,.045,.2,alloy,side*.927,.88,-.37);
 }
 // A raked windscreen, short roof and hatch replace the old upright glass cube.
 shell([[-1.34,1.0,1.01,.82,.81],[-.65,1.0,1.57,.82,.68],[.17,1.0,1.57,.82,.68],[.79,1.0,1.01,.82,.81]],glass);
 box(1.42,.095,.91,paint,0,1.6,-.25);
 for(const side of [-1,1]){
  bar([side*.83,1.01,.79],[side*.69,1.59,.17],.085,.09,paint);
  bar([side*.83,1.01,-1.34],[side*.69,1.59,-.65],.12,.12,paint);
  bar([side*.825,1.01,-.37],[side*.69,1.57,-.37],.06,.08,trim);
  box(.12,.055,.12,trim,side*.9,1.07,.58);
  box(.23,.14,.23,paint,side*1.02,1.13,.57);
  box(.19,.10,.018,glass,side*1.02,1.13,.443);
 }
 bar([-.73,1.027,.68],[.03,1.12,.55],.026,.024,rubber);
 // Deep black nose, paired rectangular lamps and a silver intercooler.
 box(1.99,.22,.18,trim,0,.47,1.79);box(2.04,.07,.27,rubber,0,.34,1.79);
 box(1.72,.27,.055,rubber,0,.78,1.818);
 box(.63,.16,.065,trim,0,.79,1.851);
 for(const x of [-.69,-.43,.43,.69])box(.21,.19,.025,lamp,x,.8,1.856);
 for(const y of [.72,.78,.84])box(.55,.014,.012,alloy,0,y,1.89);
 box(.76,.12,.025,alloy,0,.46,1.89);
 for(let x=-.33;x<.36;x+=.075)box(.018,.11,.012,rubber,x,.46,1.91);
 for(const side of [-1,1]){
  box(.21,.065,.03,amber,side*.8,.58,1.886);
  box(.38,.21,.07,rubber,side*.65,.78,-1.805);
  box(.27,.14,.025,red,side*.69,.8,-1.85);
  box(.075,.14,.03,amber,side*.49,.8,-1.855);
 }
 box(1.99,.2,.18,trim,0,.46,-1.8);box(.44,.14,.025,white,0,.72,-1.835);
 box(.15,.075,.04,red,-.39,.36,1.94);
 part(new THREE.CylinderGeometry(.075,.075,.24,10),alloy,-.66,.31,-1.88,[Math.PI/2,0,0]);
 // A low hatch wing with end plates, rather than a tall block over the tail.
 for(const x of [-.67,.67])box(.09,.22,.13,trim,x,1.09,-1.48);
 box(2.02,.09,.43,paint,0,1.22,-1.49);
 for(const x of [-1,1])box(.055,.18,.47,trim,x,1.22,-1.49);
 // Rally stripes and bonnet cooling slots stay legible at arena scale.
 const bonnetHeight=z=>1-(z-.55)*.17/1.25,bonnetPitch=Math.atan(.17/1.25);
 box(.28,.018,.97,white,.22,bonnetHeight(1.02)+.012,1.02,[bonnetPitch,0,0]);
 box(.105,.019,.97,red,.43,bonnetHeight(1.02)+.013,1.02,[bonnetPitch,0,0]);
 for(const side of [-1,1])for(let i=0;i<4;i++){const z=.65+i*.1;box(.22,.021,.047,trim,side*.65,bonnetHeight(z)+.012,z,[bonnetPitch,0,0]);}
 // Batch the fixed body independently from the moving wheels.
 for(const [mat,geometries] of parts){const mesh=new THREE.Mesh(mergeGeometries(geometries),mat);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);geometries.forEach(geo=>geo.dispose());}
 parts=new Map();
 // One reusable wheel, centered on its axle with the outside face towards +X.
 part(new THREE.CylinderGeometry(.44,.44,.32,20),rubber,0,0,0,[0,0,Math.PI/2]);
 part(new THREE.CylinderGeometry(.29,.29,.018,20),alloy,.166,0,0,[0,0,Math.PI/2]);
 part(new THREE.CylinderGeometry(.238,.238,.022,20),trim,.178,0,0,[0,0,Math.PI/2]);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;box(.035,.235,.048,alloy,.194,Math.cos(a)*.12,Math.sin(a)*.12,[a,0,0]);}
 part(new THREE.CylinderGeometry(.09,.09,.037,10),alloy,.202,0,0,[0,0,Math.PI/2]);
 const wheelMeshes=[];
 for(const [mat,geometries] of parts){
  const mesh=new THREE.InstancedMesh(mergeGeometries(geometries),mat,4);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.castShadow=true;mesh.receiveShadow=true;
  // Only four small instances, always bounded by the parent car; avoid stale
  // instance bounds after steering and the cost of recalculating them.
  mesh.frustumCulled=false;g.add(mesh);wheelMeshes.push(mesh);geometries.forEach(geo=>geo.dispose());
 }
 const motion=createWheelMotion(),pivot=new THREE.Object3D(),turn=new THREE.Matrix4(),mirror=new THREE.Matrix4().makeRotationY(Math.PI);
 function updateWheels(car,time){
  const {spin,steer}=motion(car,time);let i=0;
  for(const side of [-1,1])for(const z of [-1.13,1.1]){
   pivot.position.set(side*.96,.44,z);pivot.rotation.set(0,z>0?steer:0,0);pivot.updateMatrix();
   pivot.matrix.multiply(turn.makeRotationX(spin));if(side<0)pivot.matrix.multiply(mirror);
   for(const mesh of wheelMeshes)mesh.setMatrixAt(i,pivot.matrix);i++;
  }
  for(const mesh of wheelMeshes)mesh.instanceMatrix.needsUpdate=true;
 }
 updateWheels({x:0,z:0,angle:0},0);
 const number=document.createElement('canvas');number.width=64;number.height=64;const ctx=number.getContext('2d');
 ctx.fillStyle='#ece8d5';ctx.fillRect(0,0,64,64);ctx.fillStyle='#26382a';ctx.font='bold 47px monospace';ctx.textAlign='center';ctx.fillText(String(index+1).padStart(2,'0'),32,49);
 const texture=new THREE.CanvasTexture(number);texture.colorSpace=THREE.SRGBColorSpace;
 const decalMaterial=new THREE.MeshBasicMaterial({map:texture});
 const decal=new THREE.Mesh(new THREE.PlaneGeometry(.66,.66),decalMaterial);decal.rotation.x=-Math.PI/2;decal.position.set(0,1.651,-.25);g.add(decal);
 for(const side of [-1,1]){const door=new THREE.Mesh(new THREE.PlaneGeometry(.48,.38),decalMaterial);door.rotation.y=side*Math.PI/2;door.position.set(side*.917,.72,-.02);g.add(door);}
 scene.add(g);return {g,paint,trim,decal,numberCanvas:number,updateWheels};
}
