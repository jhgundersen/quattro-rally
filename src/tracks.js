export const SURFACES = {
  asphalt: { grip: 6.2, drag: .48, power: 1, color: '#a6a9ad', label: 'ASPHALT' },
  wetMud: { grip: 3.1, drag: .85, power: .86, color: '#674c36', label: 'WET MUD' },
  concrete: { grip: 5.8, drag: .5, power: 1, color: '#b3bcc2', label: 'CONCRETE' },
  oil: { grip: 1.3, drag: .45, power: .9, color: '#716481', label: 'OIL · MIND THE SLIDE' },
  gravel: { grip: 4.2, drag: .55, power: 1, color: '#cfb78b', label: 'GRAVEL' },
  mud: { grip: 2.7, drag: 1.6, power: .72, color: '#74523b', label: 'MUD · HEAVY GOING' },
  water: { grip: 2, drag: 2.1, power: .65, color: '#a2d8db', label: 'WATER · SHALLOW FORD' },
  ice: { grip: 1.05, drag: .38, power: .82, color: '#e4f4fa', label: 'ICE · EASY ON THE STEERING' },
  sand: { grip: 3.5, drag: 1.05, power: .85, color: '#e9c589', label: 'DEEP SAND' },
};
export const TRACKS = [
  { id:'gravel', name:'The Gravel Pit', biome:'QUARRY', difficulty:1, rating:'ROOKIE', width:10.2, aiSpeed:16, seed:41,
    layout:'HORSESHOE BOWL', revision:2, landmark:[-25,0], banner:[0,-34],
    ground:'#727b50', road:'#9a8860', rut:'#92805b', edge:'#e2dcc0', rock:'#8b8c6b', sky:'#74795c', sun:'#ffe2ad', foliage:'#526347', tip:'Launch down the back straight, then brake for the deep infield U-turn.',
    points:[[-38,22],[-43,10],[-43,-16],[-33,-25],[0,-25],[32,-25],[43,-15],[43,15],[33,25],[19,25],[9,17],[9,3],[0,-3],[-9,3],[-9,16],[-19,25],[-30,25]], jumps:[.24,.30,.49],
    patches:[{t:.57,lane:2,type:'mud',length:8,width:4}], obstacles:[{t:.43,lane:-3.7,type:'rock',radius:.85}] },
  { id:'forest', name:'Black Pine Run', biome:'FOREST', difficulty:2, rating:'CLUBMAN', width:9.6, aiSpeed:17, seed:82,
    layout:'TWIN HAIRPINS', revision:2, landmark:[-29,1], banner:[0,-35],
    ground:'#385b47', road:'#9c8968', rut:'#897657', edge:'#bdc7a5', rock:'#697b69', sky:'#486452', sun:'#d9ead4', foliage:'#214839', tip:'A fast outer sweep feeds two back-to-back hairpins. Cross the ford, then turn hard.',
    points:[[-40,24],[-44,14],[-44,-18],[-35,-26],[0,-26],[35,-26],[44,-17],[44,6],[44,17],[36,22],[28,17],[28,6],[28,-2],[20,-7],[12,-2],[12,16],[4,21],[-4,16],[-4,-2],[-12,-7],[-20,-2],[-20,16],[-28,24]], jumps:[.17,.22,.37],
    patches:[{t:.07,lane:0,type:'water',length:7,width:11},{t:.42,lane:1.8,type:'mud',length:8,width:5},{t:.76,lane:-1.5,type:'mud',length:6,width:5}],
    obstacles:[{t:.28,lane:-3.5,type:'tree',radius:.8},{t:.59,lane:3.5,type:'tree',radius:.8},{t:.89,lane:-3.5,type:'log',radius:1}] },
  { id:'desert', name:'Red Rock Scramble', biome:'DESERT', difficulty:3, rating:'PRO', width:9, aiSpeed:18.2, seed:126,
    layout:'CANYON SWITCHBACK', revision:2, landmark:[-4,-18], banner:[0,-35],
    ground:'#ba8254', road:'#e0b777', rut:'#cfa269', edge:'#ebd2a0', rock:'#a65c40', sky:'#bc8b64', sun:'#ffddad', foliage:'#61734c', tip:'Three parallel straights, two 180s, and a jump rhythm section. Brake before the switchbacks.',
    points:[[-28,26],[-40,26],[-46,17],[-40,8],[-25,8],[0,8],[21,8],[26.5,0],[21,-8],[0,-8],[-26,-8],[-33.5,-17],[-26,-26],[0,-26],[33,-26],[44,-16],[44,16],[34,26],[5,26]], jumps:[.145,.185,.58,.63],
    patches:[{t:.41,lane:0,type:'sand',length:10,width:10},{t:.86,lane:1,type:'sand',length:10,width:6}],
    obstacles:[{t:.23,lane:2.7,type:'rock',radius:1.1},{t:.39,lane:-2.8,type:'rock',radius:1.05},{t:.74,lane:2.8,type:'rock',radius:1.15},{t:.93,lane:-2.8,type:'rock',radius:1}] },
  { id:'alpine', name:'Frostbite Pass', biome:'ALPINE', difficulty:4, rating:'EXPERT', width:8.6, aiSpeed:19, seed:204,
    layout:'FROZEN CLOVERLEAF', revision:2, landmark:[-4,0], banner:[24,-28],
    ground:'#b5cbd0', road:'#d9ded3', rut:'#bfcec9', edge:'#f4f1de', rock:'#75888e', sky:'#a6bfc9', sun:'#e4efff', foliage:'#476967', tip:'Four lobes and constant direction changes. Settle the car before each icy turn.',
    points:[[-40,9],[-45,0],[-40,-9],[-23,-9],[-13,-19],[-13,-26],[-4,-33],[5,-26],[5,-19],[15,-9],[33,-9],[39,0],[33,9],[15,9],[5,19],[5,26],[-4,33],[-13,26],[-13,19],[-23,9]], jumps:[.14,.40,.64],
    patches:[{t:.20,lane:0,type:'ice',length:7,width:9},{t:.48,lane:0,type:'ice',length:7,width:9},{t:.72,lane:1,type:'water',length:5,width:5},{t:.90,lane:0,type:'ice',length:7,width:9}],
    obstacles:[{t:.34,lane:2.9,type:'tree',radius:.8},{t:.59,lane:-2.9,type:'rock',radius:1},{t:.85,lane:2.9,type:'tree',radius:.8}] },
  { id:'garage', name:'Maximum Parking', biome:'PARKING GARAGE', difficulty:3, rating:'PRO', width:9, aiSpeed:21, seed:305,
    layout:'CONCRETE PAPERCLIP', revision:1, surface:'concrete', landmark:[0,1], banner:[0,-37],
    ground:'#78848a', road:'#505c66', rut:'#54616b', edge:'#f4ce69', rock:'#a2aeb5', sky:'#495866', sun:'#deebff', foliage:'#71868b', tip:'No ticket. No speed limit. Thread the parking aisles, jump the ramps, and dodge the oil.',
    points:[[-44,26],[-44,0],[-44,-26],[0,-29],[44,-26],[44,0],[44,26],[12,26],[12,8],[28,8],[28,-10],[0,-10],[-26,-10],[-26,10],[-8,10],[-8,26]],
    jumps:[.20,.49], patches:[{t:.37,lane:1.8,type:'oil',length:8,width:4},{t:.80,lane:-2,type:'oil',length:6,width:3}],
    obstacles:[{t:.13,lane:3,type:'cone',radius:.65},{t:.61,lane:-3,type:'cone',radius:.65}] },
  { id:'bog', name:'The Bog', biome:'MUDLANDS', difficulty:3, rating:'PRO', width:9, aiSpeed:19, seed:416,
    layout:'CROSSOVER FIGURE EIGHT', revision:1, surface:'wetMud', crossings:[{x:0,z:0,radius:12}], landmark:[-29,0], banner:[0,-35],
    ground:'#4c5034', road:'#715039', rut:'#493322', edge:'#d5bc79', rock:'#655b43', sky:'#686951', sun:'#e8d1a0', foliage:'#596541',
    tip:'Follow the arrows through both loops. Boost off the crossing ramp to clear traffic; turning at the X cannot skip a loop.',
    points:[[-44,0],[-44,-26],[-24,-26],[0,0],[24,26],[44,26],[44,0],[44,-26],[24,-26],[0,0],[-24,26],[-44,26]],
    jumps:[.225], patches:[{t:.06,lane:2,type:'mud',length:15,width:5},{t:.40,lane:-2,type:'mud',length:17,width:5},{t:.61,lane:2,type:'water',length:9,width:4},{t:.88,lane:-2,type:'mud',length:16,width:5}],
    obstacles:[{t:.12,lane:3,type:'log',radius:.8},{t:.57,lane:-3,type:'rock',radius:.8}] },
  { id:'lemans', name:'Le Mans', biome:'ENDURANCE CIRCUIT', difficulty:3, rating:'PRO', width:7.2, aiSpeed:23, seed:524,
    layout:'CIRCUIT DE LA SARTHE', accent:'#d4bd60', revision:2, surface:'asphalt', landmark:[-10,1], banner:[3,-33],
    ground:'#658052', road:'#454c52', rut:'#40474d', edge:'#e6ce56', rock:'#b5af96', sky:'#889b95', sun:'#fff0cf', foliage:'#365d41',
    tip:'A miniature salute to Le Mans. Attack the two Mulsanne chicanes, brake for Arnage, then flow through the Porsche Curves.',
    points:[[-36,8],[-45,4],[-51,-5],[-45,-14],[-54,-22],[-53,-36],[-39,-36],[-28,-33],[-25,-13],[-12,-13],[-9,-31],[6,-29],[8,-8],[22,-8],[26,-22],[40,-17],[56,-1],[51,16],[38,23],[30,23],[27,37],[12,36],[7,16],[-5,17],[-11,32],[-24,27],[-25,16],[-34,14]],
    jumps:[], patches:[], obstacles:[] },
];
export function surfaceAt(x,z,air,patches,base='gravel') {
  if(air>.4)return base;
  for(const p of patches){const dx=x-p.x,dz=z-p.z;const along=dx*p.dx+dz*p.dz,across=-dx*p.dz+dz*p.dx;if((along/(p.length/2))**2+(across/(p.width/2))**2<=1)return p.type;}
  return base;
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
