import assert from 'node:assert/strict';
import { PERIOD } from '../src/core.mjs';
import { moonLevels } from '../src/moon-levels.mjs';
import { createMoonState, advanceMoon, isLandingSafe, retryMoon, predictMoon } from '../src/moon-core.mjs';
const chunks = c => c === 'M' ? [[.5,true],[.28,false]] : [[PERIOD,c === 'F']];
export function replay(level, route=level.route, hz=60, changes={}, guarded=false) {
 const state=createMoonState(level),trace=[];
 let time=0,end=0,index=0;
 // Merge adjacent identical inputs before shifting actual transitions.
 const inputs=[];
 for(const c of route) for(const [dt,fast] of chunks(c)) {if(inputs.at(-1)?.fast===fast)inputs.at(-1).dt+=dt;else inputs.push({dt,fast});}
  const guards={};let boundary=0;
 for(let i=0;i<inputs.length;i++) {boundary+=inputs[i].dt;const hop=Math.round(boundary/PERIOD);
  if(guarded&&Math.abs(boundary-hop*PERIOD)<1e-8&&route[hop-1]==='M'&&route[hop]==='F'&&level.id==='003'){guards[i]=.06;guards[i-1]=.06;}
 }
 for(const [i,input] of inputs.entries()) {
  end+=input.dt;const until=end+(i<inputs.length-1?((changes[i]||0)+(guards[i]||0)):0);
  while(time<until-1e-10&&state.status==='playing') {
   const dt=Math.min(1/hz,until-time,PERIOD-state.phase),before=state.jumps;
   advanceMoon(state,level,dt,input.fast);time+=dt;
   if(state.jumps!==before)trace.push({hop:state.jumps,x:+state.x.toFixed(3),fast:input.fast,status:state.status,bonus:state.bonus,margin:+margin(level,state.x,input.fast).toFixed(6)});
  }index++;
 }
 return {state,trace,transitions:inputs.length-1};
}
function margin(level,x,fast){return Math.max(...level.surfaces.filter(s=>s.kind!=='bridge'||!fast).map(s=>Math.min(x-s.a-8,s.b-8-x)));}
for(const level of moonLevels) {
 const ref=replay(level);assert.equal(ref.state.status,'clear');assert.equal(ref.state.jumps,level.route.length);assert.ok(ref.trace.every(t=>t.margin>=25));assert.equal(ref.state.fullMoon,true);
 for(const hz of [30,60,120,144]) {const r=replay(level,level.route,hz);assert.equal(r.state.status,'clear');assert.deepEqual(r.trace,ref.trace);}
 // Local human timing perturbations: every contiguous block of up to 3 transitions.
 for(const hz of [30,60,120,144]) for(let start=0;start<ref.transitions;start++) for(let mask=0;mask<8;mask++) {
  const shifts={};for(let n=0;n<3&&start+n<ref.transitions;n++)shifts[start+n]=(mask>>n&1)?.03:-.03;
  assert.equal(replay(level,level.route,hz,shifts,true).state.status,'clear',`${level.id} local jitter ${start}/${mask}`);
 }
 for(const fast of [false,true]){const s=createMoonState(level);advanceMoon(s,level,60,fast);assert.equal(s.status,'dead');}
 for(let i=1;i<level.surfaces.length;i++)assert.ok(level.surfaces[i-1].b<=level.surfaces[i].a,'overlapping surfaces');
}
const bridge=moonLevels[0],fork=moonLevels[1];
assert.equal(isLandingSafe(bridge,824.4,false),true);assert.equal(isLandingSafe(bridge,824.4,true),false);
{
 const s=createMoonState(bridge);for(const c of bridge.route.slice(0,4))for(const [dt,f]of chunks(c))advanceMoon(s,bridge,dt,f);
 // Equal total distance to M, but SLOW then FAST: same X, wrong landing state.
 advanceMoon(s,bridge,.28,false);advanceMoon(s,bridge,.5,true);
 assert.equal(s.status,'dead');assert.equal(s.failure.reason,'quiet-bridge-fast');assert.ok(Math.abs(s.x-824.4)<1e-8);
}
const alternate=fork.route.slice(0,9)+'FS'+fork.route.slice(11);
const safe=replay(fork),bonus=replay(fork,alternate);assert.equal(bonus.state.status,'clear');assert.equal(safe.state.bonus,false);assert.equal(bonus.state.bonus,true);assert.equal(safe.trace[10].x,bonus.trace[10].x);
for(const level of moonLevels){
 const s=createMoonState(level);for(const c of level.route.slice(0,level.checkpoint.hop))for(const [dt,f]of chunks(c))advanceMoon(s,level,dt,f);
 assert.ok(s.checkpoint);const saved=structuredClone(s.checkpoint);advanceMoon(s,level,30,true);const restored=retryMoon(s,level);
 assert.equal(restored.x,saved.x);assert.equal(restored.phase,0);assert.equal(restored.jumps,saved.jumps);assert.equal(restored.bonus,saved.bonus);assert.equal(restored.usedCheckpoint,true);
 for(const c of level.route.slice(level.checkpoint.hop))for(const [dt,f]of chunks(c))advanceMoon(restored,level,dt,f);
 assert.equal(restored.status,'clear');assert.equal(restored.fullMoon,false);assert.equal(retryMoon(restored,level,true).usedCheckpoint,false);
 const fresh=createMoonState(level),p=predictMoon(fresh,level,false);advanceMoon(fresh,level,PERIOD,false);assert.ok(Math.abs(fresh.x-p.x)<1e-8);assert.equal(p.safe,true);
}
// Bridge grace: FAST pressed under BRIDGE_GRACE before touchdown still lands; held longer, the bridge is gone.
for(const [early,alive] of [[.1,true],[.2,false]]){
 const s=createMoonState(bridge);s.x=824.4-105*(PERIOD-early)-270*early;
 assert.equal(predictMoon(s,bridge,false).safe,true);advanceMoon(s,bridge,PERIOD-early,false);
 assert.equal(predictMoon(s,bridge,true).safe,alive);advanceMoon(s,bridge,early,true);
 assert.equal(s.status!=='dead',alive,`FAST ${early}s before a bridge landing`);
}
console.log('PASS Moon: both full routes, branch reunion/landing bonus, bridge state, frame/jitter, checkpoint/FULL MOON');
if(process.argv.includes('--trace'))for(const level of moonLevels)console.log(level.id,JSON.stringify(replay(level).trace));


