import {PERIOD,createState,advance,isSafe,predictLanding} from './core.mjs';
// Filtering the collision view preserves the campaign's exact physics. A bridge
// changes support at landing only; it does not charge, slow or alter the jump.
export function collisionView(level,fast) {
 return {start:level.start,goal:level.goal,stars:[],platforms:level.surfaces.filter(s=>s.kind!=='bridge'||!fast).map(s=>[s.a,s.b])};
}
export function isLandingSafe(level,x,fast){return isSafe(collisionView(level,fast),x);}
export function predictMoon(state,level,fast){const x=predictLanding(state,fast);return {x,safe:isLandingSafe(level,x,fast)};}
export function createMoonState(level){return {...createState(collisionView(level,false)),bonus:false,checkpoint:null,usedCheckpoint:false,fullMoon:false};}
export function retryMoon(previous,level,fromStart=false){
 const next=createMoonState(level);
 if(!fromStart&&previous.checkpoint){Object.assign(next,structuredClone(previous.checkpoint));next.checkpoint=structuredClone(previous.checkpoint);next.usedCheckpoint=true;}
 return next;
}
export function advanceMoon(state,level,dt,fast){
 if(!Number.isFinite(dt)||dt<=0||state.status!=='playing')return [];
 const events=[],view=collisionView(level,fast);
 while(dt>1e-12&&state.status==='playing'){
  const step=Math.min(dt,PERIOD-state.phase),current=advance(state,view,step,fast);dt-=step;
  if(current.includes('fall')&&fast&&level.surfaces.some(s=>s.kind==='bridge'&&state.x>=s.a+8-1e-8&&state.x<=s.b-8+1e-8))state.failure={reason:'quiet-bridge-fast',x:state.x,correction:'release'};
  if(current.includes('land')||current.includes('clear')){
   const bonus=level.bonusIsland;
   if(bonus&&!state.bonus&&state.x>=bonus.a&&state.x<=bonus.b){state.bonus=true;current.push('bonus');}
   const cp=level.checkpoint;
   if(!state.checkpoint&&state.x>=cp.a&&state.x<=cp.b){state.checkpoint={x:state.x,phase:0,jumps:state.jumps,bonus:state.bonus,starCount:state.starCount,collected:[...state.collected]};current.push('checkpoint');}
   if(state.status==='clear')state.fullMoon=!state.usedCheckpoint;
   const bridge=level.surfaces.some(s=>s.kind==='bridge'&&state.x>=s.a+8-1e-8&&state.x<=s.b-8+1e-8);
   // One semantic cue per successful landing. Reward/goal replaces the base tap.
   const cue=state.status==='clear'?'goal':current.includes('bonus')?'bonus':bridge?'bridge':fast?'fast':'slow';
   current.push({type:'landing',cue,hop:state.jumps,x:state.x});
  }
  events.push(...current);
 }
 return events;
}
