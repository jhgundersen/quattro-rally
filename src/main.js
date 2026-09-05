import * as THREE from 'three';
import './style.css';
import { wrap, advanceProgress, formatTime, TAU } from './race.js';

const $ = (id) => document.getElementById(id);
const viewport = $('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#74795c');
const camera = new THREE.OrthographicCamera(-54, 54, 32, -32, 0.1, 300);
camera.position.set(0, 92, 69); camera.lookAt(0, 0, 0);
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
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, {left:-65,right:65,top:50,bottom:-50});
sun.shadow.bias = -0.001; scene.add(sun);
const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.94 });
const soil = mat('#9a8860'), grass = mat('#727b50'), dark = mat('#252c25'), white = mat('#e2dcc0');
function box(w,h,d,material,x=0,y=0,z=0,parent=scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material); mesh.position.set(x,y,z);
  mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
box(126,1,94,grass,0,-0.65,0);
const curve = new THREE.CatmullRomCurve3([
  [-33,0,16],[-38,0,0],[-30,0,-20],[-10,0,-23],[5,0,-15],[28,0,-21],[39,0,-8],[34,0,13],[16,0,22],[-7,0,18],[-22,0,24],
].map(p=>new THREE.Vector3(...p)),true,'catmullrom',0.35);
const N=640, width=10.2;
const points=Array.from({length:N},(_,i)=>curve.getPointAt(i/N));
const tangents=Array.from({length:N},(_,i)=>curve.getTangentAt(i/N));
function at(t,lane=0) { const p=curve.getPointAt((t%1+1)%1), d=curve.getTangentAt((t%1+1)%1); return p.add(new THREE.Vector3(-d.z,0,d.x).multiplyScalar(lane)); }
function ribbon(offsetA,offsetB,material,y=0.01) {
  const vertices=[],indices=[];
  for(let i=0;i<=N;i++) for(const offset of [offsetA,offsetB]) { const p=at(i/N,offset); vertices.push(p.x,y,p.z); }
  for(let i=0;i<N;i++){let a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
  const m=new THREE.Mesh(g,material);m.receiveShadow=true;scene.add(m);
}
ribbon(-width/2,width/2,soil);
ribbon(-2.5,-1.4,mat('#92805b'),.025);ribbon(1.4,2.5,mat('#92805b'),.025);
const random=(()=>{let seed=41;return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};})();
for(let i=0;i<185;i++){
  const t=i/185;
  for(const side of [-1,1]){
    if(i%9===0)continue;
    const p=at(t,side*6.2);
    const tire=new THREE.Mesh(new THREE.CylinderGeometry(.63,.65,.6,10),i%7<3?white:dark);
    tire.position.set(p.x,.3,p.z); tire.castShadow=true;scene.add(tire);
  }
}
for(let i=0;i<330;i++){
 const p=at(random(),(random()-.5)*width);const pebble=box(.09+random()*.18,.04,.13,mat(i%2?'#b19c73':'#86764f'),p.x,.045,p.z);pebble.rotation.y=random()*TAU;
}
// A pair of broad dirt ramps, with chevrons marking the takeoff.
const jumpTs=[.23,.69];
for(const t of jumpTs){const p=at(t),d=curve.getTangentAt(t);const ramp=box(9,.58,3,mat('#ae9467'),p.x,.22,p.z);ramp.rotation.y=Math.atan2(d.x,d.z);ramp.rotation.x=.12;
 for(let j=-3;j<=3;j+=1.5){const mark=box(.13,.035,1.2,white,j,.34,.1,ramp);mark.rotation.y=.45;}}
