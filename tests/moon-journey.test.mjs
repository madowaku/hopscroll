import assert from 'node:assert/strict';
import {PERIOD,SLOW_SPEED,FAST_SPEED} from '../src/core.mjs';
import {journeyLevels} from '../src/moon-journey-levels.mjs';
import {createMoonState,advanceMoon,retryMoon,predictMoon,isLandingSafe} from '../src/moon-core.mjs';
import {solveMoon} from './moon-solver.mjs';
assert.deepEqual([PERIOD,SLOW_SPEED,FAST_SPEED],[.78,105,270]);
assert.deepEqual(journeyLevels.map(l=>l.id),['001','002','003','004','006','005']);
const chunks=c=>c==='M'?[[.5,true],[.28,false]]:[[PERIOD,c==='F']];
function play(level,route=level.route,hz=60,state=createMoonState(level)){
 const trace=[];
 for(const c of route)for(const [duration,fast] of chunks(c)){
  let left=duration;while(left>1e-10){const dt=Math.min(left,1/hz);const events=advanceMoon(state,level,dt,fast);left-=dt;
   for(const e of events)if(e.type==='landing')trace.push({x:+e.x.toFixed(4),cue:e.cue});
  }
 }
 return {state,trace};
}
for(const level of journeyLevels){
 const reference=play(level);assert.equal(reference.state.status,'clear',level.id);assert.equal(reference.state.jumps,level.route.length);assert.equal(reference.state.fullMoon,true);
 for(const hz of [30,60,120,144])assert.deepEqual(play(level,level.route,hz).trace,reference.trace);
 for(const fast of [false,true]){const s=createMoonState(level);advanceMoon(s,level,60,fast);assert.equal(s.status,'dead',`${level.id} constant ${fast}`);}
 for(let i=1;i<level.surfaces.length;i++)assert.ok(level.surfaces[i-1].b<=level.surfaces[i].a,`${level.id} overlapping surfaces`);
 for(const wantBonus of level.bonusIsland?[false,true]:[false]){
  const path=solveMoon(level,{wantBonus});assert.ok(path,`${level.id} alternate ${wantBonus}`);
  for(const hz of [30,60,120,144]){
   const s=createMoonState(level);
   for(const hop of path){const steps=hop.fastFirst?[[hop.fastSeconds,true],[PERIOD-hop.fastSeconds,false]]:[[PERIOD-hop.fastSeconds,false],[hop.fastSeconds,true]];
    for(const [duration,fast] of steps){let left=duration;while(left>1e-10){const dt=Math.min(left,1/hz);advanceMoon(s,level,dt,fast);left-=dt;}}
   }
   assert.equal(s.status,'clear');if(wantBonus)assert.equal(s.bonus,true);
  }
  console.log(`SOLVER ${level.id} bonus=${wantBonus}: ${path.length} hops; ${new Set(path.map(p=>p.fastSeconds)).size} hold durations`);
 }
 if(!level.checkpoint)continue;
 const before=play(level,level.route.slice(0,level.checkpoint.hop)).state;assert.ok(before.checkpoint);
 const restored=retryMoon(before,level);assert.equal(restored.phase,0);assert.equal(restored.x,before.x);assert.equal(restored.bonus,before.bonus);
 const recovery=level.recoveryRoute||level.route.slice(level.checkpoint.hop);
 const done=play(level,recovery,60,restored).state;assert.equal(done.status,'clear',`${level.id} recovery`);assert.equal(done.fullMoon,false);
 for(let x=level.checkpoint.a;x<=level.checkpoint.b;x+=.5){
  const s=createMoonState(level);s.checkpoint={x,phase:0,jumps:level.checkpoint.hop,bonus:false,collected:[],starCount:0};const r=retryMoon(s,level);
  assert.equal(predictMoon(r,level,false).safe,true,`${level.id} checkpoint ${x}`);advanceMoon(r,level,PERIOD,false);
  assert.equal(r.status,'playing');assert.ok(level.surfaces.some(p=>p.kind==='normal'&&r.x>=p.a+8&&r.x<=p.b-8));
 }
}
// Every possible FAST/SLOW mixture remains on the first three landings in 001.
const intro=journeyLevels[0];for(let a=0;a<=.78;a+=.06)for(let b=0;b<=.78;b+=.06)for(let c=0;c<=.78;c+=.06){
 const s=createMoonState(intro);for(const held of [a,b,c]){advanceMoon(s,intro,held,true);advanceMoon(s,intro,PERIOD-held,false);}assert.equal(s.status,'playing');
}
// 005 contains the same equal-distance choice; bonus is optional and landing-only.
const finale=journeyLevels.find(l=>l.festival),near=play(finale,finale.route.slice(0,20)+'SF'+finale.route.slice(22)),far=play(finale);
assert.equal(near.state.status,'clear');assert.equal(near.state.bonus,false);assert.equal(far.state.bonus,true);assert.equal(near.trace[21].x,far.trace[21].x);
// 006 Meteor Sea: changing the speed of any single reference hop falls (each bridge decides the hop).
{const sea=journeyLevels.find(l=>l.id==='006');
 for(let i=0;i<sea.route.length;i++)for(const c of 'SFM')if(c!==sea.route[i]){const s=play(sea,sea.route.slice(0,i)+c+sea.route.slice(i+1)).state;assert.equal(s.status,'dead',`006 hop ${i+1} as ${c} survived`);}
 // Meteor grace: released 0.1s before touchdown still lands; released 0.15s before falls.
 for(const [late,alive] of [[.1,true],[.15,false]]){const s=createMoonState(sea);for(const c of 'SS')advanceMoon(s,sea,PERIOD,false);advanceMoon(s,sea,PERIOD-late,true);
  const x=s.x+105*late;advanceMoon(s,sea,late,false);assert.equal(s.status!=='dead',alive,`006 meteor release ${late}s early at ${x.toFixed(1)}`);if(!alive)assert.equal(s.failure.reason,'meteor-bridge-slow');}
}
// Android playtest: Michiru visibly standing on the tip of a gold meteor
// bridge must not fall just because core.isSafe's generic 8px margin
// removed a sliver of the drawn surface. Wrong-speed failure still applies.
{
 const sea=journeyLevels.find(l=>l.id==='006');
 const meteorBridges=sea.surfaces.filter(s=>s.kind==='meteor');
 assert.ok(meteorBridges.length>1);
 for(const bridge of meteorBridges){
  for(const x of [bridge.a,bridge.a+1,bridge.b-1,bridge.b]){
   assert.equal(isLandingSafe(sea,x,true,true),true,`FAST tip should land on gold slab at ${x}`);
   assert.equal(isLandingSafe(sea,x,false,false),false,`SLOW tip must still fail at ${x}`);
   for(const hz of [30,60,120,144]){
    const state=createMoonState(sea),seconds=.1;
    state.x=x-270*seconds;state.phase=PERIOD-seconds;
    assert.equal(predictMoon(state,sea,true).safe,true,`FAST prediction at ${x}`);
    let remain=seconds,events=[];
    while(remain>1e-10){const dt=Math.min(1/hz,remain);events.push(...advanceMoon(state,sea,dt,true));remain-=dt;}
    assert.equal(state.status,'playing',`FAST tip must land at ${x} @${hz}Hz`);
    assert.equal(events.filter(e=>e.type==='landing').length,1);
    assert.equal(events.find(e=>e.type==='landing').cue,'meteor');
   }
   const wrong=createMoonState(sea);wrong.x=x-105*.1;wrong.phase=PERIOD-.1;
   assert.equal(predictMoon(wrong,sea,false).safe,false);
   advanceMoon(wrong,sea,.1,false);
   assert.equal(wrong.status,'dead');
   assert.equal(wrong.failure.reason,'meteor-bridge-slow');
  }
  for(const x of [bridge.a-.05,bridge.b+.05]){
   assert.equal(isLandingSafe(sea,x,true,true),false,`Outside visible bridge must still fail at ${x}`);
  }
 }
 console.log('PASS Meteor Sea: visible edges land at FAST, wrong-speed / outside edges fail, 4 frame rates and prediction agree');
}

