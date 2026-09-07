// The player always drives the amber car at index PLAYER; the rest are AI.
// Skill scales their pace, and it also sets the grid: quickest on pole, the
// player at the back with work to do. DHH is the ace nobody catches easily.
export const PLAYER = 0;
export const DRIVERS = [
  {name:'Player', nickname:'THE WAFFLE ROCKET', color:'#e9b85d', face:0, quips:['Powered by waffles. Brakes sold separately.','Insists the barrier moved first.','Has a plan for lap two. It is more nitro.','Drove the whole race with the handbrake on. Allegedly.']},
  {name:'Ryan', nickname:'THE FRAME RATE', color:'#82ada3', face:1, quips:['Ships the overtake, patches the apex later.','Says the corner worked fine on his machine.','Refactored the racing line mid-lap.','Would like to open an issue about that kerb.'], skill:1.55},
  {name:'Bjarne', nickname:'ONE MORE COFFEE', color:'#d46f60', face:2, quips:['Raised an eyebrow at the whole third lap.','Finished the coffee before the cool-down lap.','Calls that overtake undefined behaviour.','Was promised a smoother surface than this.'], skill:1.4},
  // Omarchy green over Tokyo-night ink, sampled from the Omarchy wordmark.
  {name:'DHH', nickname:'THE FLYING DANE', color:'#9ece6a', trim:'#1a1b26', face:3, quips:['Says the whole race could have been a hairpin.','Already writing a post about the apex.','Won it on lap one, drove the rest for the photos.','Suggests the rest of you try convention over configuration.'], ace:true, skill:2.2},
];
// Starting order: the quickest car leads the field away, the player is last.
export const GRID = DRIVERS.map((d,i)=>i).sort((a,b)=>(DRIVERS[b].skill||0)-(DRIVERS[a].skill||0));
// Faces are separate from liveries: online drivers keep the colour of the seat
// they sit in and bring whichever face they picked in the lobby. The first four
// are the faces the solo field has always worn; the rest are for the picker.
export const FACES = [
 {name:'ROOKIE', skin:'#e9b58e', details:
  '<path d="M29 45q7-8 13 0q7-8 13 0q-7 9-13 2q-7 7-13-2" fill="#70462e"/>'},
 // Dark rectangular frames and a neat goatee.
 {name:'SPECS', skin:'#efc7a0', details:
  '<rect x="24" y="30" width="16" height="12" rx="3" fill="none" stroke="#2b2f36" stroke-width="2.5"/>'+
  '<rect x="44" y="30" width="16" height="12" rx="3" fill="none" stroke="#2b2f36" stroke-width="2.5"/>'+
  '<path d="M40 35h4" stroke="#2b2f36" stroke-width="2.5"/>'+
  '<path d="M33 45q9-3 18 0l-1 4q-8-2-16 0z" fill="#3f342e"/>'+
  '<path d="M35 51h14q0 9-7 9t-7-9z" fill="#3f342e"/>'+
  '<path d="M37 50q5 3 10-1" fill="none" stroke="#8c5a44" stroke-width="2" stroke-linecap="round"/>'},
 // Clean-shaven head under the helmet, grey stubble, and one raised eyebrow.
 {name:'CHROME DOME', skin:'#e8c4a2', details:
  '<path d="M24 44q18 7 36 0v2q0 14-18 14t-18-14z" fill="#8d8377"/>'+
  '<path d="M33 44q9-3 18 0l-1 4q-8-2-16 0z" fill="#6f665c"/>'+
  '<path d="M38 52q4 2 8 0-2 4-4 4t-4-4z" fill="#4a423b"/>'+
  '<path d="M28 33q6-2 11 0" stroke="#5b5148" stroke-width="2.5" fill="none" stroke-linecap="round"/>'+
  '<path d="M45 29q6-3 11 2" stroke="#5b5148" stroke-width="2.5" fill="none" stroke-linecap="round"/>'+
  '<path d="M36 50q6 2 11-2" fill="none" stroke="#4a423b" stroke-width="2" stroke-linecap="round"/>'},
 // Long auburn waves under the helmet, a grey-flecked beard and a wide grin.
 {name:'THE MANE', skin:'#f0cbaa', details:
  '<path d="M17 33c-5 10-7 24-4 35 4-1 8-7 9-15 1-7-1-14-5-20zm50 0c5 10 7 24 4 35-4-1-8-7-9-15-1-7 1-14 5-20z" fill="#8b5a34"/>'+
  '<path d="M24 44q18 8 36 0v2q0 14-18 14t-18-14z" fill="#7a5638"/>'+
  '<path d="M27 52h30q-3 8-15 8t-15-8z" fill="#bdb2a0" opacity=".45"/>'+
  '<path d="M32 47q10 8 20 0-4 10-10 10t-10-10z" fill="#f6f1e2" stroke="#4f3626" stroke-width="1.5" stroke-linejoin="round"/>'+
  '<circle cx="33" cy="36" r="1.6" fill="#5d86a8"/><circle cx="51" cy="36" r="1.6" fill="#5d86a8"/>'+
  '<path d="M28 31q6-3 11 1m6 0q5-4 11-1" stroke="#7a5334" stroke-width="2.5" fill="none" stroke-linecap="round"/>'},
 // A moustache with its own aerodynamics package.
 {name:'HANDLEBAR', skin:'#e0ad84', details:
  '<path d="M42 47q-5-4-11-2-4 1-4 4 6 3 11 0 2-1 4-1t4 1q5 3 11 0 0-3-4-4-6-2-11 2z" fill="#4a3524"/>'+
  '<path d="M35 54q7 3 14 0" fill="none" stroke="#7a4a30" stroke-width="2" stroke-linecap="round"/>'+
  '<path d="M27 31q6-3 12 0m6 0q6-3 12 0" fill="none" stroke="#4a3524" stroke-width="2.5" stroke-linecap="round"/>'},
 // Mirrored aviators, worn indoors, at night, in the rain.
 {name:'SHADES', skin:'#c98d63', details:
  '<path d="M24 30h34v3l-1 1v3q0 7-7 7t-8-7v-2h-2v2q0 7-8 7t-7-7v-3l-1-1z" fill="#1d232a"/>'+
  '<path d="M28 34l3 8" stroke="#93b9d1" stroke-width="1.6" opacity=".65" stroke-linecap="round"/>'+
  '<path d="M46 34l3 8" stroke="#93b9d1" stroke-width="1.6" opacity=".65" stroke-linecap="round"/>'+
  '<path d="M35 51q7 3 13-2" fill="none" stroke="#70462e" stroke-width="2" stroke-linecap="round"/>'},
 // One hand on the wheel, one bubble the size of the windscreen.
 {name:'BUBBLEGUM', skin:'#f2cfae', details:
  '<circle cx="56" cy="54" r="10" fill="#ef9ec0" opacity=".9"/>'+
  '<circle cx="52" cy="50" r="2.4" fill="#fff5f8" opacity=".7"/>'+
  '<path d="M38 50q5 3 8 1" fill="none" stroke="#70462e" stroke-width="2" stroke-linecap="round"/>'+
  '<circle cx="30" cy="43" r="1" fill="#c98a63"/><circle cx="34" cy="45" r="1" fill="#c98a63"/>'+
  '<circle cx="50" cy="45" r="1" fill="#c98a63"/><circle cx="54" cy="43" r="1" fill="#c98a63"/>'},
 // Lost the depth perception, kept the gold tooth.
 {name:'EYE PATCH', skin:'#d9a97f', details:
  '<path d="M22 28l40-3" fill="none" stroke="#22262b" stroke-width="2.5"/>'+
  '<path d="M26 30h13v10q0 3-3 3h-7q-3 0-3-3z" fill="#22262b"/>'+
  '<path d="M33 47q9 6 17 0-2 9-8.5 9T33 47z" fill="#f6f1e2" stroke="#4f3626" stroke-width="1.5" stroke-linejoin="round"/>'+
  '<path d="M44 49h4v4h-4z" fill="#e9b85d"/>'},
 // Business at the front, rally at the back.
 {name:'THE MULLET', skin:'#eabf99', details:
  '<path d="M20 38q-5 13-3 26 7-2 9-12z" fill="#7a4526"/>'+
  '<path d="M64 38q5 13 3 26-7-2-9-12z" fill="#7a4526"/>'+
  '<path d="M24 40h5v10h-5z" fill="#7a4526"/><path d="M55 40h5v10h-5z" fill="#7a4526"/>'+
  '<path d="M35 52q7 3 14-1" fill="none" stroke="#70462e" stroke-width="2" stroke-linecap="round"/>'},
 // Built in the pit lane out of spare telemetry.
 {name:'PIT ROBOT', skin:'#b9c2c8', details:
  '<rect x="26" y="30" width="32" height="12" rx="3" fill="#141a20"/>'+
  '<rect x="30" y="33" width="7" height="6" rx="1.5" fill="#7fd6a2"/>'+
  '<rect x="47" y="33" width="7" height="6" rx="1.5" fill="#7fd6a2"/>'+
  '<rect x="32" y="48" width="20" height="6" rx="2" fill="#39434b"/>'+
  '<path d="M36 48v6M42 48v6M48 48v6" stroke="#aab4bb" stroke-width="1.4"/>'+
  '<path d="M62 24q7-5 6-13" fill="none" stroke="#f4eed9" stroke-width="2"/>'+
  '<circle cx="68" cy="10" r="3.4" fill="#d46f60"/>'},
 // Nine lives, three laps, no seatbelt.
 {name:'RALLY CAT', skin:'#e8c07a', details:
  '<path d="M21 22 25 6l12 9z" fill="#c98f52"/><path d="M63 22 59 6 47 15z" fill="#c98f52"/>'+
  '<path d="M26 18 27 11l5 4z" fill="#e79ab0"/><path d="M58 18 57 11l-5 4z" fill="#e79ab0"/>'+
  '<path d="M39 43h6l-3 3.4z" fill="#e07f9c"/>'+
  '<path d="M42 47q-4 4-7 1m7-1q4 4 7 1" fill="none" stroke="#4a3a2c" stroke-width="1.7" stroke-linecap="round"/>'+
  '<path d="M18 45h12M18 50h12M66 45H54M66 50H54" stroke="#4a3a2c" stroke-width="1.4" stroke-linecap="round"/>'},
 // Came a very long way for a three-lap arcade race.
 {name:'LITTLE GREEN', skin:'#9ecf8f', details:
  '<path d="M27 31q9-2 11 4-1 9-8 8-6-1-3-12z" fill="#141a20"/>'+
  '<path d="M57 31q-9-2-11 4 1 9 8 8 6-1 3-12z" fill="#141a20"/>'+
  '<circle cx="31.5" cy="36" r="1.6" fill="#f4eed9" opacity=".85"/>'+
  '<circle cx="52.5" cy="36" r="1.6" fill="#f4eed9" opacity=".85"/>'+
  '<path d="M37 51h10" fill="none" stroke="#3b5b36" stroke-width="2" stroke-linecap="round"/>'},
];
// A face index that is always inside the picker, whatever a client sent.
export const cleanFace = (value,fallback=0)=>Number.isInteger(value)&&value>=0&&value<FACES.length?value:fallback;
// The livery a seat wears: online seats keep the car colour, not the face.
export const driverLook = index=>({color:DRIVERS[index].color,trim:DRIVERS[index].trim,name:DRIVERS[index].name});
// Original vector portraits: one helmet and livery, one face on top of it.
export function portrait(face,look={}){
 const f=FACES[cleanFace(face)],color=look.color||'#e9b85d',trim=look.trim||'#26343a';
 const skin=look.skin||f.skin,name=look.name||f.name;
 return `<svg class="portrait" viewBox="0 0 84 84" role="img" aria-label="${name} portrait"><rect width="84" height="84" rx="18" fill="${trim}"/><path d="M9 84v-9q2-20 33-20t33 20v9" fill="${color}"/><path d="M34 58l8 16 8-16" fill="#f4eed9"/><path d="M17 34Q17 5 42 5t25 29v19l-14 7H30l-13-7" fill="${color}"/><path d="M36 6h12v16H36" fill="#f4eed9"/><rect x="23" y="25" width="38" height="34" rx="15" fill="${skin}"/><path d="M21 27q21-9 42 0" fill="none" stroke="#26343a" stroke-width="5"/><circle cx="33" cy="36" r="2" fill="#26343a"/><circle cx="51" cy="36" r="2" fill="#26343a"/><path d="M37 49q5 4 10-1" fill="none" stroke="#70462e" stroke-width="2" stroke-linecap="round"/>${f.details}<path d="M12 77l10-10m40 0 10 10" stroke="#f4eed9" stroke-width="3"/></svg>`;
}