// Independent bounded search finds extra routes and verifies them through physics.
const {solveMoon}=await import('./moon-solver.mjs');
for(const level of moonLevels)for(const wantBonus of level.id==='004'?[false,true]:[false]){
 const path=solveMoon(level,{wantBonus});assert.ok(path);
 for(const hz of [30,60,120,144]){
  const s=createMoonState(level);
  for(const hop of path){const steps=hop.fastFirst?[[hop.fastSeconds,true],[PERIOD-hop.fastSeconds,false]]:[[PERIOD-hop.fastSeconds,false],[hop.fastSeconds,true]];
   for(const [duration,fast]of steps){let remain=duration;while(remain>1e-10){const dt=Math.min(1/hz,remain);advanceMoon(s,level,dt,fast);remain-=dt;}}
   assert.notEqual(s.status,'dead');
  }
  assert.equal(s.status,'clear');if(wantBonus)assert.equal(s.bonus,true);
 }
}
assert.equal(solveMoon(bridge,{avoidBridges:true}),null,'No bridge-free path in the bounded sample search');
// Prediction and actual collision agree on both bridge states, including endpoints.
for(const fast of [true,false])for(const x of [782.999,783,824.4,857,857.001]){
 const s=createMoonState(bridge);s.x=x-(fast?270:105)*.1;s.phase=PERIOD-.1;
 const preview=predictMoon(s,bridge,fast);advanceMoon(s,bridge,.1,fast);assert.equal(s.status!=='dead',preview.safe);
}
console.log('PASS bounded solver: additional 20/20/21-hop routes at four frame rates; bridge collision boundaries');
// v0.2: all admitted checkpoint positions afford a safe first released hop.
for(const level of moonLevels){
 for(let x=level.checkpoint.a;x<=level.checkpoint.b;x+=.5){
  const previous=createMoonState(level);previous.checkpoint={x,phase:0,jumps:level.checkpoint.hop,bonus:level.id==='004',collected:[],starCount:0};
  const s=retryMoon(previous,level);const prediction=predictMoon(s,level,false);assert.equal(prediction.safe,true);
  const events=advanceMoon(s,level,PERIOD,false);assert.equal(s.status,'playing');assert.equal(events.filter(e=>e.type==='landing').length,1);
  assert.equal(level.surfaces.find(p=>s.x>=p.a+8&&s.x<=p.b-8).kind,'normal');
  if(level.id==='003'){
   advanceMoon(s,level,PERIOD,true);assert.equal(s.status,'playing');
   assert.equal(level.surfaces.find(p=>s.x>=p.a+8&&s.x<=p.b-8).kind,'normal');
   const e=[...advanceMoon(s,level,.5,true),...advanceMoon(s,level,.28,false)];assert.equal(s.status,'playing');assert.equal(e.find(e=>e.type==='landing').cue,'bridge');
  }
 }
}
for(const level of moonLevels){
 const sequences=[];
 for(const hz of [30,60,120,144]){
  const s=createMoonState(level),landings=[];let cpCount=0;
  for(const c of level.route)for(const [duration,fast] of chunks(c)){
   let remain=duration;while(remain>1e-10){const dt=Math.min(remain,1/hz);const before=s.jumps;const events=advanceMoon(s,level,dt,fast);remain-=dt;
    const cues=events.filter(e=>e.type==='landing');assert.equal(cues.length,s.jumps-before);landings.push(...cues.map(e=>({hop:e.hop,cue:e.cue})));cpCount+=events.filter(e=>e==='checkpoint').length;
    if(events.includes('checkpoint')){assert.equal(s.jumps,level.checkpoint.hop);assert.ok(Math.abs(s.x-level.checkpoint.x)<1e-7);}
   }
  }
  assert.equal(cpCount,1);assert.equal(landings.length,level.route.length);assert.equal(landings.at(-1).cue,'goal');sequences.push(landings);
  assert.deepEqual(advanceMoon(s,level,1,false),[]);
 }
 for(const seq of sequences)assert.deepEqual(seq,sequences[0]);
}
{
 const s=createMoonState(bridge);for(const c of bridge.route.slice(0,4))for(const [dt,f]of chunks(c))advanceMoon(s,bridge,dt,f);
 const events=[...advanceMoon(s,bridge,.28,false),...advanceMoon(s,bridge,.5,true)];assert.equal(s.failure.reason,'quiet-bridge-fast');assert.equal(events.filter(e=>e.type==='landing').length,0);
 const b=createMoonState(fork);let cues=[];for(const c of alternate)for(const [dt,f]of chunks(c))cues.push(...advanceMoon(b,fork,dt,f).filter(e=>e.type==='landing'));
 assert.equal(cues.filter(e=>e.cue==='bonus').length,1);assert.equal(cues.length,26);
}
console.log('PASS v0.2: checkpoint envelopes, two normal hops then bridge, single landing cues, cue/frame stability');