console.log('PASS Journey: six references, alternate solvers, frame rates, intro freedom, safe checkpoints, optional festival fork');

// Shift every local group of up to three transitions ±30ms at four frame rates.
// M→F bridge re-presses use the same 60ms guard as the existing Moon tests.
for(const level of journeyLevels.filter(l=>['001','002','005','006'].includes(l.id))){
 const spans=[];for(const c of level.route)for(const [dt,fast]of chunks(c)){if(spans.at(-1)?.fast===fast)spans.at(-1).dt+=dt;else spans.push({dt,fast});}
 const guards={};let t=0;
 for(let i=0;i<spans.length-1;i++){t+=spans[i].dt;const hop=Math.round(t/PERIOD);if(Math.abs(t-hop*PERIOD)<1e-8&&(level.route[hop-1]==='M'||(level.id==='005'&&hop===30))&&level.route[hop]==='F'){guards[i]=.06;guards[i-1]=.06;}}
 for(const hz of [30,60,120,144])for(let start=0;start<spans.length-1;start++)for(let mask=0;mask<8;mask++){
  const state=createMoonState(level);let time=0,end=0;
  for(let i=0;i<spans.length;i++){
   end+=spans[i].dt;const shift=i>=start&&i<start+3?((mask>>(i-start)&1)?.03:-.03):0;
   const until=end+(i<spans.length-1?(guards[i]||0)+shift:0);
   while(time<until-1e-10&&state.status==='playing'){const dt=Math.min(1/hz,until-time,PERIOD-state.phase);advanceMoon(state,level,dt,spans[i].fast);time+=dt;}
  }
  assert.equal(state.status,'clear',`${level.id} jitter ${hz}/${start}/${mask}`);
 }
}
console.log('PASS Journey: local ±30ms timing windows at 30/60/120/144Hz');
