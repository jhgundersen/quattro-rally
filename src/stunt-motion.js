import * as THREE from 'three';
import {advanceProgress} from './race.js';
export function inLoop(track,t){return !!track.loop&&t>=track.loop.start&&t<=track.loop.end;}
export function loopOffset(track,u){
 u=Math.max(0,Math.min(1,u));
 return -(track.loop.shift||0)*u*u*(3-2*u);
}
export function loopCarPose(course,track,state){return loopPose(course,track,state.u,state.lane-loopOffset(track,state.u));}
export function loopSteering(c,track){
 const s=c.stunt,target=loopOffset(track,Math.max(0,Math.min(1,s.u+(s.direction||1)*.05)));
 return Math.max(-1,Math.min(1,(s.lane-target)*(s.facing||1)*.85));
}
export function loopPose(course,track,u,lane=0){
 // The back straight runs east/west; the twelve-metre pitch moves only
 // towards the exit lane, never back through the ascending ribbon.
 const loop=track.loop,a=course.curve.getPointAt(loop.start),b=course.curve.getPointAt(loop.end),delta=b.clone().sub(a),forward=new THREE.Vector3(1,0,0);
 const angle=u*Math.PI*2,r=loop.radius,across=new THREE.Vector3(forward.z,0,-forward.x);
 const position=a.addScaledVector(forward,delta.x*u+r*Math.sin(angle)).addScaledVector(across,-lane-loopOffset(track,u));
 position.z+=(delta.z+track.loop.shift)*u;
 position.y=r*(1-Math.cos(angle));
 const tangent=new THREE.Vector3(delta.x,0,delta.z+track.loop.shift).addScaledVector(forward,2*Math.PI*r*Math.cos(angle));tangent.y=2*Math.PI*r*Math.sin(angle);
 const lateral=-6*loop.shift*u*(1-u);
 tangent.addScaledVector(across,-lateral);
 const distance=tangent.length();tangent.normalize();
 const normal=new THREE.Vector3().crossVectors(tangent,across).normalize(),right=new THREE.Vector3().crossVectors(normal,tangent).normalize();
 const quaternion=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right,normal,tangent));
 return {position,quaternion,normal,tangent,distance};
}
export function driveLoop(c,course,track,dt,controls){
 const loop=track.loop,state=c.stunt,direction=state.direction||1,facing=state.facing||1;
 const pose=loopCarPose(course,track,state);
 const boost=controls.boost&&c.nitro>0,throttle=controls.brake?-.7:controls.throttle||0;
 // Arcade adhesion prevents a slow arrival from stranding a car upside down.
 // Throttle, braking and nitro still determine time through the loop.
 state.speed=Math.max(8,Math.min(45,state.speed+(throttle*direction*facing*12+(boost?17:0)-state.speed*.25-9.81*pose.tangent.y*direction)*dt));
 c.nitro=Math.max(0,Math.min(100,c.nitro+(boost?-30:5)*dt));
 const margin=track.width/2-1.3,center=loopOffset(track,state.u);
 state.lane=Math.max(center-margin,Math.min(center+margin,state.lane-(controls.steer||0)*state.speed*.18*facing*dt));
 const nextU=Math.max(0,Math.min(1,state.u+direction*state.speed*dt/pose.distance)),nextCenter=loopOffset(track,nextU);
 const blocked=Math.abs(state.lane-nextCenter)>margin;
 if(!blocked)state.u=nextU;else state.speed=Math.max(8,state.speed*.95);
 state.guidance=blocked?(state.lane<nextCenter?'LOOP · STEER RIGHT':'LOOP · STEER LEFT'):'LOOP · FOLLOW THE YELLOW LINE';
 const next=loopCarPose(course,track,state),t=loop.start+(loop.end-loop.start)*state.u;
 c.x=next.position.x;c.z=next.position.z;c.stuntHeight=next.position.y;c.air=0;c.vy=0;
 const flat=course.curve.getTangentAt(t);c.angle=Math.atan2(flat.x,flat.z)+(facing<0?Math.PI:0);c.vx=flat.x*state.speed*direction;c.vz=flat.z*state.speed*direction;
 c.progress=advanceProgress(c.t,t,c.progress);c.t=t;c.surface='asphalt';
 if(direction>0?state.u>=1:state.u<=0){c.stunt=null;c.stuntHeight=0;c.jumpCooldown=.2;}
 return {speed:state.speed,fx:flat.x,fz:flat.z,surface:{grip:7,drag:.4,power:1}};
}
