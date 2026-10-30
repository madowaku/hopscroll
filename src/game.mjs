import {PERIOD,SLOW_SPEED,FAST_SPEED,levels,isSafe,inGoal,predictLanding,createState,advance} from './core.mjs';

const $=id=>document.getElementById(id);
const shell=$('shell'),canvas=$('stage'),ctx=canvas.getContext('2d');
// Smaller bunny parked on the left + zoomed-out world = more lookahead in the same 360x640 portrait frame.
const CW=360,CH=640,HERO_X=52,FLOOR=385,WORLD_SCALE=.74,HOP_H=92,BUNNY_SCALE=.45;
const overlay=$('overlay'),btn=$('accelerate'),speedIndicator=$('speed-indicator'),tip=$('tip');
const GOAL_KEY='hopscroll-unlocked-v01',MUTE_KEY='hopscroll-muted';
const HOLD_KEYS=['Space','ArrowRight','ArrowUp'];
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let levelIndex=0,state=createState(levels[0]),playing=false,pressed=false,toastUntil=0,time=0,lean=0,speedFlash=-9;
let soundContext,noiseBuffer,muted=false,ending=null,fails=0,modalAction=null;
const holds=new Set(),fx=[];
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
function toggleMute(){
  muted=!muted;try{localStorage.setItem(MUTE_KEY,muted?'1':'0')}catch{}
  updateMute();if(!muted)tone(660,{type:'sine'});
}
function updateMute(){const m=$('mute');m.textContent=muted?'🔇':'🔊';m.setAttribute('aria-pressed',String(muted));m.setAttribute('aria-label',muted?'Unmute sound':'Mute sound');}

// ---- Flow
function reset(index=levelIndex,autoStart=true){
  if(index!==levelIndex)fails=0;
  levelIndex=index;state=createState(levels[index]);ending=null;fx.length=0;playing=autoStart;releaseAll();updateHud();
  if(autoStart){overlay.classList.add('hidden');modalAction=null;showToast(`STAGE ${pad(index+1)}`,.9)}
}
function showModal({tag,title,message,button,onAction,footer}){
  playing=false;releaseAll();$('modal-tag').textContent=tag;
  $('modal-title').innerHTML=title;$('modal-message').innerHTML=message;
  $('modal-action').textContent=button;$('modal-footer').textContent=footer;
  modalAction=onAction;overlay.classList.remove('hidden');
  try{$('modal-action').focus({preventScroll:true})}catch{}
}
function runModal(){const action=modalAction;modalAction=null;if(!action)return;tone(520,{type:'sine'});action();}
$('modal-action').addEventListener('click',runModal);
function intro(){
  showModal({tag:'SLAPJAM #2 · THEME: SPEED',title:'HOP<span>SCROLL</span>',message:'① The bunny hops all by itself.<br/>② Try <em>HOLD</em> and then <em>RELEASE</em>.<br/>③ No gaps yet! First enjoy the speed.',button:'LET\'S HOP →',footer:'Tap · or press SPACE',onAction:()=>reset(0,true)});
}
function pause(){
  if(!playing||state.status!=='playing')return;
  showModal({tag:`STAGE ${pad(levelIndex+1)} · PAUSED`,title:'PAUSED',message:'Take a breath.<br/>The bunny waits for you.',button:'RESUME ▶',footer:'HOLD = FAST · RELEASE = SLOW',
    onAction:()=>{playing=true;overlay.classList.add('hidden');last=performance.now();}});
}
// Short in-world beat before the result card, so the landing (or the fall) is actually seen.
function finish(kind){
  ending={kind,start:time,at:time+(kind==='fail'?.6:1.05)};releaseAll();
  if(kind==='fail'){fails++;tone(260,{dur:.38,to:.45,vol:.07});}
  else{[660,880,1320].forEach((f,i)=>tone(f,{type:i===2?'sine':'triangle',delay:i*.09,dur:.22,to:1,vol:.06}));confetti();}
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
    title:'OOPS<span>!</span>',
    message:failureMessage(levels[levelIndex], state, state.failure),
    button:'RETRY ↻',
    footer:'Instant retry. No penalty.',
    onAction:()=>reset(levelIndex,true)
  });
}
function onClear(){
  storeUnlock(levelIndex+1);
  const final=levelIndex===levels.length-1,l=levels[levelIndex];
  showModal({tag:final?'ALL SIX STAGES CLEARED!':`STAGE ${pad(levelIndex+1)} · COMPLETE`,title:final?'SPEED<span>MASTER!</span>':'NICE<span> HOP!</span>',message:final?'You mastered the speed of the world.<br/><em>Thanks for playing!</em>':`Perfect landing! ${state.jumps} hops · ${state.starCount}/${l.stars.length} ★<br/>Ready for a new rhythm?`,button:final?'PLAY AGAIN ↻':'NEXT STAGE →',footer:'HOLD = FAST · RELEASE = SLOW',onAction:()=>reset(final?0:levelIndex+1,true)});
}

