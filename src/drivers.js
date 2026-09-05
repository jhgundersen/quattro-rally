export const DRIVERS = [
  {name:'Axel', nickname:'THE WAFFLE ROCKET', color:'#e9b85d', skin:'#e9b58e', quip:'Powered by waffles. Brakes sold separately.'},
  {name:'Moss', nickname:'CAPTAIN CALM', color:'#82ada3', skin:'#a97253', quip:'Claims that was the warm-up lap.'},
  {name:'Roxy', nickname:'THE REV MENACE', color:'#d46f60', skin:'#efc7a0', quip:'Already doing donuts in the trophy room.'},
  {name:'Lumi', nickname:'SIDEWAYS SPECIALIST', color:'#a0a7d5', skin:'#cb9673', quip:'Would like to thank the handbrake.'},
];
// Original vector portraits share the car liveries, with individual expressions.
export function portrait(index){
 const d=DRIVERS[index];
 const details=[
  '<path d="M29 45q7-8 13 0q7-8 13 0q-7 9-13 2q-7 7-13-2" fill="#70462e"/>',
  '<path d="M23 32h17v10H25zm21 0h17l-2 10H44z" fill="#233e40"/><path d="M40 35h4" stroke="#233e40" stroke-width="3"/>',
  '<path d="M29 35l7 2m12 0 7-4" stroke="#593830" stroke-width="3"/><path d="M34 47q8 10 17-2" fill="white" stroke="#593830" stroke-width="2"/>',
  '<path d="M25 33q6-5 12 0m10 0q6-5 12 0" stroke="#553c50" stroke-width="3" fill="none"/><circle cx="28" cy="43" r="4" fill="#d46f60"/><circle cx="55" cy="43" r="4" fill="#d46f60"/>',
 ][index];
 return `<svg class="portrait" viewBox="0 0 84 84" role="img" aria-label="${d.name} portrait"><rect width="84" height="84" rx="18" fill="#26343a"/><path d="M9 84v-9q2-20 33-20t33 20v9" fill="${d.color}"/><path d="M34 58l8 16 8-16" fill="#f4eed9"/><path d="M17 34Q17 5 42 5t25 29v19l-14 7H30l-13-7" fill="${d.color}"/><path d="M36 6h12v16H36" fill="#f4eed9"/><rect x="23" y="25" width="38" height="34" rx="15" fill="${d.skin}"/><path d="M21 27q21-9 42 0" fill="none" stroke="#26343a" stroke-width="5"/><circle cx="33" cy="36" r="2" fill="#26343a"/><circle cx="51" cy="36" r="2" fill="#26343a"/><path d="M37 49q5 4 10-1" fill="none" stroke="#70462e" stroke-width="2" stroke-linecap="round"/>${details}<path d="M12 77l10-10m40 0 10 10" stroke="#f4eed9" stroke-width="3"/><text x="64" y="79" fill="#26343a" font-size="12" font-family="monospace" font-weight="bold">0${index+1}</text></svg>`;
}
