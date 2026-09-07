import {raceStandings} from './race.js';
export const ROUND_POINTS=[10,6,4,0];
export function scoreRound(cars,track){
 return {track,results:raceStandings(cars).map((car,place)=>({seat:car.i,place:place+1,points:car.finished?ROUND_POINTS[place]:0,time:car.finished?car.finishTime:null}))};
}
export function tournamentStandings(rounds){
 const rows=Array.from({length:4},(_,seat)=>({seat,points:0,wins:0,seconds:0,thirds:0,time:0,rounds:[]}));
 for(const round of rounds)for(const r of round.results){const row=rows[r.seat];row.points+=r.points;row.time+=r.time??180;row.rounds.push(r);if(r.time!==null){if(r.place===1)row.wins++;if(r.place===2)row.seconds++;if(r.place===3)row.thirds++;}}
 return rows.sort((a,b)=>b.points-a.points||b.wins-a.wins||b.seconds-a.seconds||b.thirds-a.thirds||a.time-b.time||a.seat-b.seat);
}