const startT=.035;
const startP=at(startT), startD=curve.getTangentAt(startT), startAngle=Math.atan2(startD.x,startD.z);
const line=new THREE.Group();line.position.copy(startP);line.rotation.y=startAngle;scene.add(line);
for(let i=0;i<10;i++)for(let j=0;j<2;j++)box(1,.035,.75,(i+j)%2?dark:white,i-4.5,.06,j*.75-.35,line);
function sign(text,w,h,color='#e6d9ad'){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#28382b';ctx.fillRect(0,0,1024,160);ctx.fillStyle=color;ctx.font='bold 75px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,83);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 return new THREE.Mesh(new THREE.BoxGeometry(w,h,.35),new THREE.MeshStandardMaterial({map:tex,roughness:1}));
}
const banner=sign('QUATTRO  /  RALLY',15,2);banner.position.set(0,5.5,-32);scene.add(banner);box(.3,6,.3,dark,-7,2.7,-32);box(.3,6,.3,dark,7,2.7,-32);
// Spectator terraces and paddock.
for(const side of [-1,1]){
 for(let row=0;row<3;row++){
  box(23,.65,1.6,mat('#6a715a'),side*24,.3+row*.7,-31-row*1.8);
  for(let j=0;j<22;j++){const m=mat(['#c3aa75','#8f9a83','#b4ac94','#4e6259','#d0ba91'][Math.floor(random()*5)]);box(.42,.8,.42,m,side*24-10.5+j,.95+row*.7,-31-row*1.8);}
 }
}
for(let i=0;i<7;i++){
 const x=-19+i*6; const g=new THREE.Group();g.position.set(x,0,34);scene.add(g);
 box(4.5,1.9,3,mat(i%2?'#bdaf86':'#d4c7a1'),0,1.2,0,g);box(4.8,.3,3.3,mat('#4d6256'),0,2.3,0,g);
 for(const x of [-1.5,1.5])box(.7,.7,3.2,dark,x,.4,0,g);
}
for(let i=0;i<22;i++){
 const x=(random()-.5)*25,z=-3-random()*5;
 const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.4+random()*1.5,0),mat('#8b8c6b'));rock.position.set(x,.2,z);rock.scale.y=.7;rock.castShadow=true;scene.add(rock);
}
const centerSign=sign('OMARCHY QUATTRO',20,2.5);centerSign.rotation.x=-Math.PI/2;centerSign.position.set(0,.2,3);scene.add(centerSign);
for(const x of [-49,49])for(const z of [-27,25]){box(.3,10,.3,dark,x,5,z);box(3,.7,.6,white,x,10,z);}

