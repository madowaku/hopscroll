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
