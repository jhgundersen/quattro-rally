import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Room,cleanInput,cleanText,FINISHERS} from './rooms.js';
import {FACES} from '../src/drivers.js';
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
test('AI takes over abandoned cars, three finishers end it, and the host reuses the room',()=>{
 const room=new Room('gravel',0);room.join('Alice',null,0);room.join('Bob',null,0);
 room.action(0,{type:'ready',ready:true},0);room.action(1,{type:'ready',ready:true},0);room.action(0,{type:'start'},0);
 room.disconnect(0,0);room.action(1,{type:'active',active:false},0);
 for(let i=0;i<60*180&&room.phase!=='finished';i++)room.tick(1/60,i*1000/60);
 assert.equal(room.phase,'finished');
 assert.ok(room.time<170,'the flag comes out long before the time limit');
 assert.equal(room.cars.filter(c=>c.finished).length,FINISHERS,'the last car is still out on track');
 assert.ok(room.cars.every(c=>c.progress>1),'every abandoned car was driven by the AI');
 room.action(1,{type:'lobby'});assert.equal(room.phase,'lobby');assert.equal(room.players[1].ready,false);
});
test('a race ends the moment the third car is home',()=>{
 const room=new Room('gravel',0);room.join('Alice',null,0);
 room.action(0,{type:'ready',ready:true},0);room.action(0,{type:'start'},0);room.tick(4,0);
 for(const c of room.cars.slice(0,2))c.progress=3.2;
 room.tick(1/60,0);assert.equal(room.phase,'racing','two cars home is not the flag');
 room.cars[2].progress=3.2;room.tick(1/60,0);
 assert.equal(room.phase,'finished');assert.equal(room.cars[3].finished,false,'the last car gets no time');
});
test('drivers bring a chosen portrait, and only a real face index is kept',()=>{
 const room=new Room('gravel',0);
 assert.equal(room.join('Alice',null,0,7).face,7);
 assert.equal(room.join('Bob',null,0,FACES.length).face,1,'an unknown face falls back to the seat driver');
 assert.equal(room.info().players[0].face,7);
 room.action(0,{type:'face',face:'11'},0);assert.equal(room.players[0].face,7,'a face has to be a number');
 room.action(0,{type:'face',face:11},0);assert.equal(room.players[0].face,11);
 room.action(0,{type:'ready',ready:true},0);room.action(1,{type:'ready',ready:true},0);room.action(0,{type:'start'},0);
 assert.throws(()=>room.action(0,{type:'face',face:2},0),/not available/,'no face swap mid-race');
});
test('lobby chat is cleaned, attributed, rate limited and kept as a short history',()=>{
 assert.equal(cleanText('  hello\u0007  there \n now '),'hello there now');
 assert.equal(cleanText('x'.repeat(400)).length,140);
 assert.equal(cleanText({}),'');
 const room=new Room('gravel',0);room.join('Alice',null,0);room.join('Bob',null,0);
 const line=room.action(0,{type:'chat',text:'good luck <everyone>'},1000);
 assert.deepEqual([line.type,line.slot,line.name,line.text],['chat',0,'Alice','good luck <everyone>']);
 assert.equal(room.action(0,{type:'chat',text:'and again'},1200),undefined,'a flood is dropped');
 assert.equal(room.action(0,{type:'chat',text:'   '},9000),undefined,'empty lines say nothing');
 assert.ok(room.action(1,{type:'chat',text:'not if I get there first'},1200),'other drivers are unaffected');
 for(let i=0;i<60;i++)room.action(0,{type:'chat',text:`line ${i}`},2000+i*600);
 assert.equal(room.chat.length,40);assert.equal(room.chat.at(-1).text,'line 59');
 room.say('Carol pulled into the lobby.',-1,'',3000);
 assert.equal(room.chat.at(-1).slot,-1,'the room speaks for itself too');
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
  const a=await connect(url);a.ws.send(JSON.stringify({type:'hello',version:1,name:'Alice',track:'bog',face:9}));
  const joined=await until(()=>a.messages.find(m=>m.type==='joined'));assert.equal(joined.face,9);
  const b=await connect(url);b.ws.send(JSON.stringify({type:'hello',version:1,name:'Bob',room:joined.id}));
  const second=await until(()=>b.messages.find(m=>m.type==='joined'));assert.equal(second.slot,1);
  assert.ok(a.messages.some(m=>m.type==='chat'&&m.slot<0&&m.text.includes('Bob')),'the lobby announces arrivals');
  assert.ok((await until(()=>b.messages.find(m=>m.type==='chat-log'))).messages.length,'a new driver gets the backlog');
  b.ws.send(JSON.stringify({type:'chat',text:'hei hei'}));
  const chat=await until(()=>a.messages.find(m=>m.type==='chat'&&m.slot===1));
  assert.equal(chat.text,'hei hei');assert.equal(chat.name,'Bob');
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
