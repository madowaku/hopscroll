import assert from 'node:assert/strict';
import {levels,PERIOD,SLOW_SPEED,FAST_SPEED,createState,advance,predictLanding,isSafe,inGoal} from '../src/core.mjs';
assert.equal(levels.length,6);
assert.equal(+(FAST_SPEED/SLOW_SPEED).toFixed(1),2.6);
assert.ok(levels.every(l=>l.platforms.length>=2 && isSafe(l,l.start) && isSafe(l,(l.goal[0]+l.goal[1])/2)));
for(const level of levels){
  // Reachability solver: any fraction of FAST input is allowed during each hop.
  // Integer targets are verified by splitting each simulated hop into a slow and fast interval.
  let reached=new Map([[Math.round(level.start),[]]]),result=null;
  for(let hops=0;hops<22 && !result;hops++){
    const next=new Map();
    for(const [position,path] of reached){
      const min=position+SLOW_SPEED*PERIOD,max=position+FAST_SPEED*PERIOD;
      for(let dest=Math.ceil(min);dest<=Math.floor(max);dest+=2){
        if(!isSafe(level,dest))continue;
        const fraction=(dest-position-min+position)/(max-min);
        const candidate=[...path,{from:position,to:dest,fastFraction:fraction}];
        if(inGoal(level,dest)){result=candidate;break}
        if(!next.has(dest))next.set(dest,candidate);
      }
      if(result)break;
    }
    reached=next;
  }
  assert.ok(result,`No reachable solution for ${level.title}`);
  const state=createState(level);
  for(const step of result){
    const fastTime=step.fastFraction*PERIOD;
    // Slow first, fast second; advances split deterministically.
    advance(state,level,PERIOD-fastTime,false);
    advance(state,level,fastTime,true);
    assert.notEqual(state.status,'dead',`${level.title} died on hop ${state.jumps}`);
  }
  assert.equal(state.status,'clear',`${level.title} not cleared`);
  console.log(`PASS stage ${String(levels.indexOf(level)+1).padStart(2,'0')}: ${result.length} jumps; landing x=${state.x.toFixed(0)}`);
}
const l=levels[0],s=createState(l);
assert.equal(predictLanding(s,false),l.start+PERIOD*SLOW_SPEED);
advance(s,l,.32,false);assert.equal(s.jumps,0);assert.ok(s.x>l.start);
console.log('PASS: 6 stage solution simulations + fixed-tempo movement tests');
// Input and landing semantics regression tests.
{
  const a=createState(levels[0]);
  // All slow: safely lands twice, then drops into the first hole.
  for(let n=0;n<3;n++)advance(a,levels[0],PERIOD,false);
  assert.equal(a.status,'dead');assert.equal(a.jumps,3);
  const b=createState(levels[0]);
  advance(b,levels[0],PERIOD,true);
  assert.equal(b.status,'dead','fast-from-start should overshoot the first safe ledge');
  const c=createState(levels[0]);
  advance(c,levels[0],PERIOD/2,false);
  const preview=predictLanding(c,true);
  assert.ok(preview>predictLanding(c,false),'holding fast must move the predicted landing point');
}

// UX regression: novice-friendly stage 3, no pixel-perfect island entry.
{
 const l=levels[2]; let state=createState(l);
 for(const fast of [false,true,false,true,true,true]){
   advance(state,l,PERIOD,fast);
   if(state.status==='dead')throw new Error('Stage 3 tutorial route dies');
 }
 assert.equal(state.status,'clear');
 const landing=l.start+SLOW_SPEED*PERIOD+FAST_SPEED*PERIOD;
 assert.ok(landing-l.platforms[1][0]>=35,'Stage 3 second island entry too tight');
}
// Star pickups must be possible mid-jump without exact landing on star X.
{
 const l=levels[0],state=createState(l);
 advance(state,l,PERIOD,false);advance(state,l,PERIOD,false);
 advance(state,l,PERIOD,true);
 const ev=advance(state,l,PERIOD,true);
 assert.ok(ev.includes('star') && state.starCount>=1,'Star should collect while passing through');
}

