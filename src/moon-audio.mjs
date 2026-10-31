// Original procedural recipes; no sampled or third-party audio assets.
// [offset seconds, start Hz, end Hz, duration seconds, relative gain]
export const recipes = {
 slow:[[0,150,95,.13,.65]],
 fast:[[0,260,175,.10,.55]],
 bridge:[[0,880,880,.23,.38],[0,1320,1320,.16,.12]],
 bonus:[[0,420,560,.17,.55]],
 goal:[[0,523.25,523.25,.13,.42],[.11,659.25,659.25,.13,.38],[.22,783.99,783.99,.18,.35]]
};
export function scheduleCue(context,destination,cue,hop=0) {
 const nodes=[],start=context.currentTime;
 for(const [offset,from,to,duration,volume] of recipes[cue]||[]) {
  const oscillator=context.createOscillator(),gain=context.createGain(),at=start+offset;
  oscillator.type='sine';oscillator.frequency.setValueAtTime(from,at);
  oscillator.frequency.exponentialRampToValueAtTime(to,at+duration);
  oscillator.detune.setValueAtTime([0,8,-6,4][hop%4],at);
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume*.12,at+.008);
  gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  gain.gain.linearRampToValueAtTime(0,at+duration+.01);
  oscillator.connect(gain);gain.connect(destination);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  oscillator.start(at);oscillator.stop(at+duration+.012);nodes.push(oscillator);
 }
 return nodes;
}
export function createMoonAudio(factory=()=>new (window.AudioContext||window.webkitAudioContext)()) {
 let context,master,analyser,voices=[],muted=false,paused=true,played=0,lastCue=null;
 function stop(){for(const voice of voices){try{voice.stop();}catch{}}voices=[];}
 async function activate(){
  paused=false;
  if(muted)return;
  try {
   if(!context){context=factory();master=context.createGain();master.gain.value=.32;analyser=context.createAnalyser();analyser.fftSize=256;master.connect(analyser);analyser.connect(context.destination);}
   await context.resume();
   // A pending resume must not undo a mute or background transition.
   if(paused||muted){stop();await context.suspend();}
  }catch{/* Unsupported or blocked audio never blocks the game. */}
 }
 function suspend(){paused=true;stop();if(context)void context.suspend().catch(()=>{});}
 function setMuted(value){muted=value;stop();if(muted){if(context)void context.suspend().catch(()=>{});}else if(!paused)void activate();}
 function play(events){
  for(const event of events)if(event.type==='landing'&&!muted&&!paused&&context?.state==='running'){
   stop();voices=scheduleCue(context,master,event.cue,event.hop);played++;lastCue=event.cue;
  }
 }
 return {activate,suspend,setMuted,play,stop,get muted(){return muted;},get diagnostics(){
  let peak=0;if(analyser){const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);for(const v of data)peak=Math.max(peak,Math.abs(v));}
  return {state:context?.state||'uninitialized',muted,paused,played,lastCue,peak};
 }};
}
