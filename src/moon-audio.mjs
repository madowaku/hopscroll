// Original procedural recipes. The optional BGM is the campaign's "Love it Rabbit" (えだまめ88, OpenTracks),
// played only when the build put its path on <body data-bgm>; without it the game is cues only.
// [offset seconds, start Hz, end Hz, duration seconds, relative gain]
// Single source of truth for real-time AND offline audio-gain verification.
export const MASTER_GAIN = 0.9;
export const recipes = {
 // Each landing keeps its low body and adds a quieter two-octave layer with the same fall,
 // so phone speakers (which drop most sound under ~300 Hz) still carry it.
 slow:[[0,150,95,.13,.65],[0,600,380,.09,.35]],
 fast:[[0,260,175,.10,.55],[0,1040,700,.07,.32]],
 bridge:[[0,880,880,.23,.38],[0,1320,1320,.16,.12]],
 bonus:[[0,420,560,.17,.55]],
 goal:[[0,523.25,523.25,.13,.42],[.11,659.25,659.25,.13,.38],[.22,783.99,783.99,.18,.35]],
 miss:[[0,330,150,.36,.6]],
 meteor:[[0,1175,1568,.16,.32],[.05,1760,1760,.14,.14]]
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
 let context,master,analyser,voices=[],muted=false,paused=true,played=0,lastCue=null,noise=null;
 let bgm=null,bgmFilter=null,bgmGain=null,bgmMode='',bgmBroken=false;
 const bgmSrc=typeof document!=='undefined'?document.body?.dataset.bgm:undefined;
 function stop(){for(const voice of voices){try{voice.stop();}catch{}}voices=[];}
 // BGM through a low-pass: SLOW = soft and hushed, FAST = the full bright mix, menus further back.
 function startBgm(){
  if(!bgmSrc||bgmBroken||!context)return;
  try{
   if(!bgm){
    bgm=new Audio(bgmSrc);bgm.loop=true;bgm.preload='auto';
    bgm.addEventListener('error',()=>{bgmBroken=true;},{once:true});
    bgmFilter=context.createBiquadFilter();bgmFilter.type='lowpass';bgmFilter.frequency.value=1200;bgmFilter.Q.value=.6;
    bgmGain=context.createGain();bgmGain.gain.value=.0001;
    context.createMediaElementSource(bgm).connect(bgmFilter);bgmFilter.connect(bgmGain);bgmGain.connect(context.destination);
   }
   if(bgm.paused)bgm.play().catch(()=>{});
  }catch{bgmBroken=true;}
 }
 function stopBgm(){try{bgm?.pause();}catch{}}
 function mix(mode){
  if(!bgmGain||mode===bgmMode)return;
  bgmMode=mode;const t=context.currentTime,[cut,vol,tc]={menu:[900,.24,.3],slow:[2300,.38,.22],fast:[9000,.3,.06]}[mode];
  bgmFilter.frequency.setTargetAtTime(cut,t,tc);bgmGain.gain.setTargetAtTime(vol,t,tc);
 }
 // The moment of switching: a short filtered-noise rise for FAST, a softer fall for SLOW.
 function whoosh(up){
  if(muted||paused||context?.state!=='running')return;
  try{
   noise??=(()=>{const b=context.createBuffer(1,context.sampleRate*.3|0,context.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b;})();
   const t=context.currentTime,src=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
   src.buffer=noise;filter.type='bandpass';filter.Q.value=1.3;
   filter.frequency.setValueAtTime(up?520:2300,t);filter.frequency.exponentialRampToValueAtTime(up?2700:420,t+.2);
   gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(up?.12:.06,t+.02);gain.gain.exponentialRampToValueAtTime(.0001,t+.24);
   src.connect(filter);filter.connect(gain);gain.connect(master);src.start(t);src.stop(t+.26);
  }catch{}
 }
 async function activate(){
  paused=false;
  if(muted)return;
  try {
   if(!context){context=factory();master=context.createGain();master.gain.value=MASTER_GAIN;analyser=context.createAnalyser();analyser.fftSize=256;master.connect(analyser);analyser.connect(context.destination);}
   await context.resume();
   // A pending resume must not undo a mute or background transition.
   if(paused||muted){stop();stopBgm();await context.suspend();}else startBgm();
  }catch{/* Unsupported or blocked audio never blocks the game. */}
 }
 function suspend(){paused=true;stop();stopBgm();if(context)void context.suspend().catch(()=>{});}
 function setMuted(value){muted=value;stop();if(muted){stopBgm();if(context)void context.suspend().catch(()=>{});}else if(!paused)void activate();}
 function cue(name){if(!muted&&!paused&&context?.state==='running'){voices.push(...scheduleCue(context,master,name));lastCue=name;}}
 function play(events){
  for(const event of events)if(event.type==='landing'&&!muted&&!paused&&context?.state==='running'){
   stop();voices=scheduleCue(context,master,event.cue,event.hop);played++;lastCue=event.cue;
  }
 }
 return {activate,suspend,setMuted,play,stop,whoosh,mix,cue,get muted(){return muted;},get diagnostics(){
  let peak=0;if(analyser){const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);for(const v of data)peak=Math.max(peak,Math.abs(v));}
  return {state:context?.state||'uninitialized',muted,paused,played,lastCue,peak,bgm:bgmSrc?(bgmBroken?'broken':bgm&&!bgm.paused?'playing':'idle'):'none'};
 }};
}
