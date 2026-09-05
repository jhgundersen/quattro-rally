// The player always drives the amber car at index PLAYER; the rest are AI.
// Skill scales their pace, and it also sets the grid: quickest on pole, the
// player at the back with work to do. DHH is the ace nobody catches easily.
export const PLAYER = 0;
export const DRIVERS = [
  {name:'Axel', nickname:'THE WAFFLE ROCKET', color:'#e9b85d', skin:'#e9b58e', quip:'Powered by waffles. Brakes sold separately.'},
  {name:'Ryan', nickname:'THE FRAME RATE', color:'#82ada3', skin:'#efc7a0', quip:'Ships the overtake, patches the apex later.', skill:1.55},
  {name:'Bjarne', nickname:'ONE MORE COFFEE', color:'#d46f60', skin:'#e8c4a2', quip:'Raised an eyebrow at the whole third lap.', skill:1.4},
  // Omarchy green over Tokyo-night ink, sampled from the Omarchy wordmark.
  {name:'DHH', nickname:'THE FLYING DANE', color:'#9ece6a', trim:'#1a1b26', skin:'#f0cbaa', quip:'Says the whole race could have been a hairpin.', ace:true, skill:2.2},
];
// Starting order: the quickest car leads the field away, the player is last.
export const GRID = DRIVERS.map((d,i)=>i).sort((a,b)=>(DRIVERS[b].skill||0)-(DRIVERS[a].skill||0));
// Original vector portraits share the car liveries, with individual expressions.
export function portrait(index){
 const d=DRIVERS[index];
 const details=[
  '<path d="M29 45q7-8 13 0q7-8 13 0q-7 9-13 2q-7 7-13-2" fill="#70462e"/>',
  // Dark rectangular frames and a neat goatee.
  '<rect x="24" y="30" width="16" height="12" rx="3" fill="none" stroke="#2b2f36" stroke-width="2.5"/>'+
  '<rect x="44" y="30" width="16" height="12" rx="3" fill="none" stroke="#2b2f36" stroke-width="2.5"/>'+
  '<path d="M40 35h4" stroke="#2b2f36" stroke-width="2.5"/>'+
  '<path d="M33 45q9-3 18 0l-1 4q-8-2-16 0z" fill="#3f342e"/>'+
  '<path d="M35 51h14q0 9-7 9t-7-9z" fill="#3f342e"/>'+
  '<path d="M37 50q5 3 10-1" fill="none" stroke="#8c5a44" stroke-width="2" stroke-linecap="round"/>',
  // Clean-shaven head under the helmet, grey stubble, and one raised eyebrow.
  '<path d="M24 44q18 7 36 0v2q0 14-18 14t-18-14z" fill="#8d8377"/>'+
  '<path d="M33 44q9-3 18 0l-1 4q-8-2-16 0z" fill="#6f665c"/>'+
  '<path d="M38 52q4 2 8 0-2 4-4 4t-4-4z" fill="#4a423b"/>'+
  '<path d="M28 33q6-2 11 0" stroke="#5b5148" stroke-width="2.5" fill="none" stroke-linecap="round"/>'+
  '<path d="M45 29q6-3 11 2" stroke="#5b5148" stroke-width="2.5" fill="none" stroke-linecap="round"/>'+
  '<path d="M36 50q6 2 11-2" fill="none" stroke="#4a423b" stroke-width="2" stroke-linecap="round"/>',
  // Long auburn waves under the helmet, a grey-flecked beard and a wide grin.
  '<path d="M17 33c-5 10-7 24-4 35 4-1 8-7 9-15 1-7-1-14-5-20zm50 0c5 10 7 24 4 35-4-1-8-7-9-15-1-7 1-14 5-20z" fill="#8b5a34"/>'+
  '<path d="M24 44q18 8 36 0v2q0 14-18 14t-18-14z" fill="#7a5638"/>'+
  '<path d="M27 52h30q-3 8-15 8t-15-8z" fill="#bdb2a0" opacity=".45"/>'+
  '<path d="M32 47q10 8 20 0-4 10-10 10t-10-10z" fill="#f6f1e2" stroke="#4f3626" stroke-width="1.5" stroke-linejoin="round"/>'+
  '<circle cx="33" cy="36" r="1.6" fill="#5d86a8"/><circle cx="51" cy="36" r="1.6" fill="#5d86a8"/>'+
  '<path d="M28 31q6-3 11 1m6 0q5-4 11-1" stroke="#7a5334" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
 ][index];
 return `<svg class="portrait" viewBox="0 0 84 84" role="img" aria-label="${d.name} portrait"><rect width="84" height="84" rx="18" fill="${d.trim||'#26343a'}"/><path d="M9 84v-9q2-20 33-20t33 20v9" fill="${d.color}"/><path d="M34 58l8 16 8-16" fill="#f4eed9"/><path d="M17 34Q17 5 42 5t25 29v19l-14 7H30l-13-7" fill="${d.color}"/><path d="M36 6h12v16H36" fill="#f4eed9"/><rect x="23" y="25" width="38" height="34" rx="15" fill="${d.skin}"/><path d="M21 27q21-9 42 0" fill="none" stroke="#26343a" stroke-width="5"/><circle cx="33" cy="36" r="2" fill="#26343a"/><circle cx="51" cy="36" r="2" fill="#26343a"/><path d="M37 49q5 4 10-1" fill="none" stroke="#70462e" stroke-width="2" stroke-linecap="round"/>${details}<path d="M12 77l10-10m40 0 10 10" stroke="#f4eed9" stroke-width="3"/></svg>`;
}
