import {TRACKS} from './tracks.js';
import {DRIVERS} from './drivers.js';
const $=id=>document.getElementById(id);
const VERSION=1;
export function createMultiplayer({onRoom,onSnapshot,onLeave,onSeat,onStatus,getTrack,onActivate}){
 let socket,room=null,slot=0,retry=0,timer,closed=true,connecting=false;
 let invite=new URL(location.href).searchParams.get('room')||'',seatToken='';
 try{$('online-name').value=localStorage.getItem('quattro-name')||'';}catch{}
 const status=message=>{$('online-status').textContent=message;onStatus?.(message);};
 const send=message=>{if(socket?.readyState===WebSocket.OPEN){socket.send(JSON.stringify(message));return true;}return false;};
 function render(){
  const joined=!!room,host=room?.host===slot,lobby=room?.phase==='lobby';
  $('online-intro').hidden=joined;$('online-room').hidden=!joined;
  $('online-create').disabled=connecting;$('online-join').disabled=connecting;
  $('online-join').hidden=!invite;$('online-create').hidden=!!invite;
  $('online-cancel').hidden=!invite&&!connecting;
  if(!joined)return;
  $('online-code').textContent=room.id;
  const link=new URL(location.href);link.search='';link.searchParams.set('room',room.id);link.hash='';$('online-link').value=link.href;
  $('online-members').replaceChildren(...DRIVERS.map((driver,i)=>{
   const member=room.players[i],li=document.createElement('li');li.style.setProperty('--driver',driver.color);
   const name=document.createElement('strong');name.textContent=member?`${member.name}${i===slot?' · YOU':''}`:`${driver.name} · AI`;
   const label=document.createElement('span');label.textContent=member?`${i===room.host?'HOST · ':''}${!member.connected?'RECONNECTING · AI DRIVING':lobby?(member.ready?'READY':'NOT READY'):'RACING'}`:'Fills an empty seat';
   li.append(name,label);return li;
  }));
  $('online-track').value=room.track;$('online-track').disabled=!host||!lobby;
  $('online-ready').hidden=!lobby;$('online-ready').textContent=room.players[slot]?.ready?'NOT READY':'I’M READY';
  $('online-start').hidden=!host||!lobby;$('online-start').disabled=!room.players.filter(p=>p?.connected).every(p=>p.ready);
  $('online-back').hidden=!host||room.phase!=='finished';
  $('online-hint').textContent=lobby?(host?'Choose a track, share the link, and start when everyone is ready.':'The host chooses the track and starts the race.'):room.phase==='finished'?'Race complete. The host can bring everyone back to the lobby.':'Race in progress. Switching tabs lets AI drive until you return.';
 }
 function connect(){
  clearTimeout(timer);closed=false;connecting=true;render();status(retry?'Reconnecting… Your car is in AI hands.':'Connecting to the lobby…');
  let welcomed=false;
  const ws=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/multiplayer`);socket=ws;
  const deadline=setTimeout(()=>{if(ws.readyState===WebSocket.CONNECTING)ws.close();},10000);
  ws.onopen=()=>{clearTimeout(deadline);send({type:'hello',version:VERSION,room:invite||undefined,token:seatToken||undefined,name:$('online-name').value,track:getTrack()});};
  ws.onmessage=event=>{
   let m;try{m=JSON.parse(event.data);}catch{return;}
   if(m.type==='joined'){
    welcomed=true;invite=m.id;slot=m.slot;seatToken=m.token;retry=0;connecting=false;
    try{sessionStorage.setItem(`quattro-seat-${invite}`,seatToken);localStorage.setItem('quattro-name',$('online-name').value);}catch{}
    const url=new URL(location.href);url.searchParams.set('room',invite);history.replaceState(null,'',url);onSeat(slot);status('Connected. Share the link to invite friends.');
   }else if(m.type==='room'){room=m;render();onRoom(m,slot);}
   else if(m.type==='snapshot')onSnapshot(m);
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
  room=null;invite='';seatToken='';retry=0;
  const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(null,'',url);
  status('Create a room and send its link to friends. No account needed.');render();onLeave();
 }
 $('online-track').replaceChildren(...TRACKS.map(track=>{const option=document.createElement('option');option.value=track.id;option.textContent=track.name;return option;}));
 $('online-create').onclick=()=>{onActivate();invite='';seatToken='';connect();};
 $('online-join').onclick=()=>{onActivate();connect();};
 $('online-cancel').onclick=leave;$('online-leave').onclick=leave;
 $('online-ready').onclick=()=>{onActivate();send({type:'ready',ready:!room.players[slot]?.ready});};
 $('online-start').onclick=()=>{onActivate();send({type:'start'});};
 $('online-track').onchange=()=>send({type:'track',track:$('online-track').value});
 $('online-back').onclick=()=>send({type:'lobby'});
 $('online-copy').onclick=async()=>{try{await navigator.clipboard.writeText($('online-link').value);status('Invite link copied. Send it to your friends.');}catch{$('online-link').focus();$('online-link').select();status('Copy the selected invite link.');}};
 $('online-link').onclick=()=>{$('online-link').select();};
 if(invite){try{seatToken=sessionStorage.getItem(`quattro-seat-${invite}`)||'';}catch{}status('You’ve been invited. Enter a name and join the room.');}
 render();
 // Returning to this tab always hands control back to the player.
 const active=()=>send({type:'active',active:!document.hidden&&document.hasFocus()});
 addEventListener('blur',active);addEventListener('focus',active);document.addEventListener('visibilitychange',active);
 return {send,leave,get room(){return room;},get slot(){return slot;},get connected(){return socket?.readyState===WebSocket.OPEN;}};
}
