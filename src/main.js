import * as THREE from 'three';
import './style.css';
import { formatTime, raceStandings } from './race.js';
import { TRACKS, SURFACES } from './tracks.js';
import { createWorld } from './world.js';
import { createCockpit } from './cockpit.js';
import { createCar } from './car.js';
import { coursePreview } from './course.js';
import { aiControls,driveCar,collideCars } from './physics.js';

import { DRIVERS, GRID, PLAYER, portrait, cleanFace } from './drivers.js';
import { createSoundtrack } from './soundtrack.js';
import { createTrail } from './trail.js';
import { createDust, dustDensity } from './dust.js';
import { MESSAGES, pick, resultTitle } from './messages.js';
import { createMultiplayer } from './multiplayer.js';
import {loopCarPose} from './stunt-motion.js';
import {renderTournament} from './tournament-ui.js';

const $ = (id) => document.getElementById(id);
const viewport = $('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#74795c');
const camera = new THREE.OrthographicCamera(-54, 54, 32, -32, 0.1, 300);
// Equal-axis orthographic view: 45° around the arena, 35.3° above the ground.
camera.position.set(90, 90, 90); camera.lookAt(0, 0, 0);
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
catch { $('overlay').innerHTML = '<h2>WEBGL REQUIRED</h2><p>Please open this game in a browser with hardware acceleration enabled.</p>'; throw new Error('WebGL unavailable'); }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
viewport.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xfff3d3, 0x53604b, 2.4));
const sun = new THREE.DirectionalLight(0xffe2ad, 3.2);
sun.position.set(-35, 65, 25); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.001; scene.add(sun);
// The shadow frustum has to reach the whole course. A fixed box clipped the
// shadows of the wider stages mid-slope, leaving straight-cut edges on the
// ground that read as if the road were floating clear of it.
function fitShadows(){
 let reach=0;for(const p of world.points)reach=Math.max(reach,Math.hypot(p.x,p.z));
 reach+=(track.banking||track.hills||track.stuntPark)?24:14;
 Object.assign(sun.shadow.camera,{left:-reach,right:reach,top:reach,bottom:-reach});
 sun.shadow.camera.updateProjectionMatrix();
}
let track=TRACKS[0],world=createWorld(scene,track);fitShadows();
const startT=.035;
const at=(t,lane=0)=>world.at(t,lane);
const random=Math.random;

