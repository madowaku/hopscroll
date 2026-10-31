import {PERIOD,createState,advance,isSafe,predictLanding} from './core.mjs';
// Filtering the collision view preserves the campaign's exact physics. A bridge
// changes support at landing only; it does not charge, slow or alter the jump.
// Moon bridges hold released landings; meteor bridges are the reverse and hold only FAST ones.
export function collisionView(level,fast,meteor=fast) {
 return {start:level.start,goal:level.goal,stars:[],platforms:level.surfaces.filter(s=>s.kind==='bridge'?!fast:s.kind==='meteor'?meteor:true).map(s=>[s.a,s.b])};
}
// A bridge fades only after FAST has been held this long, so a press just before
// touchdown (to launch the next hop fast) still lands on solid moonlight.
export const BRIDGE_GRACE=.12;
const ghostAt=(state,fast,until)=>fast&&(state.fastHeld||0)+until>=BRIDGE_GRACE-1e-9;
export function bridgeGhost(state,fast){return ghostAt(state,fast,0);}
// The same grace the other way: a meteor bridge still holds a landing released just before touchdown.
const meteorAt=(state,fast,until)=>fast||(state.slowHeld??BRIDGE_GRACE)+until<BRIDGE_GRACE-1e-9;
export function meteorSolid(state,fast){return meteorAt(state,fast,0);}
const on=(level,kind,x)=>level.surfaces.some(s=>s.kind===kind&&x>=s.a+8-1e-8&&x<=s.b-8+1e-8);
export function isLandingSafe(level,x,fast,meteor=fast){return isSafe(collisionView(level,fast,meteor),x);}
export function predictMoon(state,level,fast){const x=predictLanding(state,fast),until=Math.max(0,PERIOD-state.phase);return {x,safe:isLandingSafe(level,x,ghostAt(state,fast,until),meteorAt(state,fast,until))};}
export function createMoonState(level){return {...createState(collisionView(level,false)),bonus:false,checkpoint:null,usedCheckpoint:false,fullMoon:false,fastHeld:0,slowHeld:BRIDGE_GRACE};}
export function retryMoon(previous,level,fromStart=false){
 const next=createMoonState(level);
 if(!fromStart&&previous.checkpoint){Object.assign(next,structuredClone(previous.checkpoint));next.checkpoint=structuredClone(previous.checkpoint);next.usedCheckpoint=true;}
 return next;
}
export function advanceMoon(state,level,dt,fast){
 if(!Number.isFinite(dt)||dt<=0||state.status!=='playing')return [];
 const events=[];
 while(dt>1e-12&&state.status==='playing'){
  const step=Math.min(dt,PERIOD-state.phase),ghost=ghostAt(state,fast,step),meteor=meteorAt(state,fast,step),current=advance(state,collisionView(level,ghost,meteor),step,fast);dt-=step;
  state.fastHeld=fast?(state.fastHeld||0)+step:0;state.slowHeld=fast?0:(state.slowHeld??BRIDGE_GRACE)+step;
  if(current.includes('fall')&&ghost&&on(level,'bridge',state.x))state.failure={reason:'quiet-bridge-fast',x:state.x,correction:'release'};
  if(current.includes('fall')&&!meteor&&on(level,'meteor',state.x))state.failure={reason:'meteor-bridge-slow',x:state.x,correction:'hold'};
  if(current.includes('land')||current.includes('clear')){
   const bonus=level.bonusIsland;
   if(bonus&&!state.bonus&&state.x>=bonus.a&&state.x<=bonus.b){state.bonus=true;current.push('bonus');}
   const cp=level.checkpoint;
   if(cp&&!state.checkpoint&&state.x>=cp.a&&state.x<=cp.b){state.checkpoint={x:state.x,phase:0,jumps:state.jumps,bonus:state.bonus,starCount:state.starCount,collected:[...state.collected]};current.push('checkpoint');}
   if(state.status==='clear')state.fullMoon=!state.usedCheckpoint;
   // One semantic cue per successful landing. Reward/goal replaces the base tap.
   const cue=state.status==='clear'?'goal':current.includes('bonus')?'bonus':on(level,'bridge',state.x)?'bridge':on(level,'meteor',state.x)?'meteor':fast?'fast':'slow';
   current.push({type:'landing',cue,hop:state.jumps,x:state.x});
  }
  events.push(...current);
 }
 return events;
}
