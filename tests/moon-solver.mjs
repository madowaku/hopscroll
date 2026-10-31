// Bounded discrete search, not a proof over all continuous input schedules.
import {PERIOD} from '../src/core.mjs';
import {moonLevels} from '../src/moon-levels.mjs';
import {createMoonState,advanceMoon} from '../src/moon-core.mjs';
export function solveMoon(level,{wantBonus=false,avoidBridges=false}={}) {
 let frontier=[{state:createMoonState(level),path:[]}];
 for(let hop=1;hop<=32;hop++){
  const next=new Map();
  for(const node of frontier)for(const fastSeconds of [0,.10,.20,.30,.40,.50,.60,.70,.78])for(const fastFirst of [true,false]) {
   const state=structuredClone(node.state),steps=fastFirst?[[fastSeconds,true],[PERIOD-fastSeconds,false]]:[[PERIOD-fastSeconds,false],[fastSeconds,true]];
   for(const [dt,fast]of steps)advanceMoon(state,level,dt,fast);
   if(state.status==='dead')continue;
   const lastFast=steps[1][0]>1e-10?steps[1][1]:steps[0][1];
   const support=level.surfaces.find(s=>state.x>=s.a+8-1e-8&&state.x<=s.b-8+1e-8&&(s.kind==='bridge'?!lastFast:s.kind==='meteor'?lastFast:true));
   if(!support||Math.min(state.x-support.a-8,support.b-8-state.x)<18||(avoidBridges&&support.kind==='bridge'))continue;
   const path=[...node.path,{fastSeconds,fastFirst,x:+state.x.toFixed(3),support:support.kind,bonus:state.bonus}];
   if(state.status==='clear'&&(!wantBonus||state.bonus))return path;
   const key=`${Math.round(state.x/4)}:${state.bonus}`;
   if(!next.has(key))next.set(key,{state,path});
  }
  frontier=[...next.values()];if(!frontier.length)break;
 }
 return null;
}
if(process.argv[1]?.endsWith('moon-solver.mjs')){
 for(const level of moonLevels)for(const options of [{},{wantBonus:level.id==='004',avoidBridges:level.id==='003'}]){
  const path=solveMoon(level,options);console.log(JSON.stringify({stage:level.id,options,hops:path?.length,path}));
 }
}
