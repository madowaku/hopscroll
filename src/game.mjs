import {PERIOD,SLOW_SPEED,FAST_SPEED,levels,isSafe,inGoal,predictLanding,createState,advance} from './core.mjs';

const $=id=>document.getElementById(id);
const shell=$('shell'),canvas=$('stage'),ctx=canvas.getContext('2d');
// Small moon-rabbit girl parked on the left + zoomed-out world = more lookahead in the same 360x640 portrait frame.
const CW=360,CH=640,HERO_X=52,FLOOR=385,WORLD_SCALE=.74,HOP_H=92,RABBIT_SCALE=.5;
const overlay=$('overlay'),btn=$('accelerate'),speedIndicator=$('speed-indicator'),tip=$('tip');
const GOAL_KEY='hopscroll-unlocked-v01',MUTE_KEY='hopscroll-muted';
const HOLD_KEYS=['Space','ArrowRight','ArrowUp'];
// "Love it Rabbit" by えだまめ88 (OpenTracks). scripts/build.py inlines it into the itch build when the file is present.
const BGM_SRC='./assets/bgm/love-it-rabbit.mp3';
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let levelIndex=0,state=createState(levels[0]),playing=false,pressed=false,toastUntil=0,time=0,speedFlash=-9;
let soundContext,noiseBuffer,muted=false,ending=null,fails=0,modalAction=null;
// flow: 0 = calm SLOW sky, 1 = full FAST meteor rush. Eased so every speed cue blends instead of popping.
let flow=0,lean=0,ear=-.25,earV=0,landedAt=-9;
let bgm=null,bgmFilter=null,bgmGain=null,bgmMode='',bgmBroken=false;
const holds=new Set(),fx=[],meteors=[],trail=[];
// Deterministic sky so every run (and every screenshot) looks the same.
const rand=(s=>()=>(s=s*16807%2147483647)/2147483647)(20261101);
const SKY_STARS=Array.from({length:84},()=>({x:rand()*420,y:rand()*370,r:.35+rand()*1.25,layer:rand()<.55?0:rand()<.65?1:2,tw:rand()*6.3}));
try{muted=localStorage.getItem(MUTE_KEY)==='1';}catch{}
const pad=n=>String(n).padStart(2,'0');
const unlocked=()=>{try{return Math.min(levels.length-1,+(localStorage.getItem(GOAL_KEY)||0));}catch{return 0;}};
const storeUnlock=n=>{try{localStorage.setItem(GOAL_KEY,String(Math.max(n,unlocked())))}catch{}};

// ---- Layout: keep the 360x640 logical frame and scale it to fit any portrait/landscape viewport.
function fit(){
  const s=Math.min(innerWidth/CW,innerHeight/CH),k=s*Math.min(3,window.devicePixelRatio||1);
  shell.style.setProperty('--fit',s);
  canvas.width=Math.round(CW*k);canvas.height=Math.round(CH*k);ctx.setTransform(canvas.width/CW,0,0,canvas.height/CH,0,0);
}
addEventListener('resize',fit);addEventListener('orientationchange',fit);fit();

