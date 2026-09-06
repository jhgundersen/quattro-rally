import * as THREE from 'three';
import './style.css';
import { formatTime, raceStandings } from './race.js';
import { TRACKS, SURFACES } from './tracks.js';
import { createWorld } from './world.js';
import { coursePreview } from './course.js';
import { aiControls,driveCar,collideCars } from './physics.js';

import { DRIVERS, GRID, PLAYER, portrait } from './drivers.js';
import { createSoundtrack } from './soundtrack.js';
import { createTrail } from './trail.js';
import { createDust, dustDensity } from './dust.js';
import { MESSAGES, pick, resultTitle } from './messages.js';

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
 reach+=track.banking?24:14;
 Object.assign(sun.shadow.camera,{left:-reach,right:reach,top:reach,bottom:-reach});
 sun.shadow.camera.updateProjectionMatrix();
}
const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.94 });
const dark = mat('#252c25'), white = mat('#e2dcc0');
function box(w,h,d,material,x=0,y=0,z=0,parent=scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material); mesh.position.set(x,y,z);
  mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
let track=TRACKS[0],world=createWorld(scene,track);fitShadows();
const startT=.035;
const at=(t,lane=0)=>world.at(t,lane);
const random=Math.random;

const colors=DRIVERS.map(d=>d.color);
const TRIM='#252c25';
// One car per driver, and the player is always the amber one.
const driverIndex=c=>c.i;
const gridSlot=i=>GRID.indexOf(i);
// Trim is per car, not shared, so a driver can bring their own two-tone livery.
function carModel(color,index){
 const g=new THREE.Group(),paint=mat(color),glass=mat('#334747'),trim=mat(TRIM);
 box(1.85,.55,3.55,paint,0,.67,0,g);box(1.98,.3,1.1,paint,0,.66,-1.15,g);box(1.98,.3,1.1,paint,0,.66,1.1,g);
 const cabin=box(1.53,.63,1.65,glass,0,1.23,-.23,g);cabin.rotation.x=-.06;
 box(1.58,.12,1.2,paint,0,1.58,-.36,g);
 box(.2,.67,1.67,paint,-.68,1.22,-.2,g);box(.2,.67,1.67,paint,.68,1.22,-.2,g);
 box(1.92,.25,.2,trim,0,.53,1.79,g);box(1.94,.24,.16,trim,0,.52,-1.79,g);
 box(1.4,.19,.06,trim,0,.84,1.79,g);
 for(const x of [-.69,-.32,.32,.69])box(.26,.2,.07,white,x,.86,1.83,g);
 for(const x of [-.66,.66])box(.35,.16,.06,mat('#b23d30'),x,.83,-1.82,g);
 box(2.1,.14,.48,paint,0,1.28,-1.57,g);for(const x of [-.7,.7])box(.1,.4,.1,trim,x,1.03,-1.57,g);
 box(.34,.02,1.15,white,.3,.965,.99,g);box(.14,.02,1.15,mat('#bd5841'),.57,.97,.99,g);
 for(const x of [-1,1])for(const z of [-1.15,1.12]){
 const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.44,.44,.33,12),trim);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.46,z);wheel.castShadow=true;g.add(wheel);
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.35,8),white);hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);g.add(hub);
 }
 const number=document.createElement('canvas');number.width=64;number.height=64;const ctx=number.getContext('2d');ctx.fillStyle='#ece8d5';ctx.fillRect(0,0,64,64);ctx.fillStyle='#26382a';ctx.font='bold 47px monospace';ctx.textAlign='center';ctx.fillText(String(index+1).padStart(2,'0'),32,49);
 const decal=new THREE.Mesh(new THREE.PlaneGeometry(.85,.85),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(number)}));decal.rotation.x=-Math.PI/2;decal.position.set(0,1.65,-.3);g.add(decal);
 scene.add(g);return {g,paint,trim,decal,numberCanvas:number};
}
const cars=colors.map((color,i)=>({ ...carModel(color,i),i,x:0,z:0,vx:0,vz:0,angle:0,t:0,progress:0,nitro:100,air:0,vy:0,jumpCooldown:0,finished:false,finishTime:0}));
const marker=new THREE.Mesh(new THREE.ConeGeometry(.65,1.1,3),new THREE.MeshBasicMaterial({color:'#ffe1a0'}));marker.rotation.z=Math.PI;scene.add(marker);
const trails=cars.map(()=>createTrail(scene));
const dust=createDust(scene,{count:1400});
let state='ready',raceTime=0,countdown=0,keys=new Set(),last=0,accumulator=0,best=null;
function loadBest(){best=null;try{best=Number(localStorage.getItem(`quattro-best-${track.id}-v${track.revision}`))||null;}catch{}}
loadBest();
let audioContext,oscillator,gain,sound=true;
const soundtrack=createSoundtrack($('soundtrack'),`${import.meta.env.BASE_URL}audio/`);
function syncAudio(){const active=sound&&!document.hidden&&document.hasFocus();soundtrack.setPlaying(active&&['countdown','racing','finishing','finished'].includes(state));if(gain)gain.gain.setTargetAtTime(active&&state==='racing'?.018:0,audioContext.currentTime,.1);}
function enableAudio(){if(!audioContext){audioContext=new AudioContext();oscillator=audioContext.createOscillator();oscillator.type='sawtooth';gain=audioContext.createGain();gain.gain.value=0;const filter=audioContext.createBiquadFilter();filter.frequency.value=450;oscillator.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);oscillator.start();}audioContext.resume().catch(()=>{});}
$('sound').onclick=()=>{sound=!sound;if(sound)enableAudio();$('sound').textContent=sound?'SOUND ON ↗':'SOUND OFF ↗';$('sound').setAttribute('aria-label',sound?'Mute sound':'Enable sound');$('sound').setAttribute('aria-pressed',String(sound));syncAudio();};
function reset(){$('results').classList.add('hidden');$('results').classList.remove('is-triumph');quipDriver=-1;$('race-message').textContent='';raceTime=0;keys.clear();cars.forEach((c,i)=>{// Half a car length of stagger inside each row, so the standings read P1..P4.
 const slot=gridSlot(i),t=startT-.022-Math.floor(slot/2)*.026-(slot%2)*.003,p=at(t,slot%2?2:-2),d=world.curve.getTangentAt((t+1)%1);Object.assign(c,{x:p.x,z:p.z,vx:0,vz:0,angle:Math.atan2(d.x,d.z),t:(t+1)%1,progress:t-startT,nitro:100,air:0,vy:0,jumpCooldown:0,finished:false,finishTime:0,surface:track.surface||'gravel'});});dust.clear();trails.forEach(t=>t.clear());$('race-message').textContent='';syncModels();updateHUD();}