// Reproducible routes, independently jittered input transitions and frame sizes.
const {witnesses,replay}=await import('./solver.mjs');
for(const [index,routes] of witnesses.entries()) {
  assert.equal(routes.length,3);
  for(const route of routes) {
    assert.ok(route.clearance>=13,'Avoid pixel-perfect witnesses');
    const reference=replay(levels[index],route.path);
    assert.equal(reference.state.status,'clear');
    for(const frame of [1/30,1/60,1/120,1/144,.007,.113]) {
      const actual=replay(levels[index],route.path,frame);
      assert.equal(actual.state.status,'clear');
      assert.equal(actual.state.jumps,reference.state.jumps);
      assert.equal(actual.state.starCount,reference.state.starCount);
      assert.deepEqual(actual.events,reference.events);
      assert.ok(Math.abs(actual.state.x-reference.state.x)<1e-7);
    }
    const count=route.input.length-1, jitter=Math.floor(route.jitter*1000)/1000;
    for(let mask=0;mask<2**count;mask++) {
      const shifts=Array.from({length:count},(_,i)=>(mask&(1<<i)?1:-1)*jitter);
      assert.equal(replay(levels[index],route.path,1/60,shifts).state.status,'clear',`Stage ${index+1} jitter ${mask}`);
    }
  }
}
{
  const {landingFailure}=await import('../src/core.mjs');
  const level={start:8,platforms:[[0,100],[200,500]],goal:[300,340],stars:[40,70]};
  for(const [x,safe] of [[8,true],[92,true],[7.999,false],[92.001,false],[208,true]]) assert.equal(isSafe(level,x),safe);
  assert.equal(landingFailure(level,95).reason,'edge');
  assert.equal(landingFailure(level,110).correction,'more-slow');
  assert.equal(landingFailure(level,190).correction,'more-fast');
  const state=createState(level);
  assert.deepEqual(advance(state,level,.6,false),['star','star']);
  assert.equal(state.jumps,0);
  advance(state,level,.18,false);
  assert.equal(state.starCount,2);
  advance(state,level,PERIOD,false);
  assert.equal(state.status,'dead'); assert.equal(state.lastEvent,'fall'); assert.ok(state.failure);
  const saved=JSON.stringify(state);
  assert.deepEqual(advance(state,level,10,true),[]); assert.equal(JSON.stringify(state),saved);
  const fresh=createState(level);
  assert.deepEqual(fresh.collected,[]); assert.equal(fresh.failure,null); assert.equal(fresh.phase,0);
  for(const dt of [0,-1,NaN,Infinity]) assert.deepEqual(advance(fresh,level,dt,true),[]);
  assert.equal(fresh.x,8);
}
{
  const level={start:100,platforms:[[0,1000]],goal:[140,160],stars:[]};
  const state=createState(level);
  advance(state,level,.5,false); assert.equal(state.status,'playing','Passing goal mid-hop cannot clear');
  advance(state,level,PERIOD-.5,false); assert.equal(state.status,'playing','Landing beyond goal cannot clear');
  for(const frame of [PERIOD,1/60,1/144]) {
    const boundary={...level,start:140-SLOW_SPEED*PERIOD};
    const s=createState(boundary); let remaining=PERIOD;
    while(remaining>1e-12) {const dt=Math.min(frame,remaining);advance(s,boundary,dt,false);remaining-=dt;}
    assert.equal(s.status,'clear','Inclusive goal boundary must survive frame subdivision');
  }
  const s=createState(level); advance(s,level,.31,false);
  const prediction=predictLanding(s,true); advance(s,level,PERIOD-.31,true);
  assert.ok(Math.abs(s.x-prediction)<1e-9);
}
console.log('PASS: 18 robust witnesses, input jitter corners, 30/60/120/144 Hz, collision/goal/star/retry contracts');
