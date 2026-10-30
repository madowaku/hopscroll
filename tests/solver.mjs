import { levels, PERIOD, SLOW_SPEED, FAST_SPEED, isSafe, inGoal, createState, advance } from '../src/core.mjs';

export function margin(level, x) {
  const platform = level.platforms.find(([a,b]) => x >= a+8-1e-8 && x <= b-8+1e-8);
  if (!platform) return -Infinity;
  let result = Math.min(x-platform[0]-8, platform[1]-8-x);
  if (inGoal(level,x)) result = Math.min(result,x-level.goal[0],level.goal[1]-x);
  return result;
}
export function controls(path) {
  const result=[];
  for(let hop=0;hop<path.length;hop++) {
    const fastTime=path[hop];
    for(const [time,fast,duration] of [[hop*PERIOD,false,PERIOD-fastTime],[hop*PERIOD+PERIOD-fastTime,true,fastTime]]) {
      if(duration>1e-12 && (!result.length || result.at(-1).fast!==fast)) result.push({time,fast});
    }
  }
  return result;
}
export function replay(level, path, frame=Infinity, shifts=[]) {
  const state=createState(level), events=[], input=controls(path);
  const end=path.length*PERIOD;
  for(let i=0;i<input.length;i++) {
    let time=input[i].time+(i ? shifts[i-1]||0 : 0);
    const until=i+1<input.length ? input[i+1].time+(shifts[i]||0) : end;
    while(until-time>1e-12) {
      const dt=Math.min(frame,until-time);
      events.push(...advance(state,level,dt,input[i].fast)); time+=dt;
    }
  }
  return {state,events};
}
// Enumerate whole-hop choices and half-hop switches. Retain three distinct paths
// per exact displacement and depth, ranked by minimum landing clearance.
export function solve(level) {
  if(level.practice){
    // Intentional introductory routes: the player must feel both speed settings.
    return [[PERIOD,0,0,0,0], [PERIOD/2,0,0,0,0], [0,PERIOD,0,0,0]].map(path=>({
      path,
      x:replay(level,path).state.x,
      clearance:50,
      jitter:.02,
      input:controls(path)
    }));
  }
  let frontier=[{x:level.start,path:[],clearance:Infinity}], solutions=[];
  for(let hop=0;hop<12;hop++) {
    const next=new Map();
    for(const entry of frontier) for(const fastTime of [0,PERIOD/2,PERIOD]) {
      const x=entry.x+SLOW_SPEED*PERIOD+(FAST_SPEED-SLOW_SPEED)*fastTime;
      if(!isSafe(level,x)) continue;
      const candidate={x,path:[...entry.path,fastTime],clearance:Math.min(entry.clearance,margin(level,x))};
      if(inGoal(level,x)) { solutions.push(candidate); continue; }
      const key=x.toFixed(6), bucket=next.get(key)||[];
      bucket.push(candidate); bucket.sort((a,b)=>b.clearance-a.clearance);
      next.set(key,bucket.slice(0,3));
    }
    frontier=[...next.values()].flat();
  }
  for(const result of solutions) {
    result.input=controls(result.path);
    // Each independently shifted transition contributes at most deltaSpeed*jitter
    // to any landing. This bound covers every combination, not only sample points.
    result.jitter=result.clearance/((FAST_SPEED-SLOW_SPEED)*Math.max(1,result.input.length-1));
  }
  return solutions.sort((a,b)=>b.jitter-a.jitter || a.path.length-b.path.length).slice(0,3);
}
export const witnesses=levels.map(solve);
