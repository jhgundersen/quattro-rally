import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Room,cleanInput} from './rooms.js';
import {createService} from './service.js';
import {WebSocket} from 'ws';

test('private rooms enforce capacity, host authority, readiness, and track validity',()=>{
 const room=new Room('gravel',0),seats=Array.from({length:4},(_,i)=>room.join(`Driver ${i}`,null,0));
 assert.throws(()=>room.join('Fifth',null,0),/full/);
 assert.throws(()=>room.action(1,{type:'track',track:'bog'},0),/host/);
 assert.throws(()=>room.action(0,{type:'track',track:'missing'},0),/Unknown/);
 assert.throws(()=>room.action(0,{type:'start'},0),/ready/);
 for(let i=0;i<4;i++)room.action(i,{type:'ready',ready:true},0);
 room.action(0,{type:'track',track:'daytona'},0);
 assert.ok(room.players.every(p=>!p.ready));
 for(let i=0;i<4;i++)room.action(i,{type:'ready',ready:true},0);
 room.action(0,{type:'start'},0);assert.equal(room.phase,'countdown');assert.equal(room.track.id,'daytona');
 assert.ok(room.cars.every(c=>c.skill===1),'humans use equal driving physics');
 assert.throws(()=>room.action(0,{type:'track',track:'bog'},0),/not available/);
 assert.ok(!JSON.stringify(room.info()).includes(seats[0].token),'private reconnect keys stay out of broadcasts');
});
test('disconnect hands hosting over and resumes only with the private seat token',()=>{
 const room=new Room(),a=room.join('Alice'),b=room.join('Bob');
 assert.throws(()=>room.join('Intruder',a.token),/already/);
 room.disconnect(a.slot,100);assert.equal(room.host,b.slot);assert.equal(room.players[0].ready,false);
 const resumed=room.join('Someone else',a.token,200);assert.equal(resumed.slot,a.slot);assert.equal(room.players[0].name,'Alice');
});
test('server ignores client positions, clamps controls, rejects old race inputs and caps queues',()=>{
 assert.deepEqual(cleanInput({throttle:99,steer:Infinity,brake:'yes',boost:1}),{throttle:0,steer:0,brake:false,boost:false});
 const room=new Room();room.join('<script>Alice</script>');room.action(0,{type:'ready',ready:true});room.action(0,{type:'start'});
 room.tick(4);const before=room.cars[0].x;
 for(let seq=1;seq<100;seq++)room.action(0,{type:'input',race:room.race,seq,throttle:1,x:9999,progress:3});
 assert.ok(room.players[0].inputs.length<=12);room.tick(1/60);
 assert.ok(Math.abs(room.cars[0].x-before)<1);assert.ok(room.cars[0].progress<1);
 room.action(0,{type:'input',race:room.race-1,seq:1000});assert.equal(room.players[0].received,99);
});
test('AI takeover finishes a disconnected racer and host can reuse the room',()=>{
 const room=new Room('gravel',0);room.join('Alice',null,0);room.join('Bob',null,0);
 room.action(0,{type:'ready',ready:true},0);room.action(1,{type:'ready',ready:true},0);room.action(0,{type:'start'},0);
 room.disconnect(0,0);room.action(1,{type:'active',active:false},0);
 for(let i=0;i<60*180&&room.phase!=='finished';i++)room.tick(1/60,i*1000/60);
 assert.equal(room.phase,'finished');assert.ok(room.cars[0].finished);assert.ok(room.cars[1].finished);
 room.action(1,{type:'lobby'});assert.equal(room.phase,'lobby');assert.equal(room.players[1].ready,false);
});
test('all races have a server time limit, including a driver who never moves',()=>{
 const room=new Room();room.join('Alice');room.action(0,{type:'ready',ready:true});room.action(0,{type:'start'});room.tick(4);
 room.time=179.99;room.tick(1/60);assert.equal(room.phase,'finished');assert.equal(room.cars[0].finished,false);
});

function connect(url){return new Promise((resolve,reject)=>{const ws=new WebSocket(url,{origin:'http://test.local'}),messages=[];ws.on('message',raw=>messages.push(JSON.parse(raw)));ws.once('error',reject);ws.once('open',()=>resolve({ws,messages}));});}
async function until(predicate){for(let i=0;i<100;i++){const value=predicate();if(value)return value;await new Promise(r=>setTimeout(r,10));}throw Error('Timed out waiting for server message');}
test('two WebSocket clients share a room, start once, and see the same authoritative race',async()=>{
 const service=createService({origin:'http://test.local'});await new Promise(r=>service.server.listen(0,'127.0.0.1',r));
 const url=`ws://127.0.0.1:${service.server.address().port}/multiplayer`;
 try{
  const a=await connect(url);a.ws.send(JSON.stringify({type:'hello',version:1,name:'Alice',track:'bog'}));
  const joined=await until(()=>a.messages.find(m=>m.type==='joined'));
  const b=await connect(url);b.ws.send(JSON.stringify({type:'hello',version:1,name:'Bob',room:joined.id}));
  const second=await until(()=>b.messages.find(m=>m.type==='joined'));assert.equal(second.slot,1);
  a.ws.send(JSON.stringify({type:'ready',ready:true}));b.ws.send(JSON.stringify({type:'ready',ready:true}));
  await until(()=>a.messages.find(m=>m.type==='room'&&m.players[1]?.ready&&m.players[0]?.ready));
  a.ws.send(JSON.stringify({type:'start'}));
  const one=await until(()=>a.messages.find(m=>m.type==='snapshot'));
  const two=await until(()=>b.messages.find(m=>m.type==='snapshot'));
  assert.equal(one.race,two.race);assert.deepEqual(one.cars,two.cars);assert.equal(one.phase,'countdown');
  b.ws.close();await until(()=>!service.rooms.get(joined.id).players[1].connected);
  const c=await connect(url);c.ws.send(JSON.stringify({type:'hello',version:1,room:joined.id,token:second.token}));
  assert.equal((await until(()=>c.messages.find(m=>m.type==='joined'))).slot,1);
 }finally{await service.close();}
});
