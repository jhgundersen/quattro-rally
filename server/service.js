import {createServer} from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';
import {Room,VERSION} from './rooms.js';
export function createService({origin=process.env.ORIGIN,trustProxy=false,maxRooms=32}={}){
 const rooms=new Map(),peers=new Set();
 const server=createServer((req,res)=>{if(req.url==='/multiplayer/health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,version:VERSION,rooms:rooms.size}));}else{res.writeHead(404);res.end();}});
 const wss=new WebSocketServer({noServer:true,maxPayload:2048,perMessageDeflate:false});
 const send=(ws,data)=>{if(ws.readyState===WebSocket.OPEN){if(ws.bufferedAmount>128000)return ws.terminate();ws.send(JSON.stringify(data));}};
 const broadcast=(room,data)=>{for(const ws of peers)if(ws.room===room)send(ws,data);};
 server.on('upgrade',(req,socket,head)=>{
  const ip=trustProxy?req.headers['x-real-ip']||req.socket.remoteAddress:req.socket.remoteAddress;
  if(req.url!=='/multiplayer'||(origin&&req.headers.origin!==origin)||peers.size>=128||[...peers].filter(p=>p.ip===ip).length>=12){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
  wss.handleUpgrade(req,socket,head,ws=>{ws.ip=ip;wss.emit('connection',ws);});
 });
 wss.on('connection',ws=>{
  peers.add(ws);ws.alive=true;ws.started=Date.now();ws.window=Date.now();ws.messages=0;
  ws.on('pong',()=>ws.alive=true);ws.on('error',()=>{});
  ws.on('message',raw=>{
   const now=Date.now();if(now-ws.window>1000){ws.window=now;ws.messages=0;}
   if(++ws.messages>150)return ws.close(1008,'Too many messages');
   try{
    const m=JSON.parse(raw);if(!m||typeof m!=='object')throw Error('Invalid message.');
    if(m.type==='hello'){
     if(ws.room)throw Error('Already in a room.');
     if(m.version!==VERSION)throw Error('Please reload the page to update the game.');
     let room;
     if(m.room){room=rooms.get(m.room);if(!room)throw Error('This room has expired. Create a new room to race again.');}
     else {if(rooms.size>=maxRooms)throw Error('All rooms are busy. Please try again shortly.');room=new Room(m.track,now);}
     const seat=room.join(m.name,m.token,now);rooms.set(room.id,room);ws.room=room;ws.slot=seat.slot;
     send(ws,{type:'joined',...seat,id:room.id});broadcast(room,room.info());if(room.cars&&room.phase!=='lobby')send(ws,room.snapshot());return;
    }
    if(!ws.room)throw Error('Join a room first.');
    if(m.type==='leave'){const room=ws.room;room.disconnect(ws.slot,now,true);ws.room=null;broadcast(room,room.info());ws.close(1000);return;}
    ws.room.action(ws.slot,m,now);if(m.type!=='input'&&m.type!=='active')broadcast(ws.room,ws.room.info());
   }catch(e){send(ws,{type:'error',message:e instanceof SyntaxError?'Invalid message.':e.message});}
  });
  ws.on('close',()=>{peers.delete(ws);if(ws.room){ws.room.disconnect(ws.slot);broadcast(ws.room,ws.room.info());}});
 });
 let previous=performance.now(),debt=0,ticks=0;
 const timer=setInterval(()=>{
  const now=Date.now(),current=performance.now();debt+=Math.min(.1,(current-previous)/1000);previous=current;
  while(debt>=1/60){for(const room of rooms.values()){const phase=room.phase;room.tick(1/60,now);if(room.phase!==phase)broadcast(room,room.info());}debt-=1/60;ticks++;
   if(ticks%3===0)for(const room of rooms.values())if(room.phase!=='lobby')broadcast(room,room.snapshot());
  }
 },8);
 const heartbeat=setInterval(()=>{
  const now=Date.now();for(const ws of peers){if(!ws.alive||(!ws.room&&now-ws.started>15000)){ws.terminate();continue;}ws.alive=false;ws.ping();}
  for(const room of rooms.values()){
   const empty=room.players.every(p=>!p?.connected);
   if((empty&&now-room.updated>120000)||(['lobby','finished'].includes(room.phase)&&now-room.updated>1800000)){
    for(const ws of peers)if(ws.room===room){send(ws,{type:'error',message:'This room expired. Create a new room to keep racing.'});ws.close(1000);}
    rooms.delete(room.id);
   }
  }
 },15000);
 return {server,rooms,close:async()=>{clearInterval(timer);clearInterval(heartbeat);for(const ws of peers)ws.terminate();wss.close();await new Promise(resolve=>server.close(resolve));}};
}