const FINISHERS=3;
let player=PLAYER,online=null,mp,onlineRace=-1,onlineResultShown=false,onlineDriving=true;
let inputSequence=0,pendingInputs=[],networkTargets=null;
const driverFor=c=>({...DRIVERS[c.i],name:online?.players[c.i]?.name||DRIVERS[c.i].name,ace:!online?.players[c.i]&&DRIVERS[c.i].ace});
// A seat keeps its livery; the face is whichever one that driver picked online.
const faceOf=i=>cleanFace(online?.players[i]?.face,DRIVERS[i].face);
const seatPortrait=i=>portrait(faceOf(i),{color:DRIVERS[i].color,trim:DRIVERS[i].trim,name:online?.players[i]?.name||DRIVERS[i].name});
const colors=DRIVERS.map(d=>d.color);
const TRIM='#252c25';
// One car per driver, and the player is always the amber one.
const driverIndex=c=>c.i;
const gridSlot=i=>GRID.indexOf(i);
const cars=colors.map((color,i)=>({ ...createCar(scene,color,i),i,x:0,z:0,vx:0,vz:0,angle:0,t:0,progress:0,nitro:100,air:0,vy:0,jumpCooldown:0,finished:false,finishTime:0}));
// The pointer hovers over the car you are driving, in that car's own colour.
const marker=new THREE.Mesh(new THREE.ConeGeometry(.65,1.1,3),new THREE.MeshBasicMaterial({color:DRIVERS[PLAYER].color}));marker.rotation.z=Math.PI;scene.add(marker);
const trails=cars.map(()=>createTrail(scene));
const dust=createDust(scene,{count:1400});
const cockpit=createCockpit(scene);let cockpitMode=false;
function toggleView(){cockpitMode=!cockpitMode;cockpit.reset();$('view-toggle').textContent=cockpitMode?'ISOMETRIC · C':'COCKPIT · C';$('view-toggle').setAttribute('aria-pressed',String(cockpitMode));$('view-toggle').setAttribute('aria-label',cockpitMode?'Switch to isometric view (C)':'Switch to cockpit view (C)');viewport.classList.toggle('is-cockpit',cockpitMode);resize();}
$('view-toggle').onclick=toggleView;
let state='ready',raceTime=0,countdown=0,keys=new Set(),last=0,accumulator=0,best=null;
function loadBest(){best=null;try{best=Number(localStorage.getItem(`quattro-best-${track.id}-v${track.revision}`))||null;}catch{}}
loadBest();
let audioContext,oscillator,gain,sound=true;
const soundtrack=createSoundtrack($('soundtrack'),`${import.meta.env.BASE_URL}audio/`);
function syncAudio(){const active=sound&&!document.hidden&&document.hasFocus();soundtrack.setPlaying(active&&['countdown','racing','finishing','finished'].includes(state));if(gain)gain.gain.setTargetAtTime(active&&state==='racing'?.018:0,audioContext.currentTime,.1);}
function enableAudio(){if(!audioContext){audioContext=new AudioContext();oscillator=audioContext.createOscillator();oscillator.type='sawtooth';gain=audioContext.createGain();gain.gain.value=0;const filter=audioContext.createBiquadFilter();filter.frequency.value=450;oscillator.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);oscillator.start();}audioContext.resume().catch(()=>{});}
$('sound').onclick=()=>{sound=!sound;if(sound)enableAudio();$('sound').textContent=sound?'SOUND ON ↗':'SOUND OFF ↗';$('sound').setAttribute('aria-label',sound?'Mute sound':'Enable sound');$('sound').setAttribute('aria-pressed',String(sound));syncAudio();};
function reset(){$('tournament-results').hidden=true;$('result-times').hidden=false;$('results').classList.remove('is-championship');cockpit.reset();world.setTime(0);$('results').classList.add('hidden');$('results').classList.remove('is-triumph');quipDriver=-1;$('race-message').textContent='';raceTime=0;keys.clear();cars.forEach((c,i)=>{// Half a car length of stagger inside each row, so the standings read P1..P4.
 const slot=gridSlot(i),t=startT-.022-Math.floor(slot/2)*.026-(slot%2)*.003,p=at(t,slot%2?2:-2),d=world.curve.getTangentAt((t+1)%1);Object.assign(c,{x:p.x,z:p.z,vx:0,vz:0,angle:Math.atan2(d.x,d.z),t:(t+1)%1,progress:t-startT,nitro:100,air:0,vy:0,jumpCooldown:0,finished:false,finishTime:0,stunt:null,stuntHeight:0,surface:track.surface||'gravel'});});dust.clear();trails.forEach(t=>t.clear());$('race-message').textContent='';syncModels();updateHUD();}