// ---- Input: every finger/key is tracked separately, and anything that can swallow an "up" releases all.
function setPress(on){
  const next=!!on&&playing&&state.status==='playing';
  if(next!==pressed){pressed=next;swoosh(next);speedFlash=time;}
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
document.addEventListener('visibilitychange',()=>{if(document.hidden){releaseAll();pause();}});
addEventListener('pagehide',()=>{releaseAll();pause();});
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

// ---- Effects
function spawn(p){if(fx.length<160)fx.push({vx:0,vy:0,g:0,size:3,life:.6,age:0,...p});}
const starY=i=>FLOOR-92+(reduceMotion?0:Math.sin(time*3.4+i)*5);
function starBurst(i){
  const l=levels[levelIndex],x=l.stars[i],y=starY(i);
  spawn({kind:'ring',x,y,life:.45});spawn({kind:'text',x,y:y-18,vy:-55,life:.8,text:'+★'});
  if(!reduceMotion)for(let n=0;n<14;n++){const a=n/14*Math.PI*2;spawn({kind:'spark',x,y,vx:Math.cos(a)*150,vy:Math.sin(a)*150,g:120,life:.5,size:2.5,color:n%2?'#fff6c4':'#ffd84a'});}
  tone(988,{type:'sine',to:1,vol:.08,dur:.12});tone(1480,{type:'sine',to:1,vol:.07,dur:.2,delay:.07});
  showToast(`★ ${state.starCount} / ${l.stars.length}`,.6);
}
function dust(){if(reduceMotion)return;for(let n=0;n<6;n++)spawn({kind:'dust',x:state.x+(n-2.5)*5,y:FLOOR-2,vx:(n-2.5)*22,vy:-25-Math.random()*20,g:60,life:.35,size:3,color:'#d9f3e2'});}
function confetti(){
  const [g1,g2]=levels[levelIndex].goal,colors=['#ffd84a','#ff8fa3','#8ff0cf','#fff7dc','#8fc6ff'];
  for(let n=0;n<(reduceMotion?0:46);n++)spawn({kind:'spark',x:(g1+g2)/2+(Math.random()-.5)*60,y:FLOOR-110,vx:(Math.random()-.5)*360,vy:-120-Math.random()*220,g:420,life:1.1,size:3+Math.random()*2,color:colors[n%colors.length]});
}
function stepFx(dt){for(let i=fx.length-1;i>=0;i--){const p=fx[i];p.age+=dt;if(p.age>=p.life){fx.splice(i,1);continue}p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}}

// ---- Drawing
function rounded(x,y,w,h,r,fill){if(w<=0||h<=0)return;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
function drawBg(camera){
  const bg=ctx.createLinearGradient(0,0,0,CH);bg.addColorStop(0,'#12243b');bg.addColorStop(.6,'#315b72');bg.addColorStop(1,'#182d3f');ctx.fillStyle=bg;ctx.fillRect(0,0,CW,CH);
  ctx.fillStyle='#d8e2e6';for(let i=0;i<35;i++){const x=((i*83+21-camera*.07)%415+415)%415-20,y=15+(i*53)%225;ctx.globalAlpha=.12+(i%5)*.07;ctx.beginPath();ctx.arc(x,y,((i%3)+1)*.6,0,Math.PI*2);ctx.fill();}
  // Pale moon: gold is reserved for stars and the goal.
  ctx.globalAlpha=.32;ctx.fillStyle='#dfe7ee';ctx.beginPath();ctx.arc(292-camera*.015%380,190,28,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  for(let layer=0;layer<3;layer++){
    const yy=293+layer*40,amp=21+layer*9,speed=.04+layer*.05;
    ctx.beginPath();ctx.moveTo(-50,CH);
    for(let x=-50;x<=410;x+=10){ctx.lineTo(x,yy+Math.sin((x+camera*speed)*.013+layer)*amp+Math.sin((x+camera*speed)*.025)*8)}
    ctx.lineTo(410,CH);ctx.closePath();ctx.fillStyle=['#244a5e','#1e4054','#1a354a'][layer];ctx.fill();
  }
  if(pressed&&!reduceMotion){ctx.strokeStyle='#fff2b5';ctx.lineWidth=1.5;for(let i=0;i<14;i++){const x=((i*91-time*620)%450+450)%450-45,y=150+(i*31)%215;ctx.globalAlpha=.12+(i%4)*.08;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+22+(i%3)*14,y);ctx.stroke();}ctx.globalAlpha=1;}
}
const worldX=(world,camera)=>HERO_X+(world-camera-HERO_X)*WORLD_SCALE;
function drawPlatforms(level,camera){
  for(let i=0;i<level.platforms.length;i++){const [a,b0]=level.platforms[i],b=level.practice?Math.max(b0,state.x+1000):b0,sx=worldX(a,camera),ex=worldX(b,camera);if(ex<-10||sx>370)continue;
    // Flat physical collision surfaces: no decorative hitbox surprises.
    ctx.fillStyle='#173b4d';ctx.fillRect(sx,FLOOR+10,ex-sx,185);
    ctx.fillStyle='#2f7778';ctx.fillRect(sx,FLOOR+9,ex-sx,60);
    rounded(sx,FLOOR,ex-sx,15,4,'#84ddb8');
    ctx.fillStyle='#e0efbd';ctx.globalAlpha=.85;
    for(let xx=a+17;xx<b-10;xx+=31){const draw=worldX(xx,camera);if(draw>=-5&&draw<=365){ctx.fillRect(draw,FLOOR+4,8*WORLD_SCALE,2);}}
    ctx.globalAlpha=1;
  }
  ctx.fillStyle='#c25f6e';
  for(let i=0;i<level.platforms.length-1;i++){const xa=worldX(level.platforms[i][1],camera),xb=worldX(level.platforms[i+1][0],camera);
    if(xb<0||xa>360)continue;
    for(let x=xa+8;x<xb-12;x+=16){ctx.beginPath();ctx.moveTo(x,FLOOR+22);ctx.lineTo(x+6,FLOOR+10);ctx.lineTo(x+12,FLOOR+22);ctx.closePath();ctx.fill();}
  }
}
// Finish gate: checkered landing pad + posts + flag, with arrows pointing DOWN onto the pad (land, don't fly through).
function drawGoal(level,camera){
  // Practice has no hazards. Once both speeds are tried, a wide finish line
  // appears and ANY landing beyond the line counts. It cannot be overshot.
  if(level.practice){
    if(!state.triedRelease)return;
    const gx=worldX(level.goal[0],camera),from=Math.max(0,gx);
    if(from<CW){ctx.fillStyle='#ffe17c';ctx.globalAlpha=.78;ctx.fillRect(from,FLOOR-4,CW-from,12);ctx.globalAlpha=1;}
    if(gx>-40&&gx<CW+10){
      rounded(gx-5,FLOOR-125,7,125,3,'#ffe17c');
      ctx.beginPath();ctx.moveTo(gx+2,FLOOR-122);ctx.lineTo(gx+59,FLOOR-108);ctx.lineTo(gx+2,FLOOR-94);ctx.closePath();ctx.fillStyle='#ff8291';ctx.fill();
      ctx.fillStyle='#fff4be';ctx.font='900 13px system-ui';ctx.textAlign='center';
      ctx.fillText('FINISH →',Math.min(290,gx+50),FLOOR-70);
    }
    return;
  }
  const [g1,g2]=level.goal,gl=worldX(g1,camera),gr=worldX(g2,camera),w=gr-gl,cx=(gl+gr)/2;
  if(gr<-30||gl>390)return;
  const beam=ctx.createLinearGradient(0,FLOOR-120,0,FLOOR);beam.addColorStop(0,'#ffd65a00');beam.addColorStop(1,'#ffd65a55');
  ctx.fillStyle=beam;ctx.fillRect(gl,FLOOR-120,w,120);
  const cell=w/Math.max(4,Math.round(w/10));
  for(let x=gl,n=0;x<gr-.5;x+=cell,n++){for(let r=0;r<2;r++){ctx.fillStyle=(n+r)%2?'#1f2a40':'#fffaf0';ctx.fillRect(x,FLOOR-4+r*6,cell+.5,6);}}
  ctx.strokeStyle='#ffc64a';ctx.lineWidth=2.5;ctx.strokeRect(gl,FLOOR-4,w,12);
  for(const px of [gl-3,gr-3]){rounded(px,FLOOR-118,6,114,3,'#ffd665');ctx.fillStyle='#c98b2a';for(let y=FLOOR-110;y<FLOOR-10;y+=16)ctx.fillRect(px,y,6,6);}
  rounded(gl-8,FLOOR-132,w+16,22,6,'#ffc64a');
  const banner=Math.max(5,Math.round((w+4)/8)),bw=(w+4)/banner;
  for(let n=0;n<banner;n++){ctx.fillStyle=n%2?'#1f2a40':'#fffaf0';ctx.fillRect(gl-2+n*bw,FLOOR-129,bw,4);ctx.fillStyle=n%2?'#fffaf0':'#1f2a40';ctx.fillRect(gl-2+n*bw,FLOOR-114,bw,3);}
  ctx.fillStyle='#29334d';ctx.font='1000 12px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('GOAL',cx,FLOOR-120);ctx.textBaseline='alphabetic';
  const wave=reduceMotion?0:Math.sin(time*6)*3;ctx.fillStyle='#ffd665';ctx.fillRect(gr-1,FLOOR-158,3,28);
  ctx.beginPath();ctx.moveTo(gr+2,FLOOR-158);ctx.quadraticCurveTo(gr+14,FLOOR-156+wave,gr+24,FLOOR-151+wave);ctx.lineTo(gr+2,FLOOR-143);ctx.closePath();ctx.fillStyle='#ff6f7f';ctx.fill();
  const bob=reduceMotion?0:Math.abs(Math.sin(time*4))*7;
  ctx.fillStyle='#fff3c4';ctx.font='900 10px system-ui';ctx.fillText('LAND HERE',cx,FLOOR-80);
  ctx.fillStyle='#ffd665';for(let k=0;k<2;k++){const y=FLOOR-62+k*12+bob;ctx.beginPath();ctx.moveTo(cx-9,y);ctx.lineTo(cx+9,y);ctx.lineTo(cx,y+8);ctx.closePath();ctx.globalAlpha=k?.6:1;ctx.fill();}ctx.globalAlpha=1;
}
function drawStar(x,y,r1,r2,color,rot=0){ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2+rot,r=i%2===0?r1:r2;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function drawStars(level,camera){
  for(let i=0;i<level.stars.length;i++){const x=worldX(level.stars[i],camera);
    if(x<-30||x>390||state.collected.includes(i))continue;
    const y=starY(i),pulse=reduceMotion?1:1+Math.sin(time*5+i)*.08;
    const glow=ctx.createRadialGradient(x,y,2,x,y,34);glow.addColorStop(0,'#fff2a0cc');glow.addColorStop(1,'#ffd84a00');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,34,0,Math.PI*2);ctx.fill();
    drawStar(x,y,17*pulse,8*pulse,'#ffd84a',reduceMotion?0:Math.sin(time*2+i)*.15);ctx.strokeStyle='#fffbe0';ctx.lineWidth=2;ctx.stroke();
    drawStar(x,y,7,3.5,'#fffbe8');
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
function drawBunny(){
  const p=state.phase/PERIOD,live=playing&&state.status==='playing';
  let hop=live?Math.sin(Math.PI*p)*HOP_H:reduceMotion?0:Math.abs(Math.sin(time*2.4))*16,drop=0;
  if(ending?.kind==='clear')hop=reduceMotion?0:Math.abs(Math.sin((time-ending.start)*9))*20;
  if(ending?.kind==='fail'){const t=time-ending.start;hop=0;drop=t*t*1100;}
  // Squash at take-off/landing, stretch in the air; lean forward while FAST.
  const ground=live?1-Math.min(1,Math.min(p,1-p)/.09):0,air=live?Math.sin(Math.PI*p):0;
  const sx=(1+.18*ground)*(1-.05*air),sy=(1-.18*ground)*(1+.07*air);
  lean+=((pressed?.16:0)-lean)*.2;
  const foot=FLOOR-4-hop+drop;
  if(!drop){ctx.globalAlpha=Math.max(.15,.55-hop/220);ctx.fillStyle='#08202c';ctx.beginPath();ctx.ellipse(HERO_X,FLOOR+1,Math.max(7,14-hop*.07),3.5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  if(pressed&&!reduceMotion){ctx.strokeStyle='#fff2b5';ctx.lineWidth=2;ctx.globalAlpha=.5;for(let k=0;k<3;k++){const y=foot-14-k*11;ctx.beginPath();ctx.moveTo(HERO_X-18-k*3,y);ctx.lineTo(HERO_X-36-k*6,y);ctx.stroke();}ctx.globalAlpha=1;}
  ctx.save();ctx.translate(HERO_X,foot);ctx.rotate(lean+(drop?Math.min(1.2,drop/120):0));ctx.scale(BUNNY_SCALE*sx,BUNNY_SCALE*sy);
  // Ears, body and cheeks drawn as editable geometry, not external assets.
  ctx.save();ctx.rotate(-.04+(reduceMotion?0:Math.sin(time*5)*.035)-lean*.8);
  rounded(-19,-110,16,56,8,'#f6e4b8');rounded(3,-114,16,60,8,'#f6e4b8');
  rounded(-15,-105,7,41,4,'#dfa3a0');rounded(8,-109,7,44,4,'#dfa3a0');
  ctx.restore();
  ctx.fillStyle='#f6d8ae';ctx.beginPath();ctx.ellipse(0,-16,24,24,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f9eac5';ctx.beginPath();ctx.arc(0,-45,29,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3a4f57';ctx.beginPath();
  if(ending?.kind==='clear'){ctx.strokeStyle='#3a4f57';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-10,-43,4,Math.PI,0);ctx.moveTo(15,-43);ctx.arc(11,-43,4,Math.PI,0);ctx.stroke();}
  else{ctx.ellipse(-10,-45,3.5,4.4,0,0,Math.PI*2);ctx.ellipse(11,-45,3.5,4.4,0,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#e6a5a3';ctx.beginPath();ctx.ellipse(-19,-36,6,3,0,0,Math.PI*2);ctx.ellipse(19,-36,6,3,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#a97974';ctx.beginPath();ctx.arc(0,-35,3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a97974';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-5,-31);ctx.quadraticCurveTo(0,-27,0,-34);ctx.quadraticCurveTo(0,-27,5,-31);ctx.stroke();
  rounded(-19,-2,16,10,5,'#f9eac5');rounded(5,-2,16,10,5,'#f9eac5');ctx.restore();
}
// Rhythm wheel always counts down with the SAME period, independent of speed. Parked under the HUD, away from the bunny.
function drawRhythm(){
  const p=state.phase/PERIOD,xx=32,yy=124;
  ctx.lineWidth=4;ctx.strokeStyle='#eef7e52b';ctx.beginPath();ctx.arc(xx,yy,14,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#ffe09a';ctx.beginPath();ctx.arc(xx,yy,14,-Math.PI/2,-Math.PI/2+p*Math.PI*2);ctx.stroke();
  ctx.fillStyle='#e8ead6';ctx.font='900 8px system-ui';ctx.textAlign='center';ctx.fillText('HOP',xx,yy+3);
}
function drawFx(camera){
  for(const p of fx){const k=p.age/p.life,x=worldX(p.x,camera);ctx.globalAlpha=Math.max(0,1-k);
    if(p.kind==='ring'){ctx.strokeStyle='#fff3b0';ctx.lineWidth=3*(1-k)+.5;ctx.beginPath();ctx.arc(x,p.y,12+k*34,0,Math.PI*2);ctx.stroke();}
    else if(p.kind==='text'){ctx.fillStyle='#ffe66d';ctx.font='1000 16px system-ui';ctx.textAlign='center';ctx.fillText(p.text,x,p.y);}
    else{ctx.fillStyle=p.color;ctx.fillRect(x-p.size/2,p.y-p.size/2,p.size,p.size);}
  }
  ctx.globalAlpha=1;
}
function render(){
  ctx.clearRect(0,0,CW,CH);const level=levels[levelIndex],camera=state.x-HERO_X;
  drawBg(camera);drawPlatforms(level,camera);drawGoal(level,camera);drawStars(level,camera);drawForecast(level,camera);drawBunny();drawFx(camera);drawRhythm();
  if(!reduceMotion&&time-speedFlash<.12){ctx.fillStyle=pressed?'#fff2b522':'#9fe8ff18';ctx.fillRect(0,0,CW,CH);}
  if(ending?.kind==='fail'){ctx.fillStyle='#fb7c8c';ctx.globalAlpha=Math.min(.35,(time-ending.start)*1.2);ctx.fillRect(0,0,CW,CH);ctx.globalAlpha=1;}
}
let last=performance.now();
function tick(now){
  const dt=Math.min(.045,(now-last)/1000);last=now;time=now/1000;
  if(playing&&state.status==='playing'){
    const before=state.collected.length,events=advance(state,levels[levelIndex],dt,pressed);
    for(const i of state.collected.slice(before))starBurst(i);
    if(events.includes('land')){tone(400+state.jumps%4*55);dust();}
    if(events.includes('fall'))finish('fail');else if(events.includes('clear'))finish('clear');
    updateHud();
  }
  stepFx(dt);
  if(ending&&time>=ending.at){const kind=ending.kind;ending=null;kind==='fail'?onFail():onClear();}
  if(now/1000>toastUntil)$('toast').classList.remove('visible');
  render();requestAnimationFrame(tick);
}
window.__HOPSCROLL_DEBUG__={levels,createState,advance,isSafe,reset,get state(){return state},get playing(){return playing},get pressed(){return pressed}};
updateMute();intro();updateHud();requestAnimationFrame(tick);
