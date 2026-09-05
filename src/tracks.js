export const SURFACES = {
  gravel: { grip: 4.2, drag: .55, power: 1, color: '#cfb78b', label: 'GRAVEL' },
  mud: { grip: 2.7, drag: 1.6, power: .72, color: '#74523b', label: 'MUD · HEAVY GOING' },
  water: { grip: 2, drag: 2.1, power: .65, color: '#a2d8db', label: 'WATER · SHALLOW FORD' },
  ice: { grip: 1.05, drag: .38, power: .82, color: '#e4f4fa', label: 'ICE · EASY ON THE STEERING' },
  sand: { grip: 3.5, drag: 1.05, power: .85, color: '#e9c589', label: 'DEEP SAND' },
};
export const TRACKS = [
  { id:'gravel', name:'The Gravel Pit', biome:'QUARRY', difficulty:1, rating:'ROOKIE', width:10.2, aiSpeed:16, seed:41,
    ground:'#727b50', road:'#9a8860', rut:'#92805b', edge:'#e2dcc0', rock:'#8b8c6b', sky:'#74795c', sun:'#ffe2ad', foliage:'#526347', tip:'Wide turns and forgiving gravel. Learn the line, then send it.',
    points:[[-33,16],[-38,0],[-30,-20],[-10,-23],[5,-15],[28,-21],[39,-8],[34,13],[16,22],[-7,18],[-22,24]], jumps:[.23,.69],
    patches:[{t:.48,lane:2,type:'mud',length:7,width:4}], obstacles:[{t:.77,lane:-3.7,type:'rock',radius:.85}] },
  { id:'forest', name:'Black Pine Run', biome:'FOREST', difficulty:2, rating:'CLUBMAN', width:9.6, aiSpeed:17, seed:82,
    ground:'#385b47', road:'#9c8968', rut:'#897657', edge:'#bdc7a5', rock:'#697b69', sky:'#486452', sun:'#d9ead4', foliage:'#214839', tip:'Pick a dry line through the mud. The blue ford crosses the whole road.',
    points:[[-35,18],[-39,-3],[-29,-21],[-8,-24],[7,-12],[28,-21],[39,-4],[28,12],[15,24],[-5,14],[-23,24]], jumps:[.29,.75],
    patches:[{t:.18,lane:0,type:'water',length:7,width:11},{t:.43,lane:1.8,type:'mud',length:12,width:5},{t:.8,lane:-1.5,type:'mud',length:9,width:5}],
    obstacles:[{t:.36,lane:-3.5,type:'tree',radius:.8},{t:.65,lane:3.5,type:'tree',radius:.8},{t:.88,lane:-3.5,type:'log',radius:1}] },
  { id:'desert', name:'Red Rock Scramble', biome:'DESERT', difficulty:3, rating:'PRO', width:9, aiSpeed:18.2, seed:126,
    ground:'#ba8254', road:'#e0b777', rut:'#cfa269', edge:'#ebd2a0', rock:'#a65c40', sky:'#bc8b64', sun:'#ffddad', foliage:'#61734c', tip:'Carry speed through sand. Leave room for boulders on the racing line.',
    points:[[-34,20],[-39,-2],[-25,-23],[-9,-12],[9,-23],[33,-20],[39,-1],[26,7],[34,22],[10,21],[-6,11],[-22,24]], jumps:[.2,.52,.81],
    patches:[{t:.31,lane:0,type:'sand',length:13,width:10},{t:.7,lane:1,type:'sand',length:10,width:6}],
    obstacles:[{t:.15,lane:2.7,type:'rock',radius:1.1},{t:.44,lane:-2.8,type:'rock',radius:1.05},{t:.64,lane:2.8,type:'rock',radius:1.15},{t:.9,lane:-2.8,type:'rock',radius:1}] },
  { id:'alpine', name:'Frostbite Pass', biome:'ALPINE', difficulty:4, rating:'EXPERT', width:8.6, aiSpeed:19, seed:204,
    ground:'#b5cbd0', road:'#d9ded3', rut:'#bfcec9', edge:'#f4f1de', rock:'#75888e', sky:'#a6bfc9', sun:'#e4efff', foliage:'#476967', tip:'Ice keeps you sliding. Lift before the corner; save nitro for dry straights.',
    points:[[-34,19],[-40,-3],[-29,-22],[-12,-16],[2,-24],[18,-13],[35,-21],[39,0],[26,20],[8,11],[-8,24],[-24,14]], jumps:[.36,.72],
    patches:[{t:.17,lane:0,type:'ice',length:11,width:10},{t:.45,lane:0,type:'ice',length:10,width:10},{t:.62,lane:1,type:'water',length:5,width:5},{t:.83,lane:0,type:'ice',length:12,width:10}],
    obstacles:[{t:.29,lane:2.9,type:'tree',radius:.8},{t:.56,lane:-2.9,type:'rock',radius:1},{t:.94,lane:2.9,type:'tree',radius:.8}] },
];
export function surfaceAt(x,z,air,patches) {
  if(air>.4)return 'gravel';
  for(const p of patches){const dx=x-p.x,dz=z-p.z;const along=dx*p.dx+dz*p.dz,across=-dx*p.dz+dz*p.dx;if((along/(p.length/2))**2+(across/(p.width/2))**2<=1)return p.type;}
  return 'gravel';
}
export function collideObstacle(car,obstacle) {
  if(car.air>obstacle.height)return false;
  let dx=car.x-obstacle.x,dz=car.z-obstacle.z;const d=Math.hypot(dx,dz),limit=obstacle.radius+.95;
  if(d>=limit)return false;
  if(d<.001){dx=1;dz=0;}else{dx/=d;dz/=d;}
  car.x=obstacle.x+dx*limit;car.z=obstacle.z+dz*limit;
  const inward=car.vx*dx+car.vz*dz;if(inward<0){car.vx-=dx*inward*1.35;car.vz-=dz*inward*1.35;}
  return true;
}