function start(){if(online){document.querySelector('.online-panel').scrollIntoView({behavior:'smooth',block:'start'});return;}if(sound)enableAudio();soundtrack.beginRace();reset();document.querySelectorAll('.track-card').forEach(b=>b.disabled=true);state='countdown';countdown=3.4;$('overlay').classList.add('hidden');$('status').textContent=pick(MESSAGES.lights);$('pause').textContent='Ⅱ';syncAudio();}
function togglePause(){if(online){onlineDriving=!onlineDriving;keys.clear();mp.send({type:'active',active:onlineDriving});$('pause').textContent=onlineDriving?'Ⅱ':'▶';$('status').textContent=onlineDriving?'YOU ARE DRIVING':'AI IS DRIVING · PRESS P TO TAKE OVER';return;}if(state==='racing'||state==='countdown'||state==='finishing'){state=state==='racing'?'paused':state==='finishing'?'paused-finishing':'paused-countdown';$('countdown').textContent='PAUSED';$('pause').textContent='▶';}else if(state.startsWith('paused')){state=state==='paused'?'racing':state==='paused-finishing'?'finishing':'countdown';$('countdown').textContent='';$('pause').textContent='Ⅱ';if(sound)enableAudio();}syncAudio();soundtrack.retry();}
$('start').onclick=start;$('restart').onclick=start;$('pause').onclick=togglePause;
function trackInfo(){
 document.querySelector('.race-info>span').textContent=`${String(TRACKS.indexOf(track)+1).padStart(2,'0')} — ${track.name.toUpperCase()}`;
 document.querySelector('.race-info>p').textContent=`4 DRIVERS / 3 LAPS / ${track.biome}`;
 document.querySelector('.difficulty').textContent=`${'● '.repeat(track.difficulty)}${'○ '.repeat(4-track.difficulty)} ${track.rating}`;
 document.querySelector('.track-label').innerHTML=`${track.name.toUpperCase()}<span>${track.layout} · ${track.rating}</span>`;
 document.querySelector('.tip').innerHTML=`${track.rating} · ${track.biome}<span>${track.tip}</span>`;
 $('track-description').textContent=track.tip;
 $('cockpit-map').innerHTML=coursePreview(track).replace('</svg>','<circle class="map-car" r="3.5"/></svg>');
 document.querySelectorAll('.track-card').forEach(b=>{b.classList.toggle('active',b.dataset.track===track.id);b.setAttribute('aria-pressed',String(b.dataset.track===track.id));});
}
function selectTrack(id){
 const next=TRACKS.find(t=>t.id===id);if(!next)return;
 if(next!==track){world.dispose();track=next;world=createWorld(scene,track);fitShadows();resize();}
 scene.background.set(track.sky);sun.color.set(track.sun);state='ready';syncAudio();loadBest();reset();
 $('countdown').textContent='';$('pause').textContent='Ⅱ';$('overlay').classList.remove('hidden');
 $('overlay').querySelector('.eyebrow').textContent=`${track.biome} · ${track.rating} · ${track.difficulty}/4`;
 $('overlay').querySelector('h2').innerHTML=track.name.toUpperCase().replace(/ (?!.* )/,'<br>');
 $('overlay').querySelector('p:not(.eyebrow)').textContent=track.tip;
 $('lineup').style.display='flex';$('start').innerHTML='LET’S RACE <span>↗</span>';$('status').textContent=pick(MESSAGES.ready);
 document.querySelectorAll('.track-card').forEach(b=>b.disabled=false);trackInfo();
}
$('tracks').innerHTML=TRACKS.map((t,i)=>`<button class="track-card" data-track="${t.id}" aria-label="${t.name}, ${t.layout}, ${t.biome}, difficulty ${t.difficulty} of 4, ${t.rating}" aria-pressed="${i===0}" style="--biome:${t.accent||t.road}"><span class="track-number">${String(i+1).padStart(2,'0')} / ${t.biome}</span>${coursePreview(t)}<strong>${t.name}</strong><span class="layout-name">${t.layout}</span><span class="track-rating">${'●'.repeat(t.difficulty)}${'○'.repeat(4-t.difficulty)} <b>${t.rating}</b></span></button>`).join('');
for(const b of document.querySelectorAll('.track-card'))b.onclick=()=>online?mp.send({type:'track',track:b.dataset.track}):selectTrack(b.dataset.track);
$('change-track').onclick=()=>{if(online){document.querySelector('.online-panel').scrollIntoView({behavior:'smooth'});return;}selectTrack(track.id);$('tracks').scrollIntoView({block:'nearest',behavior:'smooth'});};
trackInfo();
function updateDrivers(){
 for(const c of cars){const d=driverFor(c),ctx=c.numberCanvas.getContext('2d');
  ctx.fillStyle=d.trim||'#ece8d5';ctx.fillRect(0,0,64,64);ctx.fillStyle=d.trim?d.color:'#26382a';ctx.fillText(String(driverIndex(c)+1).padStart(2,'0'),32,49);c.decal.material.map.needsUpdate=true;
  c.paint.color.set(d.color);c.trim.color.set(d.trim||TRIM);
  // The locked ace drives to his own, quicker limits; everyone else shares one.
  c.skill=online?.players[c.i]?1:d.skill||1;}
 marker.material.color.set(DRIVERS[player].color);
 $('driver-strip').innerHTML=cars.map(c=>{const d=driverFor(c);return `<span class="driver-chip" style="--driver:${d.color}">${seatPortrait(c.i)}<span>${d.name}<small>${c.i===player?'YOU':online?.players[c.i]?'ONLINE':d.ace?'ACE':'RIVAL'}</small></span></span>`;}).join('');
}
// Nobody picks a car: the grid is fixed, quickest away first and you last.
function soloLineup(){
$('lineup').innerHTML=GRID.map((i,slot)=>{const d=DRIVERS[i];
 return `<div class="grid-slot${i===PLAYER?' is-player':''}" style="--driver:${d.color}"><span class="grid-place">P${slot+1}</span>${seatPortrait(i)}<strong>${d.name}</strong><span class="grid-role">${i===PLAYER?'YOU':d.ace?'ACE':'RIVAL'}</span></div>`;}).join('');
$('lineup').setAttribute('aria-label',`Starting grid: ${GRID.map((i,slot)=>`P${slot+1} ${DRIVERS[i].name}`).join(', ')}`);
}
soloLineup();
updateDrivers();
$('replay').onclick=()=>online?mp.send({type:online.tournament?.complete?'lobby':'next'}):start();
$('next-track').onclick=()=>online?mp.send({type:'lobby'}):selectTrack(TRACKS[(TRACKS.indexOf(track)+1)%TRACKS.length].id);
addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='Enter'&&(state==='ready'||state==='finished'||state==='finishing'))start();if(e.code==='KeyP'||e.code==='Escape')togglePause();if(e.code==='KeyR')start();if(e.code==='KeyC')toggleView();});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();if(!online&&(state==='racing'||state==='countdown'||state==='finishing'))togglePause();syncAudio();});
addEventListener('focus',()=>{onlineDriving=true;syncAudio();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(!online&&(state==='racing'||state==='countdown'||state==='finishing'))togglePause();}syncAudio();});
for(const b of document.querySelectorAll('#touch button')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);};for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(b.dataset.key));}
// Loose surfaces throw up a rolling cloud behind the wheels, thick enough on
// the dirt courses that a pack of cars can smear the track behind them. Sliding,
// boosting and landing all cost extra dust.
const dustDebt=cars.map(()=>0);
function kickUpDust(c,dt,speed,slip,fx,fz,surface,boosting){
 if(c.stunt)return;
 const density=dustDensity(c.surface),ground=(track.banking||track.hills||track.stuntPark)?world.roadFrame(c.x,c.z,c.t).height:0;
 // Airborne cars kick up nothing until they land, and then all at once.
 if(c.air>.25){c.landing=density>=.05;return;}
 if(c.landing){c.landing=false;
  for(let i=0;i<18*density;i++)dust.spawn(c.x-fx*1.1+(random()-.5)*2.4,ground+.4+random()*.6,c.z-fz*1.1+(random()-.5)*2.4,surface.color,
   {radius:5.5+random()*3.5,opacity:.43*density,seconds:2.7+random(),vx:(random()-.5)*4.5,vy:1.6+random(),vz:(random()-.5)*4.5,growth:6});
 }
 if(speed<3||density<.05)return;
 dustDebt[c.i]+=dt*density*(15+speed*1.4+slip*3+(boosting?20:0));
 while(dustDebt[c.i]>=1){
  dustDebt[c.i]-=1;
  const wide=random()<.45;
  dust.spawn(c.x-fx*(1.5+random()),ground+.3+random()*.7,c.z-fz*(1.5+random()),surface.color,{
   radius:wide?4+random()*3:1.8+random()*1.6,
   opacity:(wide?.36:.46)*density,
   seconds:wide?2.4+random()*1.3:1.2+random()*.7,
   vx:-fx*speed*.14+(random()-.5)*2.4, vy:.8+random()*1.2, vz:-fz*speed*.14+(random()-.5)*2.4,
   growth:wide?5.5:3.2,
  });
 }
}
function step(dt){
 if(online){stepOnline(dt);return;}
 if(state==='countdown'){countdown-=dt;$('countdown').textContent=countdown>.4?Math.ceil(countdown-.4):'GO!';if(countdown<=0){state='racing';$('countdown').textContent='';$('status').textContent=pick(MESSAGES.racing);}return;}
 if(state!=='racing'&&state!=='finishing')return;
 raceTime+=dt;world.setTime(raceTime);
 for(const c of cars){
  let controls;
  if(c.i===player&&!c.finished){
    const throttle=keys.has('ArrowUp')||keys.has('KeyW')?1:0;
    controls={throttle,brake:keys.has('ArrowDown')||keys.has('KeyS'),steer:(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)-(keys.has('ArrowRight')||keys.has('KeyD')?1:0),boost:keys.has('Space')&&throttle>0};
  }else controls=aiControls(c,world,track,cars);
  const {speed,fx,fz,surface}=driveCar(c,world,track,dt,controls);
  if(c.progress>=3&&!c.finished){c.finished=true;c.finishTime=raceTime;if(c.i===player)finish();}
  const slip=Math.abs(c.vx*fz-c.vz*fx);
  // A sliding or boosting car scrubs a heavier mark than one just rolling.
  if(speed>2.5&&c.air<.2&&!c.stunt)trails[c.i].sample(c.x-fx*1.2,c.z-fz*1.2,c.angle,c.surface,Math.min(.85,.3+slip*.06+(controls.boost&&c.nitro>0?.15:0)),(track.banking||track.hills||track.stuntPark)?(x,z)=>world.roadFrame(x,z).height:undefined);
  kickUpDust(c,dt,speed,slip,fx,fz,surface,controls.boost&&c.nitro>0);
 }
 collideCars(cars);
 if(state==='finishing'){
  // Three cars home brings out the flag; the last one is left to its own time.
  if(cars.filter(c=>c.finished).length>=FINISHERS||raceTime-cars[player].finishTime>=25){state='finished';$('status').textContent=pick(MESSAGES.final);}
  renderResults();
 }
 for(const t of trails)t.fade(dt);
 dust.update(dt);
}
function position(){return raceStandings(cars).findIndex(c=>c.i===player)+1;}
let resultOrder='',resultRows='',lastResultUpdate=-1,podiumLines=[],graceLine='',quipLine='',quipDriver=-1,beatAce=false;
function renderResults(){
 if(state==='finishing'&&raceTime-lastResultUpdate<.25&&resultOrder)return;
 lastResultUpdate=raceTime;
 const ordered=raceStandings(cars),order=ordered.map(c=>c.i).join('');
 if(order!==resultOrder){
  resultOrder=order;
  $('podium').innerHTML=[1,0,2].map(place=>{const c=ordered[place],d=driverFor(c);return `<div class="podium-driver place-${place+1}" style="--driver:${d.color}"><div class="celebrant"><span class="podium-prop" aria-hidden="true">${['🏆','🧇','🔧'][place]}</span>${seatPortrait(c.i)}</div><strong>${d.name}${c.i===player?' <small>YOU</small>':''}</strong><div class="podium-block"><b>0${place+1}</b><span>${podiumLines[place]}</span></div></div>`;}).join('');
 }
 const rows=ordered.map((c,i)=>`<div class="result-row ${c.i===player?'is-player':''}"><b>0${i+1}</b>${seatPortrait(c.i)}<span>${driverFor(c).name}${c.i===player?' · YOU':''}</span><time>${c.finished?formatTime(c.finishTime):state==='finished'?'DNF':`LAP ${Math.min(3,Math.floor(Math.max(0,c.progress))+1)} · RACING`}</time></div>`).join('');
 if(rows!==resultRows){$('result-times').innerHTML=rows;resultRows=rows;}
 const last=driverIndex(ordered[3]);
 if(last!==quipDriver){quipDriver=last;quipLine=`P4 · ${DRIVERS[last].name}: ${pick(DRIVERS[last].quips)}`;}
 $('results-quip').textContent=online?(state==='finishing'?'Waiting for the rest of the field…':(online.tournament?.complete?'The cup is decided. Ready for a rematch?':'Points are banked. The host starts the next round.')):state==='finishing'?graceLine:quipLine;
 if(online&&state==='finished'){
  const crowned=$('results').classList.contains('is-championship');
  renderTournament(online.tournament,{player,driver:i=>driverFor(cars[i]),portrait:seatPortrait});
  if(online.tournament?.complete&&!crowned){soundtrack.finale(online.tournament.standings[0].seat===player);$('results').querySelector('.confetti').innerHTML=Array.from({length:60},(_,i)=>`<i style="--x:${i*43%100}%;--delay:${i*.055}s;--color:${['#f5ce72','#fff3cc','#9ece6a'][i%3]}"></i>`).join('');}
 }
}
function finish(){
 state='finishing';const rank=position(),time=cars[player].finishTime;
 // Beating the ace outranks the finishing position: the screen changes, and so
 // does the music. He has not crossed the line yet if the player got there first.
 beatAce=!online&&!cars.some(c=>driverFor(c).ace&&c.finished);
 podiumLines=MESSAGES.podium.map(lines=>pick(lines));graceLine=pick(MESSAGES.grace);
 if(!online&&(best===null||time<best)){best=time;try{localStorage.setItem(`quattro-best-${track.id}-v${track.revision}`,String(best));}catch{}}
 keys.clear();$('race-message').textContent='';$('results').classList.remove('hidden');
 $('results-stage').textContent=beatAce?`${track.name.toUpperCase()} · THE ACE IS BEATEN`:`${track.name.toUpperCase()} · CHEQUERED FLAG`;
 $('results-title').textContent=online?(cars[player].finished?`FINISHED · P${rank}`:`FLAGGED OFF · P${rank}`):resultTitle(rank,beatAce);
 $('results-summary').textContent=online?(cars[player].finished?`${formatTime(time)} · ONLINE RACE`:'DNF · THE FLAG WAS OUT'):`${formatTime(time)} · PERSONAL BEST ${formatTime(best)}`;
 $('results').classList.toggle('is-triumph',beatAce);
 if(!online)soundtrack.finale(beatAce);
 resultOrder='';resultRows='';renderResults();
 const flakes=beatAce?46:24,palette=beatAce?['#9ece6a','#e9b85d','#f4efdb','#7fd6a2']:colors;
 $('results').querySelector('.confetti').innerHTML=Array.from({length:flakes},(_,i)=>`<i style="--x:${(i*43)%100}%;--delay:${i*(beatAce?.07:.13)}s;--color:${palette[i%palette.length]}"></i>`).join('');
 $('status').textContent=pick(MESSAGES.flag);$('replay').focus({preventScroll:true});
 document.querySelectorAll('.track-card').forEach(b=>b.disabled=!!online);
}
function onlineRoom(room,slot){
 const previous=online;online=room;player=slot;document.querySelector('.track-picker').hidden=true;
 if(!previous||room.track!==track.id||(room.phase==='lobby'&&previous.phase!=='lobby')){
  selectTrack(room.track);networkTargets=null;pendingInputs=[];onlineResultShown=false;
 }
 if(room.phase==='lobby'){
  state='ready';$('overlay').querySelector('h2').textContent='YOUR ROOM IS READY';
  $('overlay').querySelector('p:not(.eyebrow)').textContent='Ready up in the lobby above. The host starts the race.';
  $('start').textContent='OPEN LOBBY ↑';
  $('overlay').querySelector('small').textContent='READY UP ABOVE · ARROW KEYS / WASD TO DRIVE';
 }
 $('restart').disabled=true;$('pause').disabled=room.phase==='lobby'||room.phase==='finished';
 $('replay').textContent=room.tournament?.complete?'NEW TOURNAMENT ↑':'NEXT ROUND ↗';$('replay').disabled=room.host!==player||room.phase!=='finished';
 $('next-track').hidden=true;
 document.querySelectorAll('.track-card').forEach(b=>b.disabled=room.phase!=='lobby'||room.host!==player);
 updateDrivers();
 $('lineup').setAttribute('aria-label','Online starting grid');
 $('lineup').innerHTML=GRID.map(i=>`<div class="grid-slot" style="--driver:${colors[i]}">${seatPortrait(i)}<strong>${driverFor(cars[i]).name}</strong><span>${i===player?'YOU':room.players[i]?'ONLINE':'AI'}</span></div>`).join('');
}
function receiveSnapshot(s){
 if(!online||s.race<onlineRace)return;
 if(s.track!==track.id)selectTrack(s.track);
 online.tournament=s.tournament;
 if(s.race!==onlineRace){
  onlineRace=s.race;inputSequence=0;pendingInputs=[];onlineResultShown=false;onlineDriving=true;
  reset();soundtrack.beginRace();$('overlay').classList.add('hidden');
  document.querySelector('.game-shell').scrollIntoView({block:'start',behavior:'smooth'});
 }
 raceTime=s.time;world.setTime(s.time);networkTargets=s.cars;
 pendingInputs=pendingInputs.filter(p=>p.seq>s.acks[player]);
 Object.assign(cars[player],s.cars[player],{stunt:s.cars[player].stunt?{...s.cars[player].stunt}:null});
 if(s.phase==='racing'&&!s.cars[player].finished){
  // Replay against disposable peer states, never mutate the server snapshot.
  const replay=s.cars.map((c,i)=>i===player?cars[player]:{...c,stunt:c.stunt?{...c.stunt}:null});
  for(const [i,p] of pendingInputs.entries()){
   world.setTime(s.time+(i+1)/60);driveCar(cars[player],world,track,1/60,p.control);
   for(const c of replay)if(c.i!==player&&!c.finished){if(c.stunt)driveCar(c,world,track,1/60,{throttle:1});else{c.x+=c.vx/60;c.z+=c.vz/60;}}
   collideCars(replay);
  }
 }
 for(let i=0;i<4;i++)if(i!==player){
  const c=cars[i],target=s.cars[i];
  if(s.phase!=='racing'||Math.hypot(c.x-target.x,c.z-target.z)>8)Object.assign(c,target,{stunt:target.stunt?{...target.stunt}:null});
  else{const {x,z,angle,air,...rest}=target;Object.assign(c,rest,{stunt:target.stunt?{...target.stunt}:null});}
 }
 state=s.phase==='countdown'?'countdown':s.phase==='finished'?'finished':s.cars[player].finished?'finishing':'racing';
 $('countdown').textContent=s.phase==='countdown'?(s.countdown>.4?String(Math.ceil(s.countdown-.4)):'GO!'):'';
 $('status').textContent=s.phase==='countdown'?'EVERYONE ON THE GRID':s.phase==='finished'?'RACE COMPLETE':(onlineDriving?`ONLINE · YOU ARE ${driverFor(cars[player]).name.toUpperCase()}`:'AI IS DRIVING · PRESS P TO TAKE OVER');
 if((s.cars[player].finished||s.phase==='finished')&&!onlineResultShown){onlineResultShown=true;finish();}
 if(s.phase==='finished'){state='finished';$('replay').disabled=online.host!==player;$('replay').textContent=s.tournament.complete?'NEW TOURNAMENT ↑':'NEXT ROUND ↗';renderResults();}
 else if(onlineResultShown)renderResults();
 syncAudio();
}
function stepOnline(dt){
 if(!networkTargets||!['racing','finishing'].includes(state))return;
 world.setTime(world.traffic.time+dt);
 const active=onlineDriving&&!document.hidden&&document.hasFocus()&&mp.connected;
 if(active&&!cars[player].finished&&pendingInputs.length<30){
  const throttle=keys.has('ArrowUp')||keys.has('KeyW')?1:0;
  const control={throttle,brake:keys.has('ArrowDown')||keys.has('KeyS'),steer:(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)-(keys.has('ArrowRight')||keys.has('KeyD')?1:0),boost:keys.has('Space')&&!!throttle};
  const seq=++inputSequence;
  if(mp.send({type:'input',race:onlineRace,seq,...control})){pendingInputs.push({seq,control});driveCar(cars[player],world,track,dt,control);}
 }
 for(const c of cars){
  const target=networkTargets[c.i];
  if(c.i!==player||!active){c.x+=(target.x-c.x)*.35;c.z+=(target.z-c.z)*.35;c.angle+=Math.atan2(Math.sin(target.angle-c.angle),Math.cos(target.angle-c.angle))*.35;c.air+=(target.air-c.air)*.35;}
 }
 // Predict contact immediately after smoothing remote positions. The server
 // remains authoritative and reconciles these cosmetic/predicted corrections.
 collideCars(cars);
 for(const c of cars){
  const speed=Math.hypot(c.vx,c.vz),fx=Math.sin(c.angle),fz=Math.cos(c.angle),slip=Math.abs(c.vx*fz-c.vz*fx);
  if(speed>2.5&&c.air<.2&&!c.stunt)trails[c.i].sample(c.x-fx*1.2,c.z-fz*1.2,c.angle,c.surface,Math.min(.85,.3+slip*.06),(track.banking||track.hills||track.stuntPark)?(x,z)=>world.roadFrame(x,z).height:undefined);
  kickUpDust(c,dt,speed,slip,fx,fz,SURFACES[c.surface]||SURFACES.gravel,false);
 }
 for(const t of trails)t.fade(dt);dust.update(dt);
}
function leaveOnline(){
 online=null;player=PLAYER;onlineRace=-1;document.querySelector('.track-picker').hidden=false;
 $('overlay').querySelector('small').textContent='ENTER TO START · ARROW KEYS / WASD TO DRIVE';networkTargets=null;pendingInputs=[];
 $('restart').disabled=false;$('pause').disabled=false;$('next-track').hidden=false;$('replay').disabled=false;$('replay').textContent='RACE AGAIN ↻';
 selectTrack(track.id);soloLineup();updateDrivers();
}
const roadPose=new THREE.Matrix4(),roadForward=new THREE.Vector3(),roadRight=new THREE.Vector3();
function syncModels(){
 for(const c of cars){
  c.updateWheels(c,raceTime);
  if(c.stunt){const pose=loopCarPose(world,track,c.stunt);c.g.position.copy(pose.position);c.g.quaternion.copy(pose.quaternion);if(c.stunt.facing<0)c.g.rotateY(Math.PI);}
  else if(track.banking||track.hills||track.stuntPark){
   const frame=world.roadFrame(c.x,c.z,c.t);
   c.g.position.set(c.x,frame.height+c.air,c.z);
   roadForward.set(Math.sin(c.angle),0,Math.cos(c.angle));
   roadForward.addScaledVector(frame.normal,-roadForward.dot(frame.normal)).normalize();
   roadRight.crossVectors(frame.normal,roadForward).normalize();
   roadPose.makeBasis(roadRight,frame.normal,roadForward);c.g.quaternion.setFromRotationMatrix(roadPose);
  }else{
   c.g.position.set(c.x,c.air,c.z);c.g.rotation.set(-c.vy*.018,c.angle,Math.sin(raceTime*28+c.i)*Math.min(Math.hypot(c.vx,c.vz)*.0015,.035));
  }
 }
 marker.position.set(cars[player].x,cars[player].g.position.y+3.3,cars[player].z);
}
function updateHUD(){if(state==='racing')$('race-message').textContent=cars[player].stunt?cars[player].stunt.guidance||'LOOP · FOLLOW THE YELLOW LINE':cars[player].surface&&cars[player].surface!==(track.surface||'gravel')?SURFACES[cars[player].surface].label:'';$('position').innerHTML=`0${position()}<span>/ 04</span>`;$('lap').innerHTML=`0${Math.min(3,Math.floor(Math.max(0,cars[player].progress))+1)}<span>/ 03</span>`;$('time').textContent=formatTime(cars[player].finished?cars[player].finishTime:raceTime);$('speed').textContent=Math.round(Math.hypot(cars[player].vx,cars[player].vz)*5);$('nitro-fill').style.width=`${cars[player].nitro}%`;}
function resize(){
 const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;
 const aspect=w/h,bounds=new THREE.Box3(),point=new THREE.Vector3();
 camera.updateMatrixWorld(true);
 const include=(x,y,z)=>bounds.expandByPoint(point.set(x,y,z).applyMatrix4(camera.matrixWorldInverse));
 const margin=track.width/2+2;
 // Fit the road, barriers and airborne cars in camera space, including on phones.
 for(let i=0;i<world.points.length;i+=4){const p=world.points[i];
   for(const dx of [-margin,margin])for(const dz of [-margin,margin])for(const y of [0,5])include(p.x+dx,y,p.z+dz);
 }
 for(const dx of [-10,10])for(const y of [0,6])include(track.banner[0]+dx,y,track.banner[1]);
 if(track.banking||track.hills||track.stuntPark)for(let i=0;i<120;i++)for(const lane of [-track.width/2-1,track.width/2+1]){
  const p=world.at(i/120,lane);include(p.x,p.y+4,p.z);
 }
 for(const p of world.framingPoints)include(p.x,p.y,p.z);
 if(track.id==='garage')for(const x of [-57,57])for(const z of [-41,41])include(x,6,z);
 if(track.id==='gravel')for(const x of [-36,36])include(x,4,-40);
 const cx=(bounds.min.x+bounds.max.x)/2,cy=(bounds.min.y+bounds.max.y)/2;
 const halfW=Math.max((bounds.max.x-bounds.min.x)/2+3,((bounds.max.y-bounds.min.y)/2+3)*aspect),halfH=halfW/aspect;
 Object.assign(camera,{left:cx-halfW,right:cx+halfW,top:cy+halfH,bottom:cy-halfH});
 camera.updateProjectionMatrix();renderer.setSize(w,h);cockpit.resize(w,h);
 dust.setScale(cockpitMode?renderer.domElement.height/(2*Math.tan(THREE.MathUtils.degToRad(cockpit.camera.fov/2))):renderer.domElement.height/(camera.top-camera.bottom),cockpitMode);
}
new ResizeObserver(resize).observe(viewport);resize();reset();
renderer.setAnimationLoop(now=>{const dt=last?Math.min((now-last)/1000,.1):0;last=now;accumulator+=dt;while(accumulator>=1/60){step(1/60);accumulator-=1/60;}syncModels();updateHUD();syncAudio();if(gain){oscillator.frequency.setTargetAtTime(45+Math.hypot(cars[player].vx,cars[player].vz)*8,audioContext.currentTime,.08);}world.updateTraffic?.();
 cockpit.update(cars[player],dt,cockpitMode,(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)-(keys.has('ArrowRight')||keys.has('KeyD')?1:0));
 if(cockpitMode){
  const dot=$('cockpit-map').querySelector('.map-car');dot?.setAttribute('cx',cars[player].x+54);dot?.setAttribute('cy',cars[player].z+42);
  cars[player].g.visible=false;marker.visible=false;
 }
 renderer.render(scene,cockpitMode?cockpit.camera:camera);
 cars[player].g.visible=true;marker.visible=true;});
mp=createMultiplayer({getTrack:()=>track.id,onRoom:onlineRoom,onSnapshot:receiveSnapshot,onSeat:slot=>{player=slot;pendingInputs=[];inputSequence=0;},onLeave:leaveOnline,onActivate:()=>{if(sound)enableAudio();soundtrack.retry();},onStatus:message=>{if(online)$('status').textContent=message;}});
// Read-only telemetry for smoke tests and debugging.
window.quattro={get view(){return cockpitMode?'cockpit':'isometric';},get trains(){return world.traffic.trains.map(t=>({x:t.x,z:t.z}));},get room(){return online?.id||null;},get player(){return player;},get track(){return track.id;},get state(){return state;},get raceTime(){return raceTime;},get cars(){return cars.map(c=>({driver:driverFor(c).name,x:c.x,z:c.z,angle:c.angle,progress:c.progress,nitro:c.nitro,air:c.air,finished:c.finished,finishTime:c.finishTime,surface:c.surface}));},get drawCalls(){return renderer.info.render.calls;},get dust(){return dust.live;},get marks(){return trails.map(t=>t.length);}};