const colors=['#e9b85d','#82ada3','#d46f60','#a0a7d5'];
function carModel(color,index){
 const g=new THREE.Group(),paint=mat(color),glass=mat('#334747');
 box(1.85,.55,3.55,paint,0,.67,0,g);box(1.98,.3,1.1,paint,0,.66,-1.15,g);box(1.98,.3,1.1,paint,0,.66,1.1,g);
 const cabin=box(1.53,.63,1.65,glass,0,1.23,-.23,g);cabin.rotation.x=-.06;
 box(1.58,.12,1.2,paint,0,1.58,-.36,g);
 box(.2,.67,1.67,paint,-.68,1.22,-.2,g);box(.2,.67,1.67,paint,.68,1.22,-.2,g);
 box(1.92,.25,.2,dark,0,.53,1.79,g);box(1.94,.24,.16,dark,0,.52,-1.79,g);
 box(1.4,.19,.06,dark,0,.84,1.79,g);
 for(const x of [-.69,-.32,.32,.69])box(.26,.2,.07,white,x,.86,1.83,g);
 for(const x of [-.66,.66])box(.35,.16,.06,mat('#b23d30'),x,.83,-1.82,g);
 box(2.1,.14,.48,paint,0,1.28,-1.57,g);for(const x of [-.7,.7])box(.1,.4,.1,dark,x,1.03,-1.57,g);
 box(.34,.02,1.15,white,.3,.965,.99,g);box(.14,.02,1.15,mat('#bd5841'),.57,.97,.99,g);
 for(const x of [-1,1])for(const z of [-1.15,1.12]){
 const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.44,.44,.33,12),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.46,z);wheel.castShadow=true;g.add(wheel);
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.35,8),white);hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);g.add(hub);
 }
 const number=document.createElement('canvas');number.width=64;number.height=64;const ctx=number.getContext('2d');ctx.fillStyle='#ece8d5';ctx.fillRect(0,0,64,64);ctx.fillStyle='#26382a';ctx.font='bold 47px monospace';ctx.textAlign='center';ctx.fillText(String(index+1).padStart(2,'0'),32,49);
 const decal=new THREE.Mesh(new THREE.PlaneGeometry(.85,.85),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(number)}));decal.rotation.x=-Math.PI/2;decal.position.set(0,1.65,-.3);g.add(decal);
 scene.add(g);return {g,paint};
}
const cars=colors.map((color,i)=>({ ...carModel(color,i),i,x:0,z:0,vx:0,vz:0,angle:0,t:0,progress:0,nitro:100,air:0,vy:0,jumpCooldown:0,finished:false,finishTime:0}));
const marker=new THREE.Mesh(new THREE.ConeGeometry(.65,1.1,3),new THREE.MeshBasicMaterial({color:'#ffe1a0'}));marker.rotation.z=Math.PI;scene.add(marker);
const dustGeometry=new THREE.IcosahedronGeometry(.24,0);const dust=Array.from({length:100},()=>{const m=new THREE.Mesh(dustGeometry,new THREE.MeshBasicMaterial({color:'#cfb78b',transparent:true,opacity:0,depthWrite:false}));scene.add(m);return {m,life:0};});let dustIndex=0;
let state='ready',raceTime=0,countdown=0,selected=0,keys=new Set(),last=0,accumulator=0,best=null;
try{best=Number(localStorage.getItem('quattro-best'))||null;}catch{}
let audioContext,oscillator,gain,sound=false;
function enableAudio(){if(!audioContext){audioContext=new AudioContext();oscillator=audioContext.createOscillator();oscillator.type='sawtooth';gain=audioContext.createGain();gain.gain.value=0;const filter=audioContext.createBiquadFilter();filter.frequency.value=450;oscillator.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);oscillator.start();}audioContext.resume();}
$('sound').onclick=()=>{enableAudio();sound=!sound;$('sound').textContent=sound?'SOUND ON ↗':'SOUND OFF ↗';};
function nearest(x,z){let idx=0,min=Infinity;for(let i=0;i<N;i++){const p=points[i],d=(p.x-x)**2+(p.z-z)**2;if(d<min){min=d;idx=i;}}return {idx,t:idx/N,distance:Math.sqrt(min),point:points[idx],dir:tangents[idx]};}
function reset(){raceTime=0;keys.clear();cars.forEach((c,i)=>{const t=startT-.022-Math.floor(i/2)*.026,p=at(t,i%2?2:-2),d=curve.getTangentAt((t+1)%1);Object.assign(c,{x:p.x,z:p.z,vx:0,vz:0,angle:Math.atan2(d.x,d.z),t:(t+1)%1,progress:t-startT,nitro:100,air:0,vy:0,jumpCooldown:0,finished:false,finishTime:0});});dust.forEach(p=>{p.life=0;p.m.material.opacity=0;});$('race-message').textContent='';syncModels();updateHUD();}
function start(){reset();state='countdown';countdown=3.4;$('overlay').classList.add('hidden');$('status').textContent='ENGINES READY';$('pause').textContent='Ⅱ';}
function togglePause(){if(state==='racing'||state==='countdown'){state=state==='racing'?'paused':'paused-countdown';$('countdown').textContent='PAUSED';$('pause').textContent='▶';}else if(state.startsWith('paused')){state=state==='paused'?'racing':'countdown';$('countdown').textContent='';$('pause').textContent='Ⅱ';}}
$('start').onclick=start;$('restart').onclick=start;$('pause').onclick=togglePause;
for(const b of document.querySelectorAll('.swatch'))b.onclick=()=>{selected=+b.dataset.color;cars.forEach((c,i)=>c.paint.color.set(colors[(i+selected)%4]));document.querySelectorAll('.swatch').forEach(s=>{s.classList.toggle('selected',s===b);s.setAttribute('aria-pressed',String(s===b));});};
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='Enter'&&(state==='ready'||state==='finished'))start();if(e.code==='KeyP'||e.code==='Escape')togglePause();if(e.code==='KeyR')start();});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();if(state==='racing'||state==='countdown')togglePause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(state==='racing'||state==='countdown')togglePause();}});
for(const b of document.querySelectorAll('#touch button')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);};for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(b.dataset.key));}
function step(dt){
 if(state==='countdown'){countdown-=dt;$('countdown').textContent=countdown>.4?Math.ceil(countdown-.4):'GO!';if(countdown<=0){state='racing';$('countdown').textContent='';$('status').textContent='RACE ON · THREE LAPS TO GLORY';}return;}
 if(state!=='racing')return;
 raceTime+=dt;
 for(const c of cars){
  const near=nearest(c.x,c.z);let throttle=0,steer=0,brake=false,boost=false;
  const speed=Math.hypot(c.vx,c.vz),forward=c.vx*Math.sin(c.angle)+c.vz*Math.cos(c.angle);
  if(c.i===0){throttle=keys.has('ArrowUp')||keys.has('KeyW')?1:0;brake=keys.has('ArrowDown')||keys.has('KeyS');steer=(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)-(keys.has('ArrowRight')||keys.has('KeyD')?1:0);boost=keys.has('Space')&&throttle&&c.nitro>0;}
  else{const target=at(near.t+.034+speed*.0006,(c.i-2)*1.35);const error=wrap(Math.atan2(target.x-c.x,target.z-c.z)-c.angle);steer=THREE.MathUtils.clamp(error*2.2,-1,1);throttle=speed>(16.5+c.i*.6)*(1-Math.min(Math.abs(error)*.23,.45))?0:1;boost=Math.abs(error)<.16&&c.nitro>25&&speed>13;}
  if(c.finished){throttle=.3;boost=false;}
  c.angle+=steer*2.15*Math.min(speed/5,1)*(forward<-.5?-1:1)*(c.air>.1?.25:1)*dt;
  if(brake)throttle=forward>1?-1.8:-.5;
  let acceleration=throttle*12+(boost?17:0);
  if(boost)c.nitro=Math.max(0,c.nitro-30*dt);else c.nitro=Math.min(100,c.nitro+5*dt);
  const fx=Math.sin(c.angle),fz=Math.cos(c.angle),side=c.vx*fz-c.vz*fx;
  const grip=c.air>.1?.15:4.2;
  c.vx+=(fx*acceleration-c.vx*.55-side*fz*grip)*dt;c.vz+=(fz*acceleration-c.vz*.55+side*fx*grip)*dt;
  if(near.distance>width/2){c.vx*=Math.exp(-1.8*dt);c.vz*=Math.exp(-1.8*dt);}
  c.x+=c.vx*dt;c.z+=c.vz*dt;
  if(near.distance>6.1){const nx=(c.x-near.point.x)/near.distance,nz=(c.z-near.point.z)/near.distance;c.x=near.point.x+nx*6;c.z=near.point.z+nz*6;const outward=c.vx*nx+c.vz*nz;if(outward>0){c.vx-=nx*outward*1.4;c.vz-=nz*outward*1.4;}}
  c.jumpCooldown=Math.max(0,c.jumpCooldown-dt);
  if(c.air<=0&&c.jumpCooldown===0&&speed>9&&jumpTs.some(t=>Math.abs(near.t-t)<.009)){c.vy=4+speed*.12;c.jumpCooldown=1.3;}
  c.vy-=16*dt;c.air=Math.max(0,c.air+c.vy*dt);if(c.air===0)c.vy=Math.max(0,c.vy);
  const next=nearest(c.x,c.z).t;c.progress=advanceProgress(c.t,next,c.progress);c.t=next;
  if(c.progress>=3&&!c.finished){c.finished=true;c.finishTime=raceTime;if(c.i===0){finish();break;}}
  if(speed>4&&c.air<.4&&random()<.65){const p=dust[dustIndex++%dust.length];p.life=.65;p.m.position.set(c.x-fx*1.5,.3,c.z-fz*1.5);p.m.scale.setScalar(1);}
 }
 for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){const a=cars[i],b=cars[j];if(Math.abs(a.air-b.air)>1)continue;const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d>0&&d<2){const nx=dx/d,nz=dz/d,push=(2-d)*.5;a.x-=nx*push;a.z-=nz*push;b.x+=nx*push;b.z+=nz*push;const v=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;if(v>0){a.vx-=nx*v*.65;a.vz-=nz*v*.65;b.vx+=nx*v*.65;b.vz+=nz*v*.65;}}}
 for(const p of dust){p.life=Math.max(0,p.life-dt);p.m.material.opacity=p.life*.5;p.m.position.y+=dt*.7;p.m.scale.addScalar(dt*2);}
}
function position(){return 1+cars.filter(c=>c.i!==0&&(c.finished&&(!cars[0].finished||c.finishTime<cars[0].finishTime)||!c.finished&&c.progress>cars[0].progress)).length;}
function finish(){state='finished';const rank=position();if(best===null||raceTime<best){best=raceTime;try{localStorage.setItem('quattro-best',String(best));}catch{}}$('overlay').classList.remove('hidden');$('overlay').querySelector('.eyebrow').textContent='THE GRAVEL PIT · RACE COMPLETE';$('overlay').querySelector('h2').innerHTML=rank===1?'DUST.<br>SETTLED.':`P${rank}.<br>FULL SEND.`;$('overlay').querySelector('p:not(.eyebrow)').innerHTML=`Finished ${rank} of 4 · ${formatTime(raceTime)}<br>Personal best ${formatTime(best)}`;$('colors').style.display='none';$('start').innerHTML='RACE AGAIN <span>↗</span>';$('status').textContent='CHEQUERED FLAG';}
function syncModels(){for(const c of cars){c.g.position.set(c.x,c.air,c.z);c.g.rotation.y=c.angle;c.g.rotation.x=-c.vy*.018;c.g.rotation.z=Math.sin(raceTime*28+c.i)*Math.min(Math.hypot(c.vx,c.vz)*.0015,.035);}marker.position.set(cars[0].x,cars[0].air+3.3,cars[0].z);}
function updateHUD(){$('position').innerHTML=`0${position()}<span>/ 04</span>`;$('lap').innerHTML=`0${Math.min(3,Math.floor(Math.max(0,cars[0].progress))+1)}<span>/ 03</span>`;$('time').textContent=formatTime(raceTime);$('speed').textContent=Math.round(Math.hypot(cars[0].vx,cars[0].vz)*5);$('nitro-fill').style.width=`${cars[0].nitro}%`;}
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight,aspect=w/h;const halfW=Math.max(53,33*aspect),halfH=halfW/aspect;Object.assign(camera,{left:-halfW,right:halfW,top:halfH,bottom:-halfH});camera.updateProjectionMatrix();renderer.setSize(w,h);}
new ResizeObserver(resize).observe(viewport);resize();reset();
renderer.setAnimationLoop(now=>{const dt=last?Math.min((now-last)/1000,.1):0;last=now;accumulator+=dt;while(accumulator>=1/60){step(1/60);accumulator-=1/60;}syncModels();updateHUD();if(gain){gain.gain.setTargetAtTime(sound&&state==='racing'?.025:0,audioContext.currentTime,.1);oscillator.frequency.setTargetAtTime(45+Math.hypot(cars[0].vx,cars[0].vz)*8,audioContext.currentTime,.08);}renderer.render(scene,camera);});
// Read-only telemetry for smoke tests and debugging.
window.quattro={get state(){return state;},get raceTime(){return raceTime;},get cars(){return cars.map(({x,z,progress,nitro,air,finished})=>({x,z,progress,nitro,air,finished}));},get drawCalls(){return renderer.info.render.calls;}};
