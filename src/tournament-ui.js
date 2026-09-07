import {TRACKS} from './tracks.js';
let lastKey='';
export function renderTournament(tournament,{player,driver,portrait}){
 const panel=document.getElementById('tournament-results'),wasHidden=panel.hidden;panel.hidden=!tournament?.rounds.length;if(panel.hidden)return;
 const renderKey=JSON.stringify([tournament,player,[0,1,2,3].map(i=>driver(i).name)]);if(renderKey===lastKey&&!wasHidden)return;lastKey=renderKey;
 const {tracks,rounds,standings,complete}=tournament;
 const heading=document.createElement('h3');heading.textContent=complete?'THE CHAMPIONSHIP CLASSIFICATION':'CHAMPIONSHIP STANDINGS';
 const table=document.createElement('table'),caption=document.createElement('caption');caption.textContent='10 / 6 / 4 points · DNF 0';table.append(caption);
 const head=document.createElement('tr');
 for(const text of ['POS','DRIVER',...tracks.map((id,i)=>`R${i+1}`),'PTS']){const th=document.createElement('th');th.scope='col';th.textContent=text;head.append(th);}
 const thead=document.createElement('thead');thead.append(head);table.append(thead);const body=document.createElement('tbody');
 standings.forEach((row,place)=>{
  const tr=document.createElement('tr');if(row.seat===player)tr.className='is-player';
  const rank=document.createElement('td');rank.textContent=String(place+1).padStart(2,'0');tr.append(rank);
  const name=document.createElement('th');name.scope='row';name.textContent=driver(row.seat).name+(row.seat===player?' · YOU':'');name.style.color=driver(row.seat).color;tr.append(name);
  for(let i=0;i<tracks.length;i++){const td=document.createElement('td'),r=row.rounds[i];td.textContent=r?(r.time===null?'DNF':String(r.points)):'—';td.title=TRACKS.find(t=>t.id===tracks[i]).name+(r?` · ${r.time===null?'did not finish':`P${r.place}`}`:'');tr.append(td);}
  const total=document.createElement('td');total.className='total-points';total.textContent=row.points;tr.append(total);body.append(tr);
 });table.append(body);
 const scroll=document.createElement('div');scroll.className='score-scroll';scroll.append(table);
 const key=document.createElement('p');key.className='round-key';key.textContent=tracks.map((id,i)=>`R${i+1} ${TRACKS.find(t=>t.id===id).name}`).join(' · ');
 panel.replaceChildren(heading,scroll,key);
 if(!complete)return;
 const winner=standings[0];
 document.getElementById('results').classList.add('is-championship');
 document.getElementById('results-stage').textContent=`QUATTRO CUP · ${tracks.length} ROUND${tracks.length===1?'':'S'} · COMPLETE`;
 document.getElementById('results-title').textContent=winner.seat===player?'YOU ARE THE CHAMPION':`${driver(winner.seat).name.toUpperCase()} TAKES THE CUP`;
 document.getElementById('results-summary').textContent=`${winner.points} POINTS · ${winner.wins} WIN${winner.wins===1?'':'S'} · ONE CHAMPION`;
 document.getElementById('result-times').hidden=true;
 document.getElementById('podium').innerHTML=[1,0,2].map(place=>{const row=standings[place],d=driver(row.seat);return `<div class="podium-driver place-${place+1}" style="--driver:${d.color}"><div class="celebrant"><span class="podium-prop" aria-hidden="true">${place===0?'🏆':place===1?'🥈':'🥉'}</span>${portrait(row.seat)}</div><strong>${d.name}</strong><div class="podium-block"><b>${row.points}</b><span>${['CHAMPION','RUNNER-UP','THIRD PLACE'][place]}</span></div></div>`;}).join('');
}