function start(){if(sound)enableAudio();soundtrack.beginRace();reset();document.querySelectorAll('.track-card').forEach(b=>b.disabled=true);state='countdown';countdown=3.4;$('overlay').classList.add('hidden');$('status').textContent=pick(MESSAGES.lights);$('pause').textContent='Ⅱ';syncAudio();}
function togglePause(){if(state==='racing'||state==='countdown'||state==='finishing'){state=state==='racing'?'paused':state==='finishing'?'paused-finishing':'paused-countdown';$('countdown').textContent='PAUSED';$('pause').textContent='▶';}else if(state.startsWith('paused')){state=state==='paused'?'racing':state==='paused-finishing'?'finishing':'countdown';$('countdown').textContent='';$('pause').textContent='Ⅱ';if(sound)enableAudio();}syncAudio();soundtrack.retry();}
$('start').onclick=start;$('restart').onclick=start;$('pause').onclick=togglePause;
function trackInfo(){
 document.querySelector('.race-info>span').textContent=`0${TRACKS.indexOf(track)+1} — ${track.name.toUpperCase()}`;
 document.querySelector('.race-info>p').textContent=`4 DRIVERS / 3 LAPS / ${track.biome}`;
 document.querySelector('.difficulty').textContent=`${'● '.repeat(track.difficulty)}${'○ '.repeat(4-track.difficulty)} ${track.rating}`;
 document.querySelector('.track-label').innerHTML=`${track.name.toUpperCase()}<span>${track.layout} · ${track.rating}</span>`;
 document.querySelector('.tip').innerHTML=`${track.rating} · ${track.biome}<span>${track.tip}</span>`;
 $('track-description').textContent=track.tip;
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
$('tracks').innerHTML=TRACKS.map((t,i)=>`<button class="track-card" data-track="${t.id}" aria-label="${t.name}, ${t.layout}, ${t.biome}, difficulty ${t.difficulty} of 4, ${t.rating}" aria-pressed="${i===0}" style="--biome:${t.accent||t.road}"><span class="track-number">0${i+1} / ${t.biome}</span>${coursePreview(t)}<strong>${t.name}</strong><span class="layout-name">${t.layout}</span><span class="track-rating">${'●'.repeat(t.difficulty)}${'○'.repeat(4-t.difficulty)} <b>${t.rating}</b></span></button>`).join('');
for(const b of document.querySelectorAll('.track-card'))b.onclick=()=>selectTrack(b.dataset.track);
$('change-track').onclick=()=>{selectTrack(track.id);$('tracks').scrollIntoView({block:'nearest',behavior:'smooth'});};
trackInfo();
function updateDrivers(){
 for(const c of cars){const d=DRIVERS[driverIndex(c)],ctx=c.numberCanvas.getContext('2d');
  ctx.fillStyle=d.trim||'#ece8d5';ctx.fillRect(0,0,64,64);ctx.fillStyle=d.trim?d.color:'#26382a';ctx.fillText(String(driverIndex(c)+1).padStart(2,'0'),32,49);c.decal.material.map.needsUpdate=true;
  c.paint.color.set(d.color);c.trim.color.set(d.trim||TRIM);
  // The locked ace drives to his own, quicker limits; everyone else shares one.
  c.skill=d.skill||1;}
 $('driver-strip').innerHTML=cars.map(c=>{const d=DRIVERS[driverIndex(c)];return `<span class="driver-chip" style="--driver:${d.color}">${portrait(driverIndex(c))}<span>${d.name}<small>${c.i===PLAYER?'YOU':d.ace?'ACE':'RIVAL'}</small></span></span>`;}).join('');
}
// Nobody picks a car: the grid is fixed, quickest away first and you last.
$('lineup').innerHTML=GRID.map((i,slot)=>{const d=DRIVERS[i];
 return `<div class="grid-slot${i===PLAYER?' is-player':''}" style="--driver:${d.color}"><span class="grid-place">P${slot+1}</span>${portrait(i)}<strong>${d.name}</strong><span class="grid-role">${i===PLAYER?'YOU':d.ace?'ACE':'RIVAL'}</span></div>`;}).join('');
$('lineup').setAttribute('aria-label',`Starting grid: ${GRID.map((i,slot)=>`P${slot+1} ${DRIVERS[i].name}`).join(', ')}`);
updateDrivers();
$('replay').onclick=start;
$('next-track').onclick=()=>selectTrack(TRACKS[(TRACKS.indexOf(track)+1)%TRACKS.length].id);
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='Enter'&&(state==='ready'||state==='finished'||state==='finishing'))start();if(e.code==='KeyP'||e.code==='Escape')togglePause();if(e.code==='KeyR')start();});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();if(state==='racing'||state==='countdown'||state==='finishing')togglePause();syncAudio();});
addEventListener('focus',syncAudio);
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(state==='racing'||state==='countdown'||state==='finishing')togglePause();}syncAudio();});
for(const b of document.querySelectorAll('#touch button')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);};for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(b.dataset.key));}
// Loose surfaces throw up a rolling cloud behind the wheels, thick enough on
// the dirt courses that a pack of cars can smear the track behind them. Sliding,
// boosting and landing all cost extra dust.
const dustDebt=cars.map(()=>0);
function kickUpDust(c,dt,speed,slip,fx,fz,surface,boosting){
 const density=dustDensity(c.surface),ground=track.banking?world.roadFrame(c.x,c.z,c.t).height:0;
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
 if(state==='countdown'){countdown-=dt;$('countdown').textContent=countdown>.4?Math.ceil(countdown-.4):'GO!';if(countdown<=0){state='racing';$('countdown').textContent='';$('status').textContent=pick(MESSAGES.racing);}return;}
 if(state!=='racing'&&state!=='finishing')return;
 raceTime+=dt;
 for(const c of cars){
  let controls;
  if(c.i===0&&!c.finished){
    const throttle=keys.has('ArrowUp')||keys.has('KeyW')?1:0;
    controls={throttle,brake:keys.has('ArrowDown')||keys.has('KeyS'),steer:(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)-(keys.has('ArrowRight')||keys.has('KeyD')?1:0),boost:keys.has('Space')&&throttle>0};
  }else controls=aiControls(c,world,track,cars);
  const {speed,fx,fz,surface}=driveCar(c,world,track,dt,controls);
  if(c.progress>=3&&!c.finished){c.finished=true;c.finishTime=raceTime;if(c.i===PLAYER)finish();}
  const slip=Math.abs(c.vx*fz-c.vz*fx);
  // A sliding or boosting car scrubs a heavier mark than one just rolling.
  if(speed>2.5&&c.air<.2)trails[c.i].sample(c.x-fx*1.2,c.z-fz*1.2,c.angle,c.surface,Math.min(.85,.3+slip*.06+(controls.boost&&c.nitro>0?.15:0)),track.banking?(x,z)=>world.roadFrame(x,z).height:undefined);
  kickUpDust(c,dt,speed,slip,fx,fz,surface,controls.boost&&c.nitro>0);
 }
 collideCars(cars);
 if(state==='finishing'){
  if(cars.every(c=>c.finished)||raceTime-cars[0].finishTime>=25){state='finished';$('status').textContent=pick(MESSAGES.final);}
  renderResults();
 }
 for(const t of trails)t.fade(dt);
 dust.update(dt);
}
function position(){return raceStandings(cars).findIndex(c=>c.i===0)+1;}
let resultOrder='',resultRows='',lastResultUpdate=-1,podiumLines=[],graceLine='',quipLine='',quipDriver=-1,beatAce=false;
function renderResults(){
 if(state==='finishing'&&raceTime-lastResultUpdate<.25&&resultOrder)return;
 lastResultUpdate=raceTime;
 const ordered=raceStandings(cars),order=ordered.map(c=>c.i).join('');
 if(order!==resultOrder){
  resultOrder=order;
  $('podium').innerHTML=[1,0,2].map(place=>{const c=ordered[place],d=DRIVERS[driverIndex(c)];return `<div class="podium-driver place-${place+1}" style="--driver:${d.color}"><div class="celebrant"><span class="podium-prop" aria-hidden="true">${['🏆','🧇','🔧'][place]}</span>${portrait(driverIndex(c))}</div><strong>${d.name}${c.i===0?' <small>YOU</small>':''}</strong><div class="podium-block"><b>0${place+1}</b><span>${podiumLines[place]}</span></div></div>`;}).join('');
 }
 const rows=ordered.map((c,i)=>`<div class="result-row ${c.i===0?'is-player':''}"><b>0${i+1}</b>${portrait(driverIndex(c))}<span>${DRIVERS[driverIndex(c)].name}${c.i===0?' · YOU':''}</span><time>${c.finished?formatTime(c.finishTime):state==='finished'?'DNF':`LAP ${Math.min(3,Math.floor(Math.max(0,c.progress))+1)} · RACING`}</time></div>`).join('');
 if(rows!==resultRows){$('result-times').innerHTML=rows;resultRows=rows;}
 const last=driverIndex(ordered[3]);
 if(last!==quipDriver){quipDriver=last;quipLine=`P4 · ${DRIVERS[last].name}: ${pick(DRIVERS[last].quips)}`;}
 $('results-quip').textContent=state==='finishing'?graceLine:quipLine;
}
function finish(){
 state='finishing';const rank=position(),time=cars[PLAYER].finishTime;
 // Beating the ace outranks the finishing position: the screen changes, and so
 // does the music. He has not crossed the line yet if the player got there first.
 beatAce=!cars.some(c=>DRIVERS[driverIndex(c)].ace&&c.finished);
 podiumLines=MESSAGES.podium.map(lines=>pick(lines));graceLine=pick(MESSAGES.grace);
 if(best===null||time<best){best=time;try{localStorage.setItem(`quattro-best-${track.id}-v${track.revision}`,String(best));}catch{}}
 keys.clear();$('race-message').textContent='';$('results').classList.remove('hidden');
 $('results-stage').textContent=beatAce?`${track.name.toUpperCase()} · THE ACE IS BEATEN`:`${track.name.toUpperCase()} · CHEQUERED FLAG`;
 $('results-title').textContent=resultTitle(rank,beatAce);
 $('results-summary').textContent=`${formatTime(time)} · PERSONAL BEST ${formatTime(best)}`;
 $('results').classList.toggle('is-triumph',beatAce);
 soundtrack.finale(beatAce);
 resultOrder='';resultRows='';renderResults();
 const flakes=beatAce?46:24,palette=beatAce?['#9ece6a','#e9b85d','#f4efdb','#7fd6a2']:colors;
 $('results').querySelector('.confetti').innerHTML=Array.from({length:flakes},(_,i)=>`<i style="--x:${(i*43)%100}%;--delay:${i*(beatAce?.07:.13)}s;--color:${palette[i%palette.length]}"></i>`).join('');
 $('status').textContent=pick(MESSAGES.flag);$('replay').focus({preventScroll:true});
 document.querySelectorAll('.track-card').forEach(b=>b.disabled=false);
}
const roadPose=new THREE.Matrix4(),roadForward=new THREE.Vector3(),roadRight=new THREE.Vector3();
function syncModels(){
 for(const c of cars){
  if(track.banking){
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
 marker.position.set(cars[0].x,cars[0].g.position.y+3.3,cars[0].z);
}
function updateHUD(){if(state==='racing')$('race-message').textContent=cars[0].surface&&cars[0].surface!==(track.surface||'gravel')?SURFACES[cars[0].surface].label:'';$('position').innerHTML=`0${position()}<span>/ 04</span>`;$('lap').innerHTML=`0${Math.min(3,Math.floor(Math.max(0,cars[0].progress))+1)}<span>/ 03</span>`;$('time').textContent=formatTime(cars[0].finished?cars[0].finishTime:raceTime);$('speed').textContent=Math.round(Math.hypot(cars[0].vx,cars[0].vz)*5);$('nitro-fill').style.width=`${cars[0].nitro}%`;}
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
 if(track.banking)for(let i=0;i<120;i++)for(const lane of [-track.width/2-1,track.width/2+1]){
  const p=world.at(i/120,lane);include(p.x,p.y+4,p.z);
 }
 for(const p of world.framingPoints)include(p.x,p.y,p.z);
 if(track.id==='garage')for(const x of [-57,57])for(const z of [-41,41])include(x,6,z);
 if(track.id==='gravel')for(const x of [-36,36])include(x,4,-40);
 const cx=(bounds.min.x+bounds.max.x)/2,cy=(bounds.min.y+bounds.max.y)/2;
 const halfW=Math.max((bounds.max.x-bounds.min.x)/2+3,((bounds.max.y-bounds.min.y)/2+3)*aspect),halfH=halfW/aspect;
 Object.assign(camera,{left:cx-halfW,right:cx+halfW,top:cy+halfH,bottom:cy-halfH});
 camera.updateProjectionMatrix();renderer.setSize(w,h);
 dust.setScale(renderer.domElement.height/(camera.top-camera.bottom));
}
new ResizeObserver(resize).observe(viewport);resize();reset();
renderer.setAnimationLoop(now=>{const dt=last?Math.min((now-last)/1000,.1):0;last=now;accumulator+=dt;while(accumulator>=1/60){step(1/60);accumulator-=1/60;}syncModels();updateHUD();syncAudio();if(gain){oscillator.frequency.setTargetAtTime(45+Math.hypot(cars[0].vx,cars[0].vz)*8,audioContext.currentTime,.08);}renderer.render(scene,camera);});
// Read-only telemetry for smoke tests and debugging.
window.quattro={get track(){return track.id;},get state(){return state;},get raceTime(){return raceTime;},get cars(){return cars.map(c=>({driver:DRIVERS[driverIndex(c)].name,x:c.x,z:c.z,angle:c.angle,progress:c.progress,nitro:c.nitro,air:c.air,finished:c.finished,finishTime:c.finishTime,surface:c.surface}));},get drawCalls(){return renderer.info.render.calls;},get dust(){return dust.live;},get marks(){return trails.map(t=>t.length);}};
