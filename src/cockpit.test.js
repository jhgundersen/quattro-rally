import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {cockpitPose} from './cockpit.js';

test('cockpit eye stays in the car and looks forward through turns, banks and jumps',()=>{
 for(const [pitch,yaw,roll] of [[0,0,0],[0,Math.PI,0],[.18,-1,.4],[-.2,Math.PI-.001,0]]){
  const position=new THREE.Vector3(10,3,20),rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,roll,'YXZ'));
  const pose=cockpitPose(position,rotation),local=pose.position.clone().sub(position).applyQuaternion(rotation.clone().invert());
  assert.ok(local.distanceTo(new THREE.Vector3(.32,1.4,-.3))<1e-10);
  const forward=new THREE.Vector3(0,0,-1).applyQuaternion(pose.quaternion),carForward=new THREE.Vector3(0,0,1).applyQuaternion(rotation);
  assert.ok(forward.distanceTo(carForward)<1e-10);
  assert.ok(new THREE.Vector3(0,1,0).applyQuaternion(pose.quaternion).distanceTo(new THREE.Vector3(0,1,0).applyQuaternion(rotation))<1e-10);
 }
});
