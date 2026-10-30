import {PERIOD,SLOW_SPEED,FAST_SPEED,levels,isSafe,predictLanding,createState,advance} from './core.mjs';

const $=id=>document.getElementById(id);
const canvas=$('stage'),ctx=canvas.getContext('2d');
const CW=360,CH=640,HERO_X=69,FLOOR=385,WORLD_SCALE=.82;
const overlay=$('overlay'),btn=$('accelerate'),speedIndicator=$('speed-indicator');
const GOAL_KEY='hopscroll-unlocked-v01';
let levelIndex=0,state=createState(levels[0]),playing=false,pressed=false,frame=0,toastUntil=0;
let soundContext;
try {levelIndex=0;} catch{}
const unlocked=()=>{try{return Math.min(levels.length-1,+(localStorage.getItem(GOAL_KEY)||0));}catch{return 0;}};
const storeUnlock=n=>{try{localStorage.setItem(GOAL_KEY,String(Math.max(n,unlocked())))}catch{}};
function audio(freq=450,kind='land') {
  try {
    soundContext ??= new (window.AudioContext||window.webkitAudioContext)();
    if(soundContext.state==='suspended')soundContext.resume();
    const t=soundContext.currentTime,osc=soundContext.createOscillator(),gain=soundContext.createGain();
    osc.type=kind==='star'?'sine':'triangle';osc.frequency.setValueAtTime(freq,t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(80,freq*.7),t+.13);
    gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(kind==='star'?.1:.055,t+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,t+.18);
    osc.connect(gain);gain.connect(soundContext.destination);osc.start(t);osc.stop(t+.2);
  } catch{}
}
function reset(index=levelIndex,autoStart=true){levelIndex=index;state=createState(levels[index]);playing=autoStart;setPress(false);updateHud();if(autoStart){overlay.classList.add('hidden');showToast(`STAGE ${String(index+1).padStart(2,'0')}`,0.9)} }
function showModal({tag,title,message,button,onAction,footer}){
  playing=false;setPress(false);$('modal-tag').textContent=tag;
  $('modal-title').innerHTML=title;$('modal-message').innerHTML=message;
  $('modal-action').textContent=button;$('modal-footer').textContent=footer;
  $('modal-action').onclick=()=>{audio(520,'start');onAction();};
  overlay.classList.remove('hidden');
}
function intro(){
  showModal({tag:'SLAPJAM #2 · THEME: SPEED',title:'HOP<span>SCROLL</span>',message:'① The bunny jumps by itself.<br/>② <em>HOLD</em> for FAST, release for SLOW.<br/>③ <em>LAND</em> inside the golden GOAL!',button:'LET\'S HOP →',footer:'One button. Perfect timing.',onAction:()=>reset(0,true)});
}
function onFail(){audio(210,'fail');const overshot=state.x>levels[levelIndex].goal[1];showModal({tag:`STAGE ${String(levelIndex+1).padStart(2,'0')} · TRY AGAIN`,title:'OOPS<span>!</span>',message:overshot?'You flew past the goal!<br/><em>LAND inside the golden gate.</em>':'Missed the landing!<br/>Watch the <em>NEXT</em> marker and adjust your speed.',button:'RETRY ↻',footer:'Instant retry. No penalty.',onAction:()=>reset(levelIndex,true)});}
function onClear(){
  audio(650,'clear');storeUnlock(levelIndex+1);
  const final=levelIndex===levels.length-1;
  showModal({tag:final?'ALL SIX STAGES CLEARED!':`STAGE ${String(levelIndex+1).padStart(2,'0')} · COMPLETE`,title:final?'SPEED<span>MASTER!</span>':'NICE<span> HOP!</span>',message:final?'You mastered the speed of the world.<br/><em>Thanks for playing!</em>':`Perfect landing! ${state.jumps} hops · ${state.starCount} stars.<br/>Ready for a new rhythm?`,button:final?'PLAY AGAIN ↻':'NEXT STAGE →',footer:'HOLD = FAST · RELEASE = SLOW',onAction:()=>reset(final?0:levelIndex+1,true)});
}
function setPress(on){pressed=on&&playing;btn.classList.toggle('pressed',pressed);speedIndicator.classList.toggle('fast',pressed);$('speed-label').textContent=pressed?'FAST':'SLOW';$('speed-number').textContent=pressed?'2.6×':'1.0×';}
btn.addEventListener('pointerdown',e=>{if(!playing)return;e.preventDefault();btn.setPointerCapture?.(e.pointerId);setPress(true);});
['pointerup','pointercancel','lostpointercapture'].forEach(name=>btn.addEventListener(name,()=>setPress(false)));
window.addEventListener('pointerup',()=>setPress(false));window.addEventListener('blur',()=>setPress(false));
window.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='ArrowRight')&&!e.repeat){e.preventDefault();setPress(true);}if(e.code==='KeyR')reset(levelIndex,true);});
window.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='ArrowRight'){e.preventDefault();setPress(false)}});
$('restart').addEventListener('click',()=>reset(levelIndex,true));
function showToast(t,seconds=.8){$('toast').textContent=t;toastUntil=performance.now()/1000+seconds;$('toast').classList.add('visible');}
function updateHud(){const l=levels[levelIndex];$('stage-name').textContent=`${String(levelIndex+1).padStart(2,'0')} / ${String(levels.length).padStart(2,'0')} · ${l.title}`;$('progress-bar').style.width=`${Math.max(0,Math.min(100,(state.x-l.start)/(l.goal[0]-l.start)*100))}%`;$('tip').textContent=levelIndex===0?(state.jumps<1?'① Hops automatically · 自動ジャンプ':state.x<360?'② HOLD to go FAST · 押して加速':'③ LAND at GOAL! · ゴールに着地'):l.hint;}
function rounded(x,y,w,h,r,fill){if(w<=0||h<=0)return;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
function drawBg(camera){
  const bg=ctx.createLinearGradient(0,0,0,CH);bg.addColorStop(0,'#12243b');bg.addColorStop(.6,'#315b72');bg.addColorStop(1,'#182d3f');ctx.fillStyle=bg;ctx.fillRect(0,0,CW,CH);
  for(let i=0;i<35;i++){const x=((i*83+21-camera*.07)%415+415)%415-20,y=15+(i*53)%225;ctx.fillStyle='#e2e9d4';ctx.globalAlpha=.15+(i%5)*.1;ctx.beginPath();ctx.arc(x,y,((i%3)+1)*.65,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  ctx.fillStyle='#f4d398';ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(288-camera*.015%380,188,31,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  for(let layer=0;layer<3;layer++){
    const yy=293+layer*40,amp=21+layer*9,speed=.04+layer*.05;
    ctx.beginPath();ctx.moveTo(-50,CH);
    for(let x=-50;x<=410;x+=10){ctx.lineTo(x,yy+Math.sin((x+camera*speed)*.013+layer)*amp+Math.sin((x+camera*speed)*.025)*8)}
    ctx.lineTo(410,CH);ctx.closePath();ctx.fillStyle=['#244a5e','#1e4054','#1a354a'][layer];ctx.fill();
  }
  if(pressed&&playing){ctx.strokeStyle='#fff2b5';ctx.lineWidth=1.5;for(let i=0;i<12;i++){const x=(i*91+frame*11)%450-45,y=160+(i*31)%195;ctx.globalAlpha=.12+(i%4)*.08;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+20+(i%3)*11,y);ctx.stroke();}ctx.globalAlpha=1;}
}
const worldX=(world,camera)=>HERO_X+(world-camera-HERO_X)*WORLD_SCALE;
function drawPlatforms(level,camera){
  for(let i=0;i<level.platforms.length;i++){const [a,b]=level.platforms[i],sx=worldX(a,camera),ex=worldX(b,camera);if(ex<-10||sx>370)continue;
    // Flat physical collision surfaces: no decorative hitbox surprises.
    ctx.fillStyle='#173b4d';ctx.fillRect(sx,FLOOR+10,ex-sx,185);
    ctx.fillStyle='#2f7778';ctx.fillRect(sx,FLOOR+9,ex-sx,60);
    rounded(sx,FLOOR,ex-sx,15,4,'#84ddb8');
    ctx.fillStyle='#e0efbd';ctx.globalAlpha=.85;
    for(let xx=a+17;xx<b-10;xx+=31){const draw=worldX(xx,camera);if(draw>=-5&&draw<=365){ctx.fillRect(draw,FLOOR+4,8,2);}}
    ctx.globalAlpha=1;
  }
  const [g1,g2]=level.goal,gl=worldX(g1,camera),gr=worldX(g2,camera);
  if(gr>-20&&gl<380){
    rounded(gl,FLOOR-9,gr-gl,27,6,'#ffe17c');
    // Upright gold goal pillars and finish banner: visibly a landing target, not another item.
    ctx.fillStyle='#f9dd88';ctx.fillRect(gl,FLOOR-106,6,99);ctx.fillRect(gr-6,FLOOR-106,6,99);
    rounded(gl-6,FLOOR-114,gr-gl+12,26,7,'#ffc752');
    ctx.fillStyle='#29334d';ctx.font='1000 15px system-ui';ctx.textAlign='center';ctx.fillText('★ GOAL ★',(gl+gr)/2,FLOOR-96);
    ctx.fillStyle='#fff9d9';ctx.textAlign='center';ctx.font='900 10px system-ui';ctx.fillText('LAND HERE',(gl+gr)/2,FLOOR-64);
    ctx.font='20px system-ui';ctx.fillText('⚑',gl+12,FLOOR-125);
    for(let x=gl+10;x<gr-8;x+=16){ctx.fillStyle=(Math.round((x-gl)/16)%2)?'#29334d':'#fff8dd';ctx.fillRect(x,FLOOR-9,8,9);}
  }
  for(let i=0;i<level.stars.length;i++){const x=worldX(level.stars[i],camera);
    if(x<-20||x>380||state.collected.includes(i))continue;
    const cy=FLOOR-90+Math.sin(frame*.06+i)*5;ctx.save();ctx.shadowColor='#ffdf5f';ctx.shadowBlur=24;drawStar(x,cy,17,8,'#ffe04b');ctx.restore();ctx.strokeStyle='#fff9cf';ctx.lineWidth=2;ctx.stroke();
  }
  ctx.globalAlpha=.85;ctx.textAlign='center';ctx.fillStyle='#e8d3d3';ctx.font='900 11px system-ui';
  for(let i=0;i<level.platforms.length-1;i++){const xa=worldX(level.platforms[i][1],camera),xb=worldX(level.platforms[i+1][0],camera);
    if(xb<0||xa>360)continue;
    for(let x=xa+13;x<xb-10;x+=24){ctx.beginPath();ctx.moveTo(x,FLOOR+22);ctx.lineTo(x+8,FLOOR+11);ctx.lineTo(x+16,FLOOR+22);ctx.closePath();ctx.fillStyle='#bb6571';ctx.fill();}
  }
  ctx.globalAlpha=1;
}
function drawStar(x,y,r1,r2,color){ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2===0?r1:r2;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function drawForecast(level,camera){if(!playing)return;const predicted=predictLanding(state,pressed);const sx=worldX(predicted,camera),ok=isSafe(level,predicted);
  if(sx<0||sx>360)return;
  ctx.strokeStyle=ok?'#b5f6db':'#ff8c98';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(sx,FLOOR-3);ctx.lineTo(sx,FLOOR-65);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.ellipse(sx,FLOOR-3,17,4,0,0,Math.PI*2);ctx.fillStyle=ok?'#bcffe280':'#ff889e99';ctx.fill();ctx.strokeStyle=ok?'#b5f6db':'#ff8c98';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=ok?'#caf7e5':'#ffc3bd';ctx.textAlign='center';ctx.font='800 10px system-ui';ctx.fillText('NEXT',sx,FLOOR-71);
}
function drawBunny(){
  const p=state.phase/PERIOD,hop=playing?Math.sin(Math.PI*p)*104:Math.sin(frame*.025)*18;
  const foot=FLOOR-10-hop;
  ctx.save();ctx.translate(HERO_X,foot);ctx.scale(.68,.68);
  ctx.globalAlpha=Math.max(.12,1-hop/180);ctx.fillStyle='#0c26309e';ctx.beginPath();ctx.ellipse(0,hop+14,Math.max(12,22-hop*.12),5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='#f2dfb6';ctx.strokeStyle='#805f5c';ctx.lineWidth=2;
  // Ears, body and cheeks drawn as editable geometry, not external assets.
  ctx.save();ctx.rotate(-.04+Math.sin(frame*.08)*.035);
  rounded(-19,-110,16,56,8,'#f6e4b8');rounded(3,-114,16,60,8,'#f6e4b8');
  rounded(-15,-105,7,41,4,'#dfa3a0');rounded(8,-109,7,44,4,'#dfa3a0');
  ctx.restore();
  ctx.fillStyle='#f6d8ae';ctx.beginPath();ctx.ellipse(0,-16,24,24,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f9eac5';ctx.beginPath();ctx.arc(0,-45,29,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3a4f57';ctx.beginPath();ctx.ellipse(-10,-45,3.5,4.4,0,0,Math.PI*2);ctx.ellipse(11,-45,3.5,4.4,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#e6a5a3';ctx.beginPath();ctx.ellipse(-19,-36,6,3,0,0,Math.PI*2);ctx.ellipse(19,-36,6,3,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#a97974';ctx.beginPath();ctx.arc(0,-35,3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a97974';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-5,-31);ctx.quadraticCurveTo(0,-27,0,-34);ctx.quadraticCurveTo(0,-27,5,-31);ctx.stroke();
  rounded(-19,-2,16,10,5,'#f9eac5');rounded(5,-2,16,10,5,'#f9eac5');ctx.restore();
  // Rhythm wheel always counts down with the SAME period, independent of speed.
  const xx=37,yy=FLOOR-103;
  ctx.lineWidth=4;ctx.strokeStyle='#eef7e52b';ctx.beginPath();ctx.arc(xx,yy,16,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#ffe09a';ctx.beginPath();ctx.arc(xx,yy,16,-Math.PI/2,-Math.PI/2+p*Math.PI*2);ctx.stroke();
  ctx.fillStyle='#e8ead6';ctx.font='900 9px system-ui';ctx.textAlign='center';ctx.fillText('HOP',xx,yy+3);
}
function render(){
  ctx.clearRect(0,0,CW,CH);const camera=state.x-HERO_X;
  drawBg(camera);drawPlatforms(levels[levelIndex],camera);drawForecast(levels[levelIndex],camera);drawBunny();
  if(state.status==='dead'){ctx.fillStyle='#fb9c9c77';ctx.fillRect(0,0,CW,CH)}
}
let last=performance.now();function tick(now){
  let dt=Math.min(.045,(now-last)/1000);last=now;frame++;
  if(playing&&state.status==='playing'){
    const events=advance(state,levels[levelIndex],dt,pressed);
    if(events.includes('land'))audio(400+state.jumps%4*55);
    if(events.includes('star')){audio(850,'star');showToast('★ NICE!',.6)}
    if(events.includes('fall'))onFail();else if(events.includes('clear'))onClear();
    updateHud();
  }
  if(now/1000>toastUntil)$('toast').classList.remove('visible');
  render();requestAnimationFrame(tick);
}
window.__HOPSCROLL_DEBUG__={levels,createState,advance,isSafe,reset,get state(){return state},get playing(){return playing}};
intro();updateHud();requestAnimationFrame(tick);
