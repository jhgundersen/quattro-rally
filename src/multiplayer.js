import {TRACKS} from './tracks.js';
import {DRIVERS,FACES,portrait,cleanFace} from './drivers.js';
const $=id=>document.getElementById(id);
const VERSION=3;
export function createMultiplayer({onRoom,onSnapshot,onLeave,onSeat,onStatus,getTrack,onActivate}){
 let socket,room=null,slot=0,retry=0,timer,closed=true,connecting=false;
 let invite=new URL(location.href).searchParams.get('room')||'',seatToken='';
 let face=0;
 try{$('online-name').value=localStorage.getItem('quattro-name')||'';face=cleanFace(Number(localStorage.getItem('quattro-face')));}catch{}
 const status=message=>{$('online-status').textContent=message;onStatus?.(message);};
 const send=message=>{if(socket?.readyState===WebSocket.OPEN){socket.send(JSON.stringify(message));return true;}return false;};
 // The face you race with: your own choice, or the seat's stock driver.
 const faceOf=i=>room?.players[i]?cleanFace(room.players[i].face,DRIVERS[i].face):DRIVERS[i].face;
 function renderFaces(){
  const lobby=!room||room.phase==='lobby';
  $('online-picker').hidden=!lobby;
  $('online-face-name').textContent=FACES[face].name;
  $('online-faces').replaceChildren(...FACES.map((option,i)=>{
   const button=document.createElement('button');
   button.type='button';button.className='face-option'+(i===face?' is-picked':'');
   button.setAttribute('role','radio');button.setAttribute('aria-checked',String(i===face));
   button.title=option.name;button.setAttribute('aria-label',option.name);
   button.innerHTML=portrait(i,{color:room?DRIVERS[slot].color:DRIVERS[0].color,trim:room?DRIVERS[slot].trim:undefined,name:option.name});
   button.onclick=()=>pickFace(i);
   return button;
  }));
 }
 function pickFace(i){
  face=cleanFace(i);try{localStorage.setItem('quattro-face',String(face));}catch{}
  if(room)send({type:'face',face});
  renderFaces();
 }
 function chatLine(message){
  const li=document.createElement('li'),log=$('chat-log');
  if(message.slot<0)li.className='is-system';
  else{
   const who=document.createElement('b');who.textContent=message.name||`Driver ${message.slot+1}`;
   who.style.color=DRIVERS[message.slot]?.color||'#eabd72';li.append(who);
  }
  li.append(document.createTextNode(message.text));
  log.append(li);while(log.children.length>60)log.firstChild.remove();
  log.scrollTop=log.scrollHeight;
 }
 function render(){
  const joined=!!room,host=room?.host===slot,lobby=room?.phase==='lobby';
  $('online-intro').hidden=joined;$('online-room').hidden=!joined;
  $('online-create').disabled=connecting;$('online-join').disabled=connecting;
  $('online-join').hidden=!invite;$('online-create').hidden=!!invite;
  $('online-cancel').hidden=!invite&&!connecting;
  renderFaces();
  if(!joined)return;
  $('online-code').textContent=room.id;
  const link=new URL(location.href);link.search='';link.searchParams.set('room',room.id);link.hash='';$('online-link').value=link.href;
  $('online-members').replaceChildren(...DRIVERS.map((driver,i)=>{
   const member=room.players[i],li=document.createElement('li');li.style.setProperty('--driver',driver.color);
   const avatar=document.createElement('div');avatar.className='member-face';
   avatar.innerHTML=portrait(faceOf(i),{color:driver.color,trim:driver.trim,name:member?member.name:driver.name});
   const text=document.createElement('div');
   const name=document.createElement('strong');name.textContent=member?`${member.name}${i===slot?' · YOU':''}`:`${driver.name} · AI`;
   const label=document.createElement('span');label.textContent=member?`${i===room.host?'HOST · ':''}${!member.connected?'RECONNECTING · AI DRIVING':lobby?(member.ready?'READY':'NOT READY'):room.phase==='finished'?'ROUND COMPLETE':'RACING'}`:'Fills an empty seat';
   text.append(name,label);li.append(avatar,text);return li;
  }));
  const schedule=room.tournament?.tracks||[room.track];
  $('online-tracks').replaceChildren(...TRACKS.map(track=>{
   const button=document.createElement('button'),order=schedule.indexOf(track.id);button.type='button';button.className='tournament-track';
   button.textContent=`${order<0?'+':order+1} · ${track.name}`;button.setAttribute('aria-pressed',String(order>=0));
   button.disabled=!host||!lobby||(order<0&&schedule.length>=5)||(order>=0&&schedule.length===1);
   button.onclick=()=>send({type:'tracks',tracks:order<0?[...schedule,track.id]:schedule.filter(id=>id!==track.id)});return button;
  }));
  $('online-schedule').textContent=schedule.map((id,i)=>`${i+1}. ${TRACKS.find(t=>t.id===id).name}`).join(' → ');
  $('online-round').textContent=lobby?`${schedule.length} ROUND${schedule.length===1?'':'S'} · SELECT IN RACE ORDER`:`ROUND ${room.tournament.round+1} OF ${schedule.length}`;
  $('online-ready').hidden=!lobby;$('online-ready').textContent=room.players[slot]?.ready?'NOT READY':'I’M READY';
  $('online-start').hidden=!host||!lobby;$('online-start').disabled=!room.players.filter(p=>p?.connected).every(p=>p.ready);
  $('online-back').hidden=!host||room.phase!=='finished';$('online-back').textContent=room.tournament?.complete?'BACK TO LOBBY':'NEXT ROUND ↗';
  $('online-hint').textContent=lobby?(host?'Select 1–5 tracks in race order, share the link, then ready up. Changing tracks resets readiness.':'The host selects the tournament tracks and starts when everyone is ready.'):room.phase==='finished'?(room.tournament?.complete?'Tournament complete. The host can set up another championship.':'Round complete. The host starts the next round when everyone is ready to continue.'):'Race in progress. Switching tabs lets AI drive until you return.';
 }
 function connect(){
  clearTimeout(timer);closed=false;connecting=true;render();status(retry?'Reconnecting… Your car is in AI hands.':'Connecting to the lobby…');
  let welcomed=false;
  const ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/multiplayer`);socket=ws;
  const deadline=setTimeout(()=>{if(ws.readyState===WebSocket.CONNECTING)ws.close();},10000);
  ws.onopen=()=>{clearTimeout(deadline);send({type:'hello',version:VERSION,room:invite||undefined,token:seatToken||undefined,name:$('online-name').value,face,track:getTrack()});};
  ws.onmessage=event=>{
   let m;try{m=JSON.parse(event.data);}catch{return;}
   if(m.type==='joined'){
    welcomed=true;invite=m.id;slot=m.slot;seatToken=m.token;retry=0;connecting=false;face=cleanFace(m.face,face);
    try{sessionStorage.setItem(`quattro-seat-${invite}`,seatToken);localStorage.setItem('quattro-name',$('online-name').value);}catch{}
    const url=new URL(location.href);url.searchParams.set('room',invite);history.replaceState(null,'',url);onSeat(slot);status('Connected. Share the link to invite friends.');
    $('chat-log').replaceChildren();
   }else if(m.type==='room'){room=m;if(m.players[slot])face=cleanFace(m.players[slot].face,face);render();onRoom(m,slot);}
   else if(m.type==='snapshot')onSnapshot(m);
   else if(m.type==='chat')chatLine(m);
   else if(m.type==='chat-log'){$('chat-log').replaceChildren();for(const line of m.messages)chatLine(line);}
   else if(m.type==='error'){
    status(m.message);
    if(!welcomed){closed=true;connecting=false;room=null;ws.close();onLeave();render();}
   }
  };
  ws.onerror=()=>{};
  ws.onclose=()=>{
   clearTimeout(deadline);if(socket!==ws||closed)return;
   if(room&&retry<12){retry++;status('Connection lost. Reconnecting… AI is driving your car.');timer=setTimeout(connect,Math.min(1000*retry,5000));}
   else{connecting=false;closed=true;status('Could not connect. Try joining again, or return to solo.');render();}
  };
 }
 function leave(){
  closed=true;connecting=false;clearTimeout(timer);send({type:'leave'});socket?.close();socket=null;
  room=null;invite='';seatToken='';retry=0;$('chat-log').replaceChildren();
  const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(null,'',url);
  status('Create a room and send its link to friends. No account needed.');render();onLeave();
 }
 $('online-create').onclick=()=>{onActivate();invite='';seatToken='';connect();};
 $('online-join').onclick=()=>{onActivate();connect();};
 $('online-cancel').onclick=leave;$('online-leave').onclick=leave;
 $('online-ready').onclick=()=>{onActivate();send({type:'ready',ready:!room.players[slot]?.ready});};
 $('online-start').onclick=()=>{onActivate();send({type:'start'});};
 $('online-back').onclick=()=>{onActivate();send({type:room.tournament?.complete?'lobby':'next'});};
 $('online-copy').onclick=async()=>{try{await navigator.clipboard.writeText($('online-link').value);status('Invite link copied. Send it to your friends.');}catch{$('online-link').focus();$('online-link').select();status('Copy the selected invite link.');}};
 $('online-link').onclick=()=>{$('online-link').select();};
 $('chat-form').onsubmit=event=>{
  event.preventDefault();const text=$('chat-text').value.trim();if(!text)return;
  if(send({type:'chat',text}))$('chat-text').value='';
 };
 if(invite){try{seatToken=sessionStorage.getItem(`quattro-seat-${invite}`)||'';}catch{}status('You’ve been invited. Pick a driver, enter a name and join the room.');}
 render();
 // Returning to this tab always hands control back to the player.
 const active=()=>send({type:'active',active:!document.hidden&&document.hasFocus()});
 addEventListener('blur',active);addEventListener('focus',active);document.addEventListener('visibilitychange',active);
 return {send,leave,faceOf,get room(){return room;},get slot(){return slot;},get connected(){return socket?.readyState===WebSocket.OPEN;}};
}
