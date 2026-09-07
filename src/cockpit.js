import * as THREE from 'three';

const eye=new THREE.Vector3(.32,1.4,-.3);
const faceForward=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI);
export function cockpitPose(position,rotation){
 return {position:eye.clone().applyQuaternion(rotation).add(position),quaternion:rotation.clone().multiply(faceForward)};
}

export function createCockpit(scene){
 const camera=new THREE.PerspectiveCamera(65,1,.06,350);camera.layers.enable(1);scene.add(camera);
 const interior=new THREE.Group();camera.add(interior);
 const basic=color=>new THREE.MeshBasicMaterial({color});
 const ink=basic('#202828'),rubber=basic('#111919'),metal=basic('#697775'),paint=basic('#eabd72');
 function box(w,h,d,material,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.layers.set(1);interior.add(m);return m;}
 // Bonnet and windshield frame. The opaque exterior car is hidden only for
 // this camera; the separate interior avoids looking through its glass cube.
 box(1.84,.08,1.4,paint,.32,-.55,-1.8);
 box(.26,.008,1.32,basic('#eee9d7'),.07,-.504,-1.8);
 box(.08,.01,1.32,basic('#b8664c'),-.12,-.503,-1.8);
 for(const x of [-.38,1.02])box(.04,.025,.8,ink,x,-.49,-1.59);
 box(2.1,1.4,.42,ink,.22,-1.065,-1.0);
 box(1.1,.19,.055,rubber,-.14,-.39,-.78);
 const wheel=new THREE.Mesh(new THREE.TorusGeometry(.17,.024,8,32),rubber);wheel.position.set(-.27,-.35,-.65);wheel.layers.set(1);interior.add(wheel);
 for(const angle of [0,Math.PI*2/3,Math.PI*4/3]){
  const spoke=new THREE.Mesh(new THREE.BoxGeometry(.017,.16,.015),metal);spoke.position.set(Math.sin(angle)*.08,Math.cos(angle)*.08,0);spoke.rotation.z=-angle;spoke.layers.set(1);wheel.add(spoke);
 }
 const hub=new THREE.Mesh(new THREE.CircleGeometry(.047,16),ink);hub.position.z=.017;hub.layers.set(1);wheel.add(hub);
 // Thin A-pillars leave the road and nearby cars easy to read.
 const pillars=[];
 for(const x of [-.80,1.12]){const pillar=box(.045,.95,.055,ink,x,.02,-.78);pillar.rotation.z=x<0?-.12:.12;pillars.push(pillar);}
 const roof=box(2.3,.07,.09,ink,0,.5,-.83);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=144;const ctx=canvas.getContext('2d');
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 const cluster=new THREE.Mesh(new THREE.PlaneGeometry(.75,.19),new THREE.MeshBasicMaterial({map:tex}));cluster.position.set(-.04,-.35,-.745);cluster.layers.set(1);interior.add(cluster);
 let snap=true,lastSpeed=-1,lastNitro=-1,lastLabel='';
 interior.visible=false;
 return {camera,
  reset(){snap=true;},
  resize(w,h){camera.aspect=w/h;camera.fov=Math.max(65,Math.min(95,THREE.MathUtils.radToDeg(2*Math.atan(1/camera.aspect))));camera.updateProjectionMatrix();
   const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),top=.83*tan;
   roof.position.y=top;roof.scale.x=(2*.83*tan*camera.aspect+.2)/2.3;
   pillars.forEach((p,i)=>{p.position.x=(i?1:-1)*.78*tan*camera.aspect*.92;p.position.y=(top-.4)/2;p.scale.y=(top+.4)/.95;});
  },
  update(car,dt,enabled,steer=0){
   interior.visible=enabled;if(!enabled){snap=true;return;}
   const pose=cockpitPose(car.g.position,car.g.quaternion);
   // Keep the eye inside the car. Smooth its orientation, never drag the
   // camera position behind the seat during a corner or a network correction.
   camera.position.copy(pose.position);
   if(snap||dt===0)camera.quaternion.copy(pose.quaternion);
   else camera.quaternion.slerp(pose.quaternion,1-Math.exp(-24*dt));
   snap=false;paint.color.copy(car.paint.color);wheel.rotation.z=steer*.5;
   const speed=Math.round(Math.hypot(car.vx,car.vz)*5),nitro=Math.round(car.nitro/5),label=car.surface||'gravel';
   if(speed!==lastSpeed||nitro!==lastNitro||label!==lastLabel){
    ctx.fillStyle='#14201f';ctx.fillRect(0,0,512,144);ctx.fillStyle='#e8c27a';ctx.font='bold 72px monospace';ctx.fillText(String(speed).padStart(3,'0'),20,83);
    ctx.font='18px monospace';ctx.fillText('KM/H',162,82);ctx.fillStyle='#d4ded4';ctx.fillText('quattro',280,49);ctx.fillText(label.toUpperCase(),280,82);
    ctx.fillStyle='#3e4c43';ctx.fillRect(20,108,468,12);ctx.fillStyle='#e8c27a';ctx.fillRect(20,108,468*nitro/20,12);tex.needsUpdate=true;
    lastSpeed=speed;lastNitro=nitro;lastLabel=label;
   }
  },
 };
}
