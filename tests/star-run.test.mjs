import assert from 'node:assert/strict';
import {PERIOD,isSafe} from '../src/core.mjs';
import {course,gates,referenceSections,referenceLandings,newRun,stepRun,readBest,saveBest,bestKey,createInput} from '../src/star-run-core.mjs';
export function replay(hz=60,shifts=[0,0,0,0,0]) {
 const state=newRun(),trace=[];let time=0,end=0;
 for(const [i,[hops,fast]] of referenceSections.entries()) {
  end+=hops*PERIOD;const until=end+(shifts[i]||0);
  while(time<until-1e-10&&state.status==='playing') {
   const dt=Math.min(1/hz,until-time,PERIOD-state.phase),old=state.jumps;
   stepRun(state,dt,fast);time+=dt;
   if(state.jumps!==old){const p=course.platforms.find(([a,b])=>state.x>=a+8-1e-8&&state.x<=b-8+1e-8);trace.push({hop:state.jumps,time:+time.toFixed(3),x:+state.x.toFixed(3),margin:p?+Math.min(state.x-p[0]-8,p[1]-8-state.x).toFixed(3):null,gates:state.gates,stars:state.starCount});}
  }
 }
 return {state,trace};
}
const reference=replay();
assert.equal(reference.state.status,'clear');assert.equal(reference.state.jumps,24);assert.equal(reference.state.gates,gates.length);
assert.ok(reference.trace.every(t=>t.margin>=18));
for(const hz of [30,60,120,144])for(let mask=0;mask<32;mask++){
 const {state,trace}=replay(hz,Array.from({length:5},(_,i)=>(mask>>i&1)?.05:-.05));
 assert.equal(state.status,'clear',`hz ${hz} mask ${mask}`);assert.equal(state.jumps,24);assert.ok(trace.every(t=>t.margin>=18));assert.equal(state.gates,gates.length);
}
for(const fast of [false,true]){const s=newRun();stepRun(s,40,fast);assert.equal(s.status,'dead',`constant ${fast} must fail`);}
assert.ok(referenceLandings.every(x=>isSafe(course,x)));
assert.ok(course.platforms.every(([a,b],i)=>b-a>16&&(!i||a>course.platforms[i-1][1])));
const slow=newRun();stepRun(slow,PERIOD*3,false);assert.equal(slow.gates,0);stepRun(slow,PERIOD,false);assert.equal(slow.status,'dead');assert.equal(slow.gates,0);
const done=JSON.stringify(reference.state);stepRun(reference.state,10,true);assert.equal(JSON.stringify(reference.state),done);
const input=createInput();input.keys.add('Space');input.pointers.add(1);assert.equal(input.fast,true);input.reset();assert.equal(input.fast,false);
const fresh=newRun();assert.equal(fresh.gates,0);assert.equal(fresh.starCount,0);assert.deepEqual(fresh.passed,[]);
const storage={value:null,getItem(){return this.value;},setItem(k,v){assert.equal(k,bestKey);this.value=v;}};
assert.deepEqual(readBest(storage),{gates:0,stars:0});let best=saveBest(storage,readBest(storage),{gates:3,stars:1});
assert.deepEqual(readBest(storage),best);best=saveBest(storage,best,{gates:3,stars:2});assert.equal(best.stars,2);assert.equal(saveBest(storage,best,{gates:2,stars:9}).gates,3);
for(const value of ['oops','null','{"gates":-1,"stars":0}','{"gates":999,"stars":0}']){storage.value=value;assert.deepEqual(readBest(storage),{gates:0,stars:0});}
const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};assert.deepEqual(readBest(blocked),{gates:0,stars:0});assert.deepEqual(saveBest(blocked,{gates:0,stars:0},{gates:1,stars:0}),{gates:1,stars:0});
// Stars are optional: the same winning physics with no pickups still completes.
const noStars=newRun();noStars.collected=Array.from({length:12},(_,i)=>i);for(const [hops,fast]of referenceSections)stepRun(noStars,hops*PERIOD,fast);assert.equal(noStars.status,'clear');assert.equal(noStars.starCount,0);
console.log('PASS STAR RUN: 24 hops; 128 frame/jitter routes; margins >=18; constant-input failures; gates; optional stars; reset/storage');
if(process.argv.includes('--trace'))console.log(JSON.stringify(reference.trace,null,2));
// Credit only after landing; never twice, even on the long middle runway.
{
 const s=newRun();stepRun(s,3*PERIOD,false);stepRun(s,PERIOD-.01,true);assert.equal(s.gates,0);stepRun(s,.01,true);assert.equal(s.gates,1);
 stepRun(s,4*PERIOD,true);assert.equal(s.gates,5);stepRun(s,4*PERIOD,false);assert.equal(s.gates,5);
 stepRun(s,PERIOD,false);assert.equal(s.status,'dead');assert.equal(s.gates,5);
}
