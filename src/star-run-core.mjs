import { PERIOD, SLOW_SPEED, FAST_SPEED, createState, advance } from './core.mjs';

// Six readable speed sections, 24 hops. Each FAST landing has its own island;
// SLOW sections extend the last island so they cannot farm gates.
export const referenceSections = [ [3,false], [5,true], [4,false], [5,true], [3,false], [4,true] ];
let x = 75;
const platforms = [[0,75 + 70]], landings = [];
for (const [hops,fast] of referenceSections) for(let i=0;i<hops;i++) {
  x += PERIOD * (fast ? FAST_SPEED : SLOW_SPEED);
  if(fast) { const half = platforms.length === 1 ? 35 : 70; platforms.push([x-half,x+half]); }
  else platforms.at(-1)[1] = x+70;
  landings.push(x);
}
export const course = { start:75, platforms, goal:[x-60,x+60], stars:[] };
export const bonusStars = landings.filter((_,i)=>i%2===1).map((landing,i)=>({x:landing-55,id:i}));
export const gates = platforms.slice(1).map(([a],i)=>({id:i,left:platforms[i][1],right:a}));
export const referenceLandings = landings;
export const bestKey = 'hopscroll.star-run.best.v1';
export function readBest(storage) {
  try { const b=JSON.parse(storage.getItem(bestKey));
    if(Number.isInteger(b?.gates)&&b.gates>=0&&b.gates<=gates.length&&Number.isInteger(b.stars)&&b.stars>=0&&b.stars<=bonusStars.length) return b;
  } catch {}
  return {gates:0,stars:0};
}
export function saveBest(storage,best,score) {
  const next=score.gates>best.gates || (score.gates===best.gates&&score.stars>best.stars) ? {...score} : best;
  try { storage.setItem(bestKey,JSON.stringify(next)); } catch {}
  return next;
}
export function newRun() { return {...createState(course),gates:0,passed:[]}; }
export function stepRun(state,dt,fast) {
  if(!Number.isFinite(dt)||dt<=0) return [];
  const events=[];
  while(dt>1e-12&&state.status==='playing') {
    const step=Math.min(dt,PERIOD-state.phase), from=state.x, phase=state.phase;
    const speed=fast?FAST_SPEED:SLOW_SPEED;
    // Stars sit above the lane: collect only while crossing at airborne height.
    for(const star of bonusStars) {
      const enter=Math.max(0,(star.x-10-from)/speed,.20-phase);
      const leave=Math.min(step,(star.x+10-from)/speed,.58-phase);
      if(enter<=leave && !state.collected.includes(star.id)) {
        state.collected.push(star.id);state.starCount++;events.push('star');
      }
    }
    const landed=advance(state,course,step,fast);
    if(landed.includes('land')||landed.includes('clear')) {
      for(const gate of gates) if(state.x>=gate.right+8&&!state.passed.includes(gate.id)) state.passed.push(gate.id);
      state.gates=state.passed.length;
    }
    events.push(...landed);dt-=step;
  }
  return events;
}
export function createInput() {
  const pointers=new Set(),keys=new Set();
  return {pointers,keys,get fast(){return pointers.size>0||keys.size>0;},reset(){pointers.clear();keys.clear();}};
}