// ---- Procedural sound (Web Audio, no assets). Silent when muted; the context is only created on a user gesture.
function audioContext(){
  soundContext??=new (window.AudioContext||window.webkitAudioContext)();
  if(soundContext.state==='suspended')soundContext.resume();
  return soundContext;
}
function tone(freq,{type='triangle',dur=.18,vol=.055,to=.7,delay=0}={}){
  if(muted)return;
  try{
    const c=audioContext(),t=c.currentTime+delay,osc=c.createOscillator(),gain=c.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(Math.max(60,freq*to),t+dur*.75);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(vol,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+dur);
    osc.connect(gain);gain.connect(c.destination);osc.start(t);osc.stop(t+dur+.02);
  }catch{}
}
function swoosh(up){
  if(muted)return;
  try{
    const c=audioContext(),t=c.currentTime;
    noiseBuffer??=(()=>{const b=c.createBuffer(1,c.sampleRate*.3|0,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b;})();
    const src=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
    src.buffer=noiseBuffer;filter.type='bandpass';filter.Q.value=1.3;
    filter.frequency.setValueAtTime(up?520:2300,t);filter.frequency.exponentialRampToValueAtTime(up?2700:420,t+.2);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(up?.1:.05,t+.02);gain.gain.exponentialRampToValueAtTime(.0001,t+.24);
    src.connect(filter);filter.connect(gain);gain.connect(c.destination);src.start(t);src.stop(t+.26);
  }catch{}
}
// BGM runs through a low-pass filter: SLOW = soft and hushed, FAST = the full bright mix. Menus sit further back.
function startBgm(){
  if(muted||bgmBroken)return;
  try{
    if(!bgm){
      const c=audioContext();
      bgm=new Audio(BGM_SRC);bgm.loop=true;bgm.preload='auto';
      bgm.addEventListener('error',()=>{bgmBroken=true;},{once:true});
      bgmFilter=c.createBiquadFilter();bgmFilter.type='lowpass';bgmFilter.frequency.value=1200;bgmFilter.Q.value=.6;
      bgmGain=c.createGain();bgmGain.gain.value=.0001;
      c.createMediaElementSource(bgm).connect(bgmFilter);bgmFilter.connect(bgmGain);bgmGain.connect(c.destination);
    }
    if(bgm.paused)bgm.play().catch(()=>{});
  }catch{bgmBroken=true;}
}
function stopBgm(){try{bgm?.pause();}catch{}}
function mixBgm(){
  const mode=!playing||state.status!=='playing'?'menu':pressed?'fast':'slow';
  if(!bgmGain||mode===bgmMode)return;
  bgmMode=mode;
  const t=soundContext.currentTime,[cut,vol,tc]={menu:[900,.26,.3],slow:[2300,.4,.22],fast:[16000,.5,.06]}[mode];
  bgmFilter.frequency.setTargetAtTime(cut,t,tc);bgmGain.gain.setTargetAtTime(vol,t,tc);
}
function toggleMute(){
  muted=!muted;try{localStorage.setItem(MUTE_KEY,muted?'1':'0')}catch{}
  updateMute();if(muted)stopBgm();else{tone(660,{type:'sine'});startBgm();}
}
function updateMute(){const m=$('mute');m.textContent=muted?'🔇':'🔊';m.setAttribute('aria-pressed',String(muted));m.setAttribute('aria-label',muted?'Unmute sound':'Mute sound');}

// ---- Flow
function reset(index=levelIndex,autoStart=true){
  if(index!==levelIndex)fails=0;
  levelIndex=index;state=createState(levels[index]);ending=null;fx.length=0;trail.length=0;playing=autoStart;releaseAll();updateHud();
  if(autoStart){overlay.classList.add('hidden');modalAction=null;showToast(`STAGE ${pad(index+1)}`,.9)}
}
function showModal({tag,title,message,button,onAction,footer,mood='play'}){
  playing=false;releaseAll();drawIcon(mood);$('modal-tag').textContent=tag;
  $('modal-title').innerHTML=title;$('modal-message').innerHTML=message;
  $('modal-action').textContent=button;$('modal-footer').textContent=footer;
  modalAction=onAction;overlay.classList.remove('hidden');
  try{$('modal-action').focus({preventScroll:true})}catch{}
}
function runModal(){const action=modalAction;modalAction=null;if(!action)return;tone(520,{type:'sine'});startBgm();action();}
$('modal-action').addEventListener('click',runModal);
function intro(){
  showModal({tag:'SLAPJAM #2 · THEME: SPEED',title:'HOP<span>SCROLL</span>',message:'① Michiru hops all by itself.<br/>② Try <em>HOLD</em> and then <em>RELEASE</em>.<br/>③ No gaps yet! First enjoy the speed.',button:'LET\'S HOP →',footer:'Tap · or press SPACE',onAction:()=>reset(0,true)});
}
function pause(){
  if(!playing||state.status!=='playing')return;
  showModal({tag:`STAGE ${pad(levelIndex+1)} · PAUSED`,title:'PAUSED',message:'Take a breath.<br/>Michiru waits for you.',button:'RESUME ▶',footer:'HOLD = FAST · RELEASE = SLOW',
    onAction:()=>{playing=true;overlay.classList.add('hidden');last=performance.now();}});
}
// Short in-world beat before the result card, so the landing (or the fall) is actually seen.
function finish(kind){
  ending={kind,start:time,at:time+(kind==='fail'?.6:1.05)};releaseAll();
  if(kind==='fail'){fails++;tone(260,{dur:.38,to:.45,vol:.07});}
  else{[660,880,1320].forEach((f,i)=>tone(f,{type:i===2?'sine':'triangle',delay:i*.09,dur:.22,to:1,vol:.06}));stardustRise();}
}
// Match the actual missed landing instead of treating every fall as a missed goal.
// The core's correction identifies the nearest safe edge, NOT necessarily a route
// forward. Never present it as a guaranteed solution to the stage.
function failureMessage(level, current, failure) {
  if(current.x > level.goal[1]) {
    return 'You passed the GOAL!<br/><em>Land inside the golden gate, not beyond it.</em>';
  }
  if(!failure) {
    return 'Missed the landing!<br/><em>Watch the NEXT marker and adjust your speed.</em>';
  }
  if(failure.reason === 'edge') {
    return 'So close to the edge!<br/><em>Aim your next landing further inside the platform.</em>';
  }
  // In a gap, returning to the previous ledge and reaching the next one
  // can both be valid. "More FAST/SLOW" alone would mislead the player.
  const betweenPlatforms = level.platforms.some(([,end]) => end < failure.x)
    && level.platforms.some(([start]) => start > failure.x);
  if(betweenPlatforms) {
    return 'You landed in the gap!<br/><em>Try a different HOLD / RELEASE timing.</em>';
  }
  if(failure.reason === 'undershoot') {
    return 'The platform was just ahead!<br/><em>Try adjusting the NEXT landing marker.</em>';
  }
  if(failure.reason === 'overshoot') {
    return 'You went past a platform!<br/><em>Try adjusting the NEXT landing marker.</em>';
  }
  return 'Missed the landing!<br/><em>Watch the NEXT marker and adjust your speed.</em>';
}
function onFail(){
  showModal({
    tag:`STAGE ${pad(levelIndex+1)} · TRY AGAIN`,
    title:'OOPS<span>!</span>',mood:'dizzy',
    message:failureMessage(levels[levelIndex], state, state.failure),
    button:'RETRY ↻',
    footer:'Instant retry. No penalty.',
    onAction:()=>reset(levelIndex,true)
  });
}
function onClear(){
  storeUnlock(levelIndex+1);
  const final=levelIndex===levels.length-1,l=levels[levelIndex];
  showModal({tag:final?'ALL SIX STAGES CLEARED!':`STAGE ${pad(levelIndex+1)} · COMPLETE`,title:final?'SPEED<span>MASTER!</span>':'NICE<span> HOP!</span>',message:final?'You mastered the speed of the world.<br/><em>Thanks for playing!</em>':`Perfect landing! ${state.jumps} hops · ${state.starCount}/${l.stars.length} ★<br/>Ready for a new rhythm?`,button:final?'PLAY AGAIN ↻':'NEXT STAGE →',footer:'HOLD = FAST · RELEASE = SLOW',mood:'happy',onAction:()=>reset(final?0:levelIndex+1,true)});
}

// ---- Input: every finger/key is tracked separately, and anything that can swallow an "up" releases all.
function setPress(on){
  const next=!!on&&playing&&state.status==='playing';
  if(next!==pressed){pressed=next;swoosh(next);speedFlash=time;if(playing&&state.status==='playing')speedBurst(next);}
  btn.classList.toggle('pressed',pressed);speedIndicator.classList.toggle('fast',pressed);
  $('speed-label').textContent=pressed?'FAST':'SLOW';$('speed-number').textContent=pressed?'2.6×':'1.0×';
}
function hold(id,on){if(on)holds.add(id);else holds.delete(id);setPress(holds.size>0);}
function releaseAll(){holds.clear();setPress(false);}
for(const el of [btn,canvas]){
  el.addEventListener('pointerdown',e=>{if(!playing||e.button>0)return;e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch{}hold('p'+e.pointerId,true);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(name,e=>hold('p'+e.pointerId,false));
}
for(const name of ['pointerup','pointercancel'])addEventListener(name,e=>hold('p'+e.pointerId,false));
shell.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('blur',releaseAll);
document.addEventListener('visibilitychange',()=>{if(document.hidden){releaseAll();pause();stopBgm();}});
addEventListener('pagehide',()=>{releaseAll();pause();stopBgm();});
addEventListener('keydown',e=>{
  if(!overlay.classList.contains('hidden')){if((e.code==='Space'||e.code==='Enter')&&!e.repeat){e.preventDefault();runModal();}return;}
  if(HOLD_KEYS.includes(e.code)){e.preventDefault();if(!e.repeat)hold('k'+e.code,true);}
  if(e.code==='KeyR')reset(levelIndex,true);
  if(e.code==='KeyM')toggleMute();
});
addEventListener('keyup',e=>{if(HOLD_KEYS.includes(e.code)){e.preventDefault();hold('k'+e.code,false);}});
$('restart').addEventListener('click',e=>{e.currentTarget.blur();reset(levelIndex,true);});
$('mute').addEventListener('click',e=>{e.currentTarget.blur();toggleMute();});

// ---- Coaching: Stage 1 teaches the controls; Stage 2 is the first gap and receives
// contextual help from attempt 1. Stages 3+ only show rescue cues after 3 misses.
const landingScore=(level,x)=>(level.practice&&!state.triedRelease?1:inGoal(level,x)?2:isSafe(level,x)?1:0);
function advice(level){
  if(level.practice && playing && state.status==='playing'){
    if(!state.triedFast) return 'hold';
    if(!state.triedRelease) return 'release';
    return null;
  }
  if(!playing||state.status!=='playing'||(levelIndex>1&&fails<3))return null;
  const now=landingScore(level,predictLanding(state,pressed)),other=landingScore(level,predictLanding(state,!pressed));
  return other>now?(pressed?'release':'hold'):null;
}
function showToast(t,seconds=.8){$('toast').textContent=t;toastUntil=performance.now()/1000+seconds;$('toast').classList.add('visible');}
const setText=(el,text)=>{if(el.textContent!==text)el.textContent=text;};
function updateHud(){
  const l=levels[levelIndex],cue=advice(l);
  setText($('stage-name'),`${pad(levelIndex+1)} / ${pad(levels.length)} · ${l.title}`);
  $('progress-bar').style.width=`${Math.max(0,Math.min(100,(state.x-l.start)/(l.goal[0]-l.start)*100))}%`;
  btn.classList.toggle('cue',cue==='hold');btn.classList.toggle('cue-release',cue==='release');tip.classList.toggle('cue',!!cue);
  let text=l.hint;
  if(cue==='hold')text='▼ HOLD NOW! · 押しっぱなし!';
  else if(cue==='release')text='LET GO! · 指を離して減速';
  else if(l.practice)text=state.triedRelease?'Nice! Land past the GOLD line · 金色のラインへ':'Try FAST and SLOW · 押す・離すを試そう!';
  setText(tip,text);
}

// ---- Effects (world-space x so particles stay where they were born while the lane scrolls)
function spawn(p){if(fx.length<260)fx.push({vx:0,vy:0,g:0,size:3,life:.6,age:0,...p});}
const starY=i=>FLOOR-92+(reduceMotion?0:Math.sin(time*3.4+i)*5);
const toWorld=dx=>dx/WORLD_SCALE;
function starBurst(i){
  const l=levels[levelIndex],x=l.stars[i],y=starY(i);
  spawn({kind:'ring',x,y,life:.45,color:'#fff3b0'});spawn({kind:'text',x,y:y-18,vy:-55,life:.8,text:'+★'});
  if(!reduceMotion)for(let n=0;n<14;n++){const a=n/14*Math.PI*2;spawn({kind:'mote',x,y,vx:Math.cos(a)*150,vy:Math.sin(a)*150,g:120,life:.5,size:2.4,color:n%2?'#fff6c4':'#ffd84a'});}
  // Clear bell chime: two pure partials with a longer tail.
  tone(1318,{type:'sine',to:1,vol:.075,dur:.32});tone(1976,{type:'sine',to:1,vol:.045,dur:.42,delay:.06});
  showToast(`★ ${state.starCount} / ${l.stars.length}`,.6);
}
function dust(){if(reduceMotion)return;for(let n=0;n<7;n++)spawn({kind:'mote',x:state.x+toWorld((n-3)*4),y:FLOOR-2,vx:(n-3)*26,vy:-22-Math.random()*22,g:50,life:.4,size:2,color:n%2?'#dff4ff':'#9fd8ff'});}
// The moment of switching: FAST kicks a ring of stardust off the cloak, SLOW lets it puff out and fade.
function speedBurst(fast){
  const y=FLOOR-4-Math.sin(Math.PI*state.phase/PERIOD)*HOP_H-12,x=state.x+toWorld(-11);
  spawn({kind:'ring',x,y,life:fast?.3:.45,color:fast?'#bdf1ff':'#e6dcff',grow:fast?40:22});
  if(reduceMotion)return;
  for(let n=0;n<(fast?10:7);n++){const a=Math.PI*(.5+n/(fast?9:6));spawn({kind:'mote',x,y,vx:Math.cos(a)*(fast?170:60),vy:Math.sin(a)*(fast?120:40),g:fast?0:-20,life:fast?.35:.7,size:fast?2.2:1.8,color:fast?'#fff8d6':'#d9d3ff'});}
}
function stardustRise(){
  const [g1,g2]=levels[levelIndex].goal,colors=['#ffd84a','#fff7dc','#bfe8ff','#ffe9a8'];
  const cx=levels[levelIndex].practice?state.x:(g1+g2)/2;
  for(let n=0;n<(reduceMotion?0:54);n++)spawn({kind:'mote',x:cx+(Math.random()-.5)*150,y:FLOOR-2-Math.random()*20,vx:(Math.random()-.5)*50,vy:-60-Math.random()*190,g:-25,life:1.2+Math.random()*.6,size:1.6+Math.random()*2.4,color:colors[n%colors.length]});
  spawn({kind:'ring',x:state.x,y:FLOOR-20,life:.5,color:'#ffd84a',grow:40});
}
function stepFx(dt){
  for(let i=fx.length-1;i>=0;i--){const p=fx[i];p.age+=dt;if(p.age>=p.life){fx.splice(i,1);continue}p.vy+=p.g*dt;p.x+=toWorld(p.vx*dt);p.y+=p.vy*dt;}
  for(let i=meteors.length-1;i>=0;i--){const m=meteors[i];m.age+=dt;if(m.age>=m.life){meteors.splice(i,1);continue}m.x+=m.vx*dt;m.y+=m.vy*dt;}
  if(reduceMotion)return;
  // Shooting stars only while the world is rushing.
  if(flow>.35&&Math.random()<dt*3.2*flow)meteors.push({x:150+Math.random()*260,y:20+Math.random()*190,vx:-560-Math.random()*240,vy:150+Math.random()*80,life:.55,age:0,len:.05+Math.random()*.04});
  // Stardust shed by the cloak: a thin wisp when SLOW, a long glittering stream when FAST.
  if(playing&&state.status==='playing'&&Math.random()<dt*(5+55*flow)){
    const y=FLOOR-4-Math.sin(Math.PI*state.phase/PERIOD)*HOP_H-12;
    spawn({kind:'mote',x:state.x+toWorld(-12),y:y+(Math.random()-.5)*6,vx:-10-30*flow,vy:(Math.random()-.5)*16,g:-6,life:.3+.75*flow,size:1.2+Math.random()*1.6,color:Math.random()<.5?'#fff3c0':'#cfefff'});
  }
}

// ---- Drawing
function rounded(x,y,w,h,r,fill,g=ctx){if(w<=0||h<=0)return;g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();}
function drawBg(camera){
  // Deep navy -> blue-violet -> pale aqua haze at the lane, then a dark void below it so gaps read instantly.
  const bg=ctx.createLinearGradient(0,0,0,FLOOR);bg.addColorStop(0,'#0a1230');bg.addColorStop(.55,'#1d2160');bg.addColorStop(.88,'#33508a');bg.addColorStop(1,'#5d93b8');
  ctx.fillStyle=bg;ctx.fillRect(0,0,CW,FLOOR);
  const nebula=(x,y,r,c)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,'#00000000');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);};
  const drift=((camera*.012)%520+520)%520;
  nebula(250-drift,150,150,'#7a4fd833');nebula(770-drift,90,170,'#4fb5d82a');nebula(90-drift+520,260,130,'#c06ad022');
  ctx.globalAlpha=.5;ctx.fillStyle='#e9eef8';ctx.beginPath();ctx.arc(236-camera*.006%40,222,20,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.1;ctx.beginPath();ctx.arc(236-camera*.006%40,222,34,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  // Three parallax star layers; while FAST they smear into streaks, while SLOW they twinkle.
  const par=[.03,.09,.2],streak=reduceMotion?0:flow;
  ctx.lineCap='round';
  for(const s of SKY_STARS){
    const x=((s.x-camera*par[s.layer])%420+420)%420-30,a=.35+.5*(reduceMotion?.5:.5+.5*Math.sin(time*1.7+s.tw))*(1-streak*.4);
    ctx.globalAlpha=a;ctx.strokeStyle=ctx.fillStyle=s.layer===2?'#fff6dc':'#dfe8ff';
    const len=streak*(4+s.layer*16);
    if(len>1){ctx.lineWidth=s.r*1.4;ctx.beginPath();ctx.moveTo(x,s.y);ctx.lineTo(x+len,s.y);ctx.stroke();}
    else{ctx.beginPath();ctx.arc(x,s.y,s.r,0,Math.PI*2);ctx.fill();}
  }
  ctx.globalAlpha=1;
  for(const m of meteors){const k=1-m.age/m.life,tx=m.x-m.vx*m.len,ty=m.y-m.vy*m.len,g=ctx.createLinearGradient(m.x,m.y,tx,ty);
    g.addColorStop(0,`rgba(255,250,225,${.9*k})`);g.addColorStop(1,'rgba(160,210,255,0)');ctx.strokeStyle=g;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(tx,ty);ctx.stroke();}
  const haze=ctx.createLinearGradient(0,FLOOR-90,0,FLOOR);haze.addColorStop(0,'#8fd3ff00');haze.addColorStop(1,`rgba(143,211,255,${.16+.12*flow})`);ctx.fillStyle=haze;ctx.fillRect(0,FLOOR-90,CW,90);
  const void_=ctx.createLinearGradient(0,FLOOR,0,CH);void_.addColorStop(0,'#090d26');void_.addColorStop(1,'#03050f');ctx.fillStyle=void_;ctx.fillRect(0,FLOOR,CW,CH-FLOOR);
}
const worldX=(world,camera)=>HERO_X+(world-camera-HERO_X)*WORLD_SCALE;
// Meteor lane: the bright top line spans exactly the SAFE part of each platform (8px in from both ends, as in isSafe).
function drawPlatforms(level,camera){
  for(let i=0;i<level.platforms.length;i++){const [a,b0]=level.platforms[i],b=level.practice?Math.max(b0,state.x+1000):b0,sx=worldX(a,camera),ex=worldX(b,camera);if(ex<-10||sx>370)continue;
    const w=ex-sx,safeL=worldX(a+8,camera),safeR=worldX(b-8,camera);
    const under=ctx.createLinearGradient(0,FLOOR,0,FLOOR+120);under.addColorStop(0,`rgba(110,190,255,${.55+.2*flow})`);under.addColorStop(1,'rgba(110,190,255,0)');
    ctx.fillStyle=under;ctx.fillRect(sx,FLOOR+6,w,120);
    const body=ctx.createLinearGradient(0,FLOOR,0,FLOOR+14);body.addColorStop(0,'#b9e4ff');body.addColorStop(1,'#3f6fc4');
    rounded(sx,FLOOR,w,14,6,body);
    // Glowing safe surface line.
    ctx.fillStyle=`rgba(190,235,255,${.35+.2*flow})`;ctx.fillRect(safeL,FLOOR-3,safeR-safeL,5);
    ctx.fillStyle='#f6fcff';ctx.fillRect(safeL,FLOOR-1,safeR-safeL,2.5);
    // Flow dashes ride with the world; FAST stretches them into meteor streaks.
    ctx.fillStyle='#ffffffb0';const len=4+(reduceMotion?0:flow*18);
    for(let xx=a+14;xx<b-10;xx+=26){const d=worldX(xx,camera);if(d>=-30&&d<=365)ctx.fillRect(d,FLOOR+6,Math.min(len,ex-d-2),1.6);}
  }
}
// Golden STAR GATE: two pillars, an arch crowned with a big star, and a gold landing pad. Arrows point DOWN: land, don't fly through.
function drawGoal(level,camera){
  // Practice has no hazards. Once both speeds are tried, a wide finish line
  // appears and ANY landing beyond the line counts. It cannot be overshot.
  if(level.practice){
    if(!state.triedRelease)return;
    const gx=worldX(level.goal[0],camera),from=Math.max(0,gx);
    if(from<CW){ctx.fillStyle='#ffd84a';ctx.globalAlpha=.85;ctx.fillRect(from,FLOOR-3,CW-from,8);ctx.globalAlpha=1;}
    if(gx>-40&&gx<CW+10){
      rounded(gx-3,FLOOR-112,6,112,3,'#ffd665');
      glowStar(gx,FLOOR-122,15,'#ffd84a',time*.8);
      ctx.fillStyle='#fff4be';ctx.font='900 13px system-ui';ctx.textAlign='center';
      ctx.fillText('FINISH →',Math.min(290,gx+50),FLOOR-70);
    }
    return;
  }
  const [g1,g2]=level.goal,gl=worldX(g1,camera),gr=worldX(g2,camera),w=gr-gl,cx=(gl+gr)/2;
  if(gr<-40||gl>400)return;
  const beam=ctx.createLinearGradient(0,FLOOR-130,0,FLOOR);beam.addColorStop(0,'#ffd65a00');beam.addColorStop(1,'#ffd65a4d');
  ctx.fillStyle=beam;ctx.fillRect(gl,FLOOR-130,w,130);
  // Gold landing pad on the lane surface.
  rounded(gl,FLOOR-4,w,10,4,'#ffcf4a');ctx.fillStyle='#fff3c4';
  for(let x=gl+6;x<gr-6;x+=14)ctx.fillRect(x,FLOOR-2,7,3);
  // Pillars and arch.
  for(const px of [gl-3,gr-3])rounded(px,FLOOR-118,6,116,3,'#ffd665');
  ctx.strokeStyle='#ffd665';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(cx,FLOOR-116,w/2,26,0,Math.PI,0);ctx.stroke();
  ctx.font='1000 12px system-ui';ctx.textAlign='center';const tw=ctx.measureText('GOAL').width+14;
  rounded(cx-tw/2,FLOOR-130,tw,18,8,'#ffd665');ctx.fillStyle='#29334d';ctx.textBaseline='middle';ctx.fillText('GOAL',cx,FLOOR-120.5);ctx.textBaseline='alphabetic';
  glowStar(cx,FLOOR-158,15,'#ffd84a',reduceMotion?0:Math.sin(time*1.6)*.2);
  const bob=reduceMotion?0:Math.abs(Math.sin(time*4))*7;
  ctx.fillStyle='#fff3c4';ctx.font='900 10px system-ui';ctx.fillText('LAND HERE',cx,FLOOR-80);
  ctx.fillStyle='#ffd665';for(let k=0;k<2;k++){const y=FLOOR-62+k*12+bob;ctx.beginPath();ctx.moveTo(cx-9,y);ctx.lineTo(cx+9,y);ctx.lineTo(cx,y+8);ctx.closePath();ctx.globalAlpha=k?.6:1;ctx.fill();}ctx.globalAlpha=1;
}
function drawStar(x,y,r1,r2,color,rot=0,g=ctx){g.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2+rot,r=i%2===0?r1:r2;g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}g.closePath();g.fillStyle=color;g.fill();}
function glowStar(x,y,r,color,rot=0){
  const glow=ctx.createRadialGradient(x,y,2,x,y,r*2.1);glow.addColorStop(0,'#fff2a0cc');glow.addColorStop(1,'#ffd84a00');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r*2.1,0,Math.PI*2);ctx.fill();
  drawStar(x,y,r,r*.47,color,rot);ctx.strokeStyle='#fffbe0';ctx.lineWidth=2;ctx.stroke();drawStar(x,y,r*.4,r*.2,'#fffbe8',rot);
}
function drawStars(level,camera){
  for(let i=0;i<level.stars.length;i++){const x=worldX(level.stars[i],camera);
    if(x<-30||x>390||state.collected.includes(i))continue;
    const pulse=reduceMotion?1:1+Math.sin(time*5+i)*.08;
    glowStar(x,starY(i),16*pulse,'#ffd84a',reduceMotion?0:Math.sin(time*2+i)*.15);
  }
}
function drawForecast(level,camera){
  if(!playing||state.status!=='playing')return;
  const v=pressed?FAST_SPEED:SLOW_SPEED,remain=PERIOD-state.phase,predicted=predictLanding(state,pressed);
  const score=landingScore(level,predicted),color=['#ff7d8f','#a6f5d6','#ffd84a'][score];
  // The rest of the current hop at the held speed: re-aimed the instant the button changes.
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash([3,5]);ctx.globalAlpha=.8;ctx.beginPath();
  for(let i=1;i<=18;i++){const t=remain*i/18,p=(state.phase+t)/PERIOD,x=worldX(state.x+v*t,camera),y=FLOOR-12-Math.sin(Math.PI*p)*HOP_H;i===1?ctx.moveTo(x,y):ctx.lineTo(x,y);}
  ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
  // Faint ring: where the other speed would land.
  const alt=worldX(predictLanding(state,!pressed),camera);
  if(alt>-20&&alt<380){ctx.strokeStyle='#ffffff55';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(alt,FLOOR-2,11,3.5,0,0,Math.PI*2);ctx.stroke();}
  const sx=worldX(predicted,camera);if(sx<-20||sx>380)return;
  const ring=reduceMotion?1:1+Math.sin(time*10)*.08;
  ctx.beginPath();ctx.ellipse(sx,FLOOR-2,18*ring,5*ring,0,0,Math.PI*2);ctx.fillStyle=color+'66';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.stroke();
  ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx,FLOOR-12);ctx.lineTo(sx,FLOOR-40);ctx.stroke();
  if(score===0){ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx-6,FLOOR-8);ctx.lineTo(sx+6,FLOOR+4);ctx.moveTo(sx+6,FLOOR-8);ctx.lineTo(sx-6,FLOOR+4);ctx.stroke();}
  const label=['MISS!','NEXT','GOAL!'][score];
  ctx.font='900 11px system-ui';ctx.textAlign='center';const tw=ctx.measureText(label).width+12;
  rounded(sx-tw/2,FLOOR-58,tw,17,8,'#0b1d2ecc');ctx.fillStyle=color;ctx.fillText(label,sx,FLOOR-45.5);
}
// Michiru: right-facing human rabbit girl, origin at feet. Body is 2.7 heads tall.
// Internal coordinates give a 60px upright silhouette at the unchanged RABBIT_SCALE.
function michiruShape(g,{earA=-.25,mood='play',glow=10,flow=0}={}){
  const white='#F4F0E7',lilac='#BFB7E8',navy='#243052',skin='#ffe5da',pink='#efb9ca';
  const f=Math.max(0,Math.min(1,flow));
  g.save();g.lineJoin='round';g.lineCap='round';
  const path=(d,color,rim=true)=>{const p=new Path2D(d);g.fillStyle=color;
    if(rim){g.strokeStyle='#d6edff';g.lineWidth=1.5;g.shadowColor='#c9eaff';g.shadowBlur=Math.min(glow,3);g.stroke(p);}
    g.shadowBlur=0;g.fill(p);};
  // Two human legs and small boots; soles stay at the original foot origin.
  path('M -10 -29 L -1 -29 L -3 -5 L -12 -5 Z',skin);
  path('M 5 -28 L 14 -28 L 12 -5 L 4 -5 Z',skin);
  path('M -12 -9 Q -6 -7 -2 -8 L 0 -2 Q -5 1 -15 -1 Z',white);
  path('M 4 -9 L 12 -9 Q 14 -4 18 -3 L 18 0 L 3 0 Z',white);
  // Navy lining, crescent hem and a broad trailing sleeve, lifted by FAST.
  path(`M -8 -64 Q -23 -53 ${-29-13*f} ${-26-20*f} Q -6 -16 19 -29 L 12 -60 Z`,navy);
  path(`M -7 -65 Q -22 -57 ${-31-15*f} ${-27-21*f} Q -17 -34 -11 -29 Q 2 -13 22 -31 Q 8 -31 13 -60 Z`,lilac);
  path(`M -9 -61 Q -23 -61 ${-38-12*f} ${-40-15*f} Q -33 -22 -14 -37 L 2 -53 Z`,white);
  // Thin sash and its trailing ends; gold occupies very little area.
  path(`M -12 -43 Q -22 ${-43-7*f} ${-34-16*f} ${-36-16*f} L -27 ${-33-16*f} Q -20 -41 -10 -40 Z`,'#FFD879',false);
  path('M -12 -45 Q 1 -42 14 -46 L 14 -43 Q 0 -39 -12 -42 Z','#FFD879',false);
  // Short silver bob and human face (no muzzle).
  path('M -17 -65 Q -26 -84 -14 -93 Q 4 -105 19 -88 L 23 -64 Q 15 -57 -17 -65 Z',white);
  // Far anatomical left ear: only the tip folds, with extra droop at SLOW.
  g.save();g.translate(-14,-91);g.rotate(earA*.75-.12);
  path('M -4 2 Q -6 -9 -6 -20 Q -6 -27 -12 -24 L -19 -13 Q -20 -8 -15 -10 L -10 -16 L 4 2 Z',white);
  path('M -1 -2 L -9 -21 L -15 -12 L -10 -14 L 1 -2 Z',pink,false);g.restore();
  // Near anatomical right ear remains straight; spring sweeps both backward at FAST.
  g.save();g.translate(5,-94);g.rotate(earA*.85);
  path('M -5 4 Q -9 -12 -4 -24 Q 0 -30 4 -24 Q 9 -10 5 4 Z',white);
  path('M -2 -1 Q -5 -14 0 -23 Q 5 -12 2 -1 Z',pink,false);g.restore();
  path('M -9 -88 Q 12 -94 20 -81 L 24 -73 Q 23 -61 10 -60 Q -6 -61 -11 -73 Z',skin,false);
  path('M -19 -78 Q -21 -100 2 -97 Q 19 -97 22 -81 L 14 -85 L 12 -77 L 4 -88 Q 0 -76 -8 -74 L -7 -64 Q -19 -63 -19 -78 Z',white);
  g.strokeStyle='#49302b';g.fillStyle='#49302b';g.lineWidth=1.8;
  for(const x of [8,19]){
    g.beginPath();
    if(mood==='happy'){g.moveTo(x-2,-74);g.quadraticCurveTo(x,-78,x+2,-74);g.stroke();}
    else if(mood==='dizzy'){g.moveTo(x-2,-79);g.lineTo(x+2,-74);g.moveTo(x+2,-79);g.lineTo(x-2,-74);g.stroke();}
    else{g.ellipse(x,-76,2.4,3.5,0,0,Math.PI*2);g.fill();}
  }
  g.beginPath();g.moveTo(13,-67);g.quadraticCurveTo(15,mood==='happy'?-63:-66,17,-67);g.stroke();
  path('M 3 -70 Q 8 -73 10 -70 Q 8 -67 3 -70 Z',pink,false);
  // Front sleeve cups the skewer. Three distinct dumplings stay with her in every mood.
  path(`M 9 -58 Q -4 -55 ${-5-8*f} -38 Q 10 -35 24 -49 L 22 -57 Q 18 -52 9 -58 Z`,white);
  path('M 22 -47 L 24 -67 L 26 -67 L 24 -46 Z','#b38c62',false);
  for(const [x,y,c] of [[25,-68,white],[26,-77,white],[27,-86,pink]]){
    g.beginPath();g.arc(x,y,4.5,0,Math.PI*2);g.fillStyle=c;g.strokeStyle=navy;g.lineWidth=1;g.fill();g.stroke();
  }
  path('M 19 -54 Q 20 -60 25 -58 Q 29 -54 25 -50 L 21 -49 Z',skin,false);
  g.restore();
}
function drawTrail(camera){
  // Comet tail along the rabbit's real recent path: longer and brighter while FAST.
  const span=.1+.32*flow;
  let prev=null;ctx.lineCap='round';
  for(const p of trail){const age=time-p.t;if(age>span){prev=null;continue}
    const x=worldX(p.x,camera),k=1-age/span;
    if(prev){ctx.strokeStyle=`rgba(255,244,200,${(.12+.5*flow)*k})`;ctx.lineWidth=1+7*k*(.35+.65*flow);ctx.beginPath();ctx.moveTo(prev[0],prev[1]);ctx.lineTo(x,p.y);ctx.stroke();}
    prev=[x,p.y];
  }
}
function drawRabbit(dt){
  const p=state.phase/PERIOD,live=playing&&state.status==='playing';
  let hop=live?Math.sin(Math.PI*p)*HOP_H:reduceMotion?0:Math.abs(Math.sin(time*2.4))*16,drop=0;
  if(ending?.kind==='clear')hop=reduceMotion?0:Math.abs(Math.sin((time-ending.start)*9))*20;
  if(ending?.kind==='fail'){const t=time-ending.start;hop=0;drop=t*t*1100;}
  // Stretch with vertical speed in the air; springy "puni" squash right after each landing.
  const vy=live?Math.cos(Math.PI*p):0,st=reduceMotion?0:.09*Math.abs(vy);
  const since=time-landedAt,squash=reduceMotion||since>.5?0:.24*Math.exp(-since*13)*Math.cos(since*30);
  const sx=(1-st*.6)*(1+squash),sy=(1+st)*(1-squash);
  // Ears: a damped spring toward "swept back" (FAST, or rising) and "perked up" (SLOW, falling) — so they float back softly.
  const target=-.22-1.05*flow-.28*vy;
  if(reduceMotion)ear=target;else{earV+=(target-ear)*170*dt;earV*=Math.exp(-11*dt);ear+=earV*dt;}
  lean+=((reduceMotion?0:.2*flow)-lean)*Math.min(1,dt*12);
  const foot=FLOOR-4-hop+drop;
  if(!drop){ctx.globalAlpha=Math.max(.12,.45-hop/240);ctx.fillStyle='#a9dcff';ctx.beginPath();ctx.ellipse(HERO_X,FLOOR,Math.max(7,15-hop*.07),3,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  ctx.save();ctx.translate(HERO_X,foot);ctx.rotate(lean+(drop?Math.min(1.2,drop/120):0));ctx.scale(RABBIT_SCALE*sx,RABBIT_SCALE*sy);
  michiruShape(ctx,{earA:ear,flow,mood:ending?.kind==='clear'?'happy':ending?.kind==='fail'?'dizzy':'play'});
  ctx.restore();
}
// Rhythm wheel always counts down with the SAME period, independent of speed. Parked under the HUD, away from the rabbit.
function drawRhythm(){
  const p=state.phase/PERIOD,xx=32,yy=124;
  ctx.lineWidth=4;ctx.strokeStyle='#eef7e52b';ctx.beginPath();ctx.arc(xx,yy,14,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#ffe09a';ctx.beginPath();ctx.arc(xx,yy,14,-Math.PI/2,-Math.PI/2+p*Math.PI*2);ctx.stroke();
  ctx.fillStyle='#e8ead6';ctx.font='900 8px system-ui';ctx.textAlign='center';ctx.fillText('HOP',xx,yy+3);
}
function drawFx(camera){
  for(const p of fx){const k=p.age/p.life,x=worldX(p.x,camera);ctx.globalAlpha=Math.max(0,1-k);
    if(p.kind==='ring'){ctx.strokeStyle=p.color;ctx.lineWidth=3*(1-k)+.5;ctx.beginPath();ctx.arc(x,p.y,10+k*(p.grow||34),0,Math.PI*2);ctx.stroke();}
    else if(p.kind==='text'){ctx.fillStyle='#ffe66d';ctx.font='1000 16px system-ui';ctx.textAlign='center';ctx.fillText(p.text,x,p.y);}
    else{ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(x,p.y,p.size*(1-k*.5),0,Math.PI*2);ctx.fill();}
  }
  ctx.globalAlpha=1;
}
function render(dt){
  ctx.clearRect(0,0,CW,CH);const level=levels[levelIndex],camera=state.x-HERO_X;
  drawBg(camera);drawPlatforms(level,camera);drawGoal(level,camera);drawStars(level,camera);drawForecast(level,camera);drawTrail(camera);drawFx(camera);drawRabbit(dt);drawRhythm();
  if(!reduceMotion&&time-speedFlash<.12){ctx.fillStyle=pressed?'#bdf1ff1c':'#c9c0ff14';ctx.fillRect(0,0,CW,CH);}
  if(ending?.kind==='fail'){ctx.fillStyle='#fb7c8c';ctx.globalAlpha=Math.min(.35,(time-ending.start)*1.2);ctx.fillRect(0,0,CW,CH);ctx.globalAlpha=1;}
}
// Card icon: the same Michiru, with the mood of the moment.
// All cards share the Canvas silhouette; generated art is reference-only.
function drawIcon(mood){
  const c=$('hero-icon'),art=$('hero-art');if(!c)return;
  const useArt=false;art?.classList.toggle('hidden',!useArt);c.classList.toggle('hidden',useArt);
  if(useArt)return;
  const g=c.getContext('2d'),k=c.width/120;
  g.setTransform(k,0,0,k,0,0);g.clearRect(0,0,120,120);g.translate(62,111);g.scale(.84,.84);
  michiruShape(g,{earA:mood==='happy'?-.05:mood==='dizzy'?-.6:-.25,mood,glow:14});
}
let last=performance.now();
function tick(now){
  const dt=Math.min(.045,(now-last)/1000);last=now;time=now/1000;
  if(playing&&state.status==='playing'){
    const before=state.collected.length,events=advance(state,levels[levelIndex],dt,pressed);
    for(const i of state.collected.slice(before))starBurst(i);
    if(events.includes('land')||events.includes('clear')){landedAt=time;}
    if(events.includes('land')){tone(400+state.jumps%4*55);dust();}
    if(events.includes('fall'))finish('fail');else if(events.includes('clear'))finish('clear');
    trail.push({x:state.x+toWorld(-6),y:FLOOR-4-Math.sin(Math.PI*state.phase/PERIOD)*HOP_H-14,t:time});
    updateHud();
  }
  while(trail.length&&time-trail[0].t>.5)trail.shift();
  // FAST snaps in quickly; SLOW settles a little slower, so the calm feels like an exhale.
  flow+=((pressed?1:0)-flow)*(1-Math.exp(-(pressed?12:4.5)*dt));
  stepFx(dt);mixBgm();
  if(ending&&time>=ending.at){const kind=ending.kind;ending=null;kind==='fail'?onFail():onClear();}
  if(now/1000>toastUntil)$('toast').classList.remove('visible');
  render(dt);requestAnimationFrame(tick);
}
$('hero-art')?.addEventListener('error',e=>{e.currentTarget.dataset.broken='1';drawIcon('play');});
window.__HOPSCROLL_DEBUG__={levels,createState,advance,isSafe,reset,get state(){return state},get playing(){return playing},get pressed(){return pressed},get bgm(){return bgm&&{paused:bgm.paused,time:bgm.currentTime,mode:bgmMode,broken:bgmBroken}}};
updateMute();intro();updateHud();requestAnimationFrame(tick);
