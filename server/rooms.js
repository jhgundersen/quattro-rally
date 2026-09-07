import {randomBytes} from 'node:crypto';
import {TRACKS} from '../src/tracks.js';
import {createCourse} from '../src/course.js';
import {aiControls,driveCar,collideCars} from '../src/physics.js';
import {DRIVERS,GRID} from '../src/drivers.js';
export const VERSION=1;
const token=()=>randomBytes(24).toString('base64url');
export const cleanName=value=>typeof value==='string'?value.replace(/[^\p{L}\p{N} ._-]/gu,'').trim().slice(0,20):'';
export function cleanInput(m){
 return {throttle:m.throttle===1?1:0,steer:m.steer===1?1:m.steer===-1?-1:0,brake:m.brake===true,boost:m.boost===true};
}
export class Room {
 constructor(trackId='gravel',now=Date.now()){
  this.id=randomBytes(6).toString('base64url');this.track=TRACKS.find(t=>t.id===trackId)||TRACKS[0];
  this.players=Array(4).fill(null);this.host=0;this.phase='lobby';this.race=0;this.time=0;this.updated=now;
 }
 join(name,resume,now=Date.now()){
  let slot=resume?this.players.findIndex(p=>p?.token===resume):-1;
  if(slot>=0&&this.players[slot].connected)throw Error('This seat is already open in another tab.');
  if(slot<0){
   if(this.phase!=='lobby')throw Error('This race has started. Try again when the room returns to the lobby.');
   slot=this.players.findIndex(p=>!p||(!p.connected&&now-p.seen>60000));
   if(slot<0)throw Error('This room is full (four drivers).');
   this.players[slot]={name:cleanName(name)||`Driver ${slot+1}`,token:token(),ready:false};
  }
  const p=this.players[slot];Object.assign(p,{connected:true,active:true,seen:now,inputs:[],control:{},seq:0,received:0,lastInput:now});
  if(!this.players[this.host]?.connected)this.host=slot;
  this.updated=now;return {slot,token:p.token};
 }
 disconnect(slot,now=Date.now(),leave=false){
  const p=this.players[slot];if(!p)return;
  Object.assign(p,{connected:false,ready:false,seen:now,inputs:[],control:{},active:false});
  if(leave&&this.phase==='lobby')this.players[slot]=null;
  if(this.host===slot)this.host=this.players.findIndex(p=>p?.connected);
  this.updated=now;
 }
 action(slot,m,now=Date.now()){
  const p=this.players[slot];if(!p?.connected)throw Error('Join a room first.');
  if(m.type==='input'){
   if(this.phase!=='racing'||m.race!==this.race||!Number.isSafeInteger(m.seq)||m.seq<=p.received)return;
   p.received=m.seq;p.lastInput=now;p.active=true;
   if(p.inputs.length>=12)p.inputs.shift();
   p.inputs.push({seq:m.seq,control:cleanInput(m)});return;
  }
  this.updated=now;
  if(m.type==='active'){p.active=m.active===true;p.inputs=[];p.control={};p.lastInput=now;return;}
  if(m.type==='ready'&&this.phase==='lobby'){p.ready=m.ready===true;return;}
  if(slot!==this.host)throw Error('Only the host can choose the track or start the race.');
  if(m.type==='track'&&this.phase==='lobby'){
   const track=TRACKS.find(t=>t.id===m.track);if(!track)throw Error('Unknown track.');
   this.track=track;for(const p of this.players)if(p)p.ready=false;return;
  }
  if(m.type==='lobby'&&this.phase==='finished'){
   this.phase='lobby';for(const p of this.players)if(p)p.ready=false;return;
  }
  if(m.type==='start'&&this.phase==='lobby'){
   if(!this.players.filter(p=>p?.connected).every(p=>p.ready))throw Error('Wait until every driver is ready.');
   this.world=createCourse(this.track);this.time=0;this.countdown=3.4;this.deadline=180;this.race++;this.phase='countdown';
   this.cars=DRIVERS.map((d,i)=>{
    const slot=GRID.indexOf(i),t=.035-.022-Math.floor(slot/2)*.026-(slot%2)*.003,pos=this.world.at(t,slot%2?2:-2),dir=this.world.curve.getTangentAt((t+1)%1);
    return {i,skill:this.players[i]?1:d.skill||1,x:pos.x,z:pos.z,vx:0,vz:0,angle:Math.atan2(dir.x,dir.z),t:(t+1)%1,progress:t-.035,nitro:100,air:0,vy:0,jumpCooldown:0,finished:false,finishTime:0,surface:this.track.surface||'gravel'};
   });
   for(const p of this.players)if(p)Object.assign(p,{inputs:[],control:{},seq:0,received:0,lastInput:now});
   return;
  }
  throw Error('That action is not available during this race.');
 }
 tick(dt,now=Date.now()){
  if(this.phase==='countdown'){this.countdown-=dt;if(this.countdown<=0)this.phase='racing';return;}
  if(this.phase!=='racing')return;
  this.time+=dt;
  for(const c of this.cars){
   if(c.finished)continue;
   const p=this.players[c.i];let controls;
   if(p?.connected&&p.active&&now-p.lastInput<750){
    const input=p.inputs.shift();if(input){p.seq=input.seq;p.control=input.control;}controls=p.control;
   }else controls=aiControls(c,this.world,this.track,this.cars);
   driveCar(c,this.world,this.track,dt,controls);
   if(c.progress>=3){c.finished=true;c.finishTime=this.time;if(p)this.deadline=Math.min(this.deadline,this.time+25);}
  }
  collideCars(this.cars);
  if(this.cars.every(c=>c.finished)||this.time>=this.deadline){this.phase='finished';this.updated=now;}
 }
 info(){return {type:'room',id:this.id,track:this.track.id,host:this.host,phase:this.phase,race:this.race,players:this.players.map((p,i)=>p?{slot:i,name:p.name,connected:p.connected,ready:p.ready}:null)};}
 snapshot(){return {type:'snapshot',phase:this.phase,race:this.race,time:this.time,countdown:this.countdown,cars:this.cars,acks:this.players.map(p=>p?.seq||0)};}
}
