import * as THREE from 'three';
import {drawbridgeState,bridgeFrame} from './drawbridges.js';
export function createDrawbridges(group,course,track){
 const materials=new Map(),frames=[],bridges=[];
 const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.8}));return materials.get(color);};
 function box(w,h,d,color,x,y,z,parent){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 for(const bridge of track.drawbridges||[]){
  const {p,d,half}=bridgeFrame(course,bridge),root=new THREE.Group();root.position.copy(p);root.rotation.y=Math.atan2(d.x,d.z);group.add(root);
  box(track.width+9,.09,half*2+2,'#447f99',0,-.07,0,root);
  const leaves=[],lights=[];
  for(const sign of [-1,1]){
   box(track.width+1.7,.8,1,'#a79d84',0,-.4,sign*(half+.5),root);
   const leaf=new THREE.Group();leaf.name='drawbridge-leaf';leaf.userData={bridge,sign};leaf.position.set(0,0,sign*half);root.add(leaf);
   box(track.width,.22,half,'#737d86',0,-.11,-sign*half/2,leaf);
   box(.2,.025,half-.2,'#e5c94e',0,.015,-sign*half/2,leaf);
   for(const side of [-1,1]){
    box(.2,.45,half,'#d4d7cb',side*(track.width/2-.12),.3,-sign*half/2,leaf);
    box(.55,3.5,.55,'#6f7f86',side*(track.width/2+.65),1.5,sign*half,root);
    const light=new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),new THREE.MeshBasicMaterial({color:'#82b65b'}));light.position.set(side*(track.width/2+.65),3.2,sign*(half+1));root.add(light);lights.push(light);
   }
   leaves.push({leaf,sign});
  }
  const cabin=box(2,2.5,2,'#c7af7c',track.width/2+3,1.15,half+2,root);box(1.2,.8,.05,'#395465',0,.35,1.03,cabin);
  root.updateMatrixWorld(true);
  for(const x of [-track.width/2-3,track.width/2+4])for(const z of [-half-2,half+4])frames.push(root.localToWorld(new THREE.Vector3(x,6,z)));
  bridges.push({bridge,leaves,lights});
 }
 function update(){for(const {bridge,leaves,lights} of bridges){const state=drawbridgeState(bridge,course.traffic.time);for(const {leaf,sign} of leaves)leaf.rotation.x=sign*state.angle;for(const light of lights)light.material.color.set(state.warning?'#eac04b':'#82b65b');}}
 update();return {framingPoints:frames,update};
}
