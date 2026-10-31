import {createMichiru} from './michiru.mjs';
import {createMoonAudio} from './moon-audio.mjs';
import {createSky} from './moon-sky.mjs';
import {PERIOD} from './core.mjs';
import {createInput} from './star-run-core.mjs';
import {moonLevels as labLevels} from './moon-levels.mjs';
import {journeyLevels} from './moon-journey-levels.mjs';
const journey=document.body.dataset.journey==='true';
const moonLevels=journey?journeyLevels:labLevels;
import {createMoonState,advanceMoon,retryMoon,predictMoon,bridgeGhost,meteorSolid} from './moon-core.mjs';
import {createI18n} from './moon-i18n.mjs';
const i18n=createI18n(journey?undefined:'ja'),t=key=>i18n.t(key);i18n.apply();
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d'),input=createInput();
let level=moonLevels[0],state=createMoonState(level),mode='ready',last=null;
const audio=createMoonAudio(),michiru=createMichiru();
let stageIndex=0;
const stats={attempts:0,falls:[],hints:0,clears:0,bonusClears:0};
// Avoid repeatedly announcing identical live-region text at animation framerate.
function setHint(value){if($('hint').textContent!==value)$('hint').textContent=value;}
function clearInput(){input.reset();last=null;}
// Moon Lab keeps its eyebrow and bridge legend; Journey lets the route bar and the board say it.
const demo=$('demo'),bridgeDemo=$('bridge-demo'),eyebrow=$('eyebrow');
const results=[];// per Journey stage this session: 'clear' | 'full'
// Dango are gifts for the Earthwatch festival: one per dango isle, counted in the finale.
const dangoGot=[];
const lv=l=>i18n.level(l);
function show(title,description,action){$('title').textContent=title;$('description').textContent=description;$('action').textContent=action;$('panel').hidden=false;if(demo)demo.hidden=mode!=='ready'||level.id!=='003';$('restart').hidden=mode==='ready';}
function labelStops(){document.querySelectorAll('[data-stage]').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===stageIndex));if(journey)b.setAttribute('aria-label',t('stage')(lv(moonLevels[i]),results[i]));});}
function select(index){audio.suspend();clearInput();stageIndex=index;level=moonLevels[index];state=createMoonState(level);mode='ready';if(eyebrow)eyebrow.textContent=`STAGE ${level.id}`;
 labelStops();
 show(lv(level).title,level.id==='003'?t('bridgeIntro'):lv(level).subtitle,t('start'));render();}
function start(fromStart=false){clearInput();sky.reset();state=retryMoon(state,level,fromStart);mode=state.usedCheckpoint?'checkpoint-ready':'playing';audio.stop();if(mode==='playing')void audio.activate();else audio.suspend();stats.attempts++;$('panel').hidden=true;render();}
function pause(help=false){if(mode!=='playing')return;audio.suspend();clearInput();mode='paused';if(help)stats.hints++;show(help?t('helpTitle'):t('pause'),help?t('help'):'',t('resume'));}
$('action').addEventListener('click',()=>{if(mode==='paused'){clearInput();void audio.activate();mode='playing';$('panel').hidden=true;}else if(journey&&state.status==='clear'&&stageIndex<moonLevels.length-1)select(stageIndex+1);else if(journey&&state.status==='clear'){select(0);showTitle();}else start(state.status==='clear');});
$('restart').addEventListener('click',()=>start(true));$('pause').addEventListener('click',()=>pause());$('help').addEventListener('click',()=>{if(mode==='playing')pause(true);else if(mode==='ready'||journey){$('description').textContent=journey?t('help'):'押して進み、離して着地。緑の輪が安全。';stats.hints++;}});
// Journey route: stop, leg, stop, leg … moon. A leg fills while its stage is played.
if(journey){const nav=document.querySelector('.stage-tabs');nav.replaceChildren(...moonLevels.flatMap((l,i)=>{const b=document.createElement('button');b.className='stop';b.dataset.stage=String(i);const leg=document.createElement('span');leg.className='leg';leg.append(document.createElement('b'));return [b,leg];}),Object.assign(document.createElement('span'),{className:'goal'}));}
const stops=[...document.querySelectorAll('.route .stop')],legs=[...document.querySelectorAll('.route .leg')];
function renderRoute(){
 const p=Math.min(1,Math.max(0,(state.x-level.start)/(level.goal[0]-level.start)));
 stops.forEach((s,i)=>{s.classList.toggle('clear',!!results[i]);s.classList.toggle('full',results[i]==='full');s.classList.toggle('dango',!!dangoGot[i]||(i===stageIndex&&state.bonus));});
 legs.forEach((leg,i)=>{leg.classList.toggle('done',!!results[i]&&i!==stageIndex);leg.classList.toggle('here',i===stageIndex);leg.style.setProperty('--p',i===stageIndex?p.toFixed(3):'0');});
 document.querySelector('.route .goal')?.classList.toggle('clear',results.filter(Boolean).length===moonLevels.length);
 $('pause').disabled=mode!=='playing';
 document.body.classList.toggle('ready-invite',mode==='ready'&&!!demoOf(level));
}
// A stray tap on the route during a run pauses instead of throwing the run away.
for(const button of document.querySelectorAll('[data-stage]'))button.addEventListener('click',()=>{if(journey&&mode==='playing'){pause();return;}select(Number(button.dataset.stage));});
// Journey: one short cue until the first press, then Michiru and the sky carry FAST/SLOW.
const cue=$('touch-cue');let pressedOnce=false;
try{pressedOnce=localStorage.getItem('hopscroll-journey-pressed')==='1';}catch{}
function touched(){if(pressedOnce)return;pressedOnce=true;try{localStorage.setItem('hopscroll-journey-pressed','1');}catch{}}
// Stage 001 practice on the opening lawn (three FAST hops still land on it):
// 0 = hold to speed up, 1 = let go to slow down, 2 = praise, then done for good.
let practice=3,practiceTime=0;
try{practice=localStorage.getItem('hopscroll-journey-practice')==='1'?3:0;}catch{practice=0;}
function stepPractice(dt,live){
 if(practice>2||!live||level.id!=='001')return;
 practiceTime=(practice===0)===input.fast||practice===2?practiceTime+dt:0;
 if(practice===0&&practiceTime>=.45){practice=1;practiceTime=0;}
 else if(practice===1&&practiceTime>=.3){practice=2;practiceTime=0;}
 else if(practice===2&&practiceTime>=1.2){practice=3;try{localStorage.setItem('hopscroll-journey-practice','1');}catch{}}
}
function renderCue(){
 if(!cue)return;
 const drill=journey&&practice<3&&level.id==='001'&&mode==='playing';
 const lines=drill?[[t('practiceHold'),t('practiceHoldSub')],[t('practiceRelease'),t('practiceReleaseSub')],[t('practiceGood'),'']][practice]:[t('cueFast'),t('cueSlow')];
 const [a,b]=cue.children;if(a.textContent!==lines[0])a.textContent=lines[0];if(b.textContent!==lines[1])b.textContent=lines[1];
 cue.classList.toggle('shown',drill||mode==='playing'&&!pressedOnce&&!(level.id==='001'&&practice<3));
 cue.classList.toggle('drill',drill);cue.classList.toggle('fast',drill&&input.fast);
}
for(const target of [canvas,$('hold')]){
 target.addEventListener('pointerdown',e=>{if(mode!=='playing'&&mode!=='ready')return;e.preventDefault();input.pointers.add(e.pointerId);target.setPointerCapture(e.pointerId);render();});
 target.addEventListener('lostpointercapture',e=>{input.pointers.delete(e.pointerId);render();});
}
window.addEventListener('pointerup',e=>{input.pointers.delete(e.pointerId);render();});window.addEventListener('pointercancel',()=>{clearInput();render();});
window.addEventListener('keydown',e=>{if(titleOpen())return;if(e.code==='Space'&&(mode==='playing'||mode==='ready')&&e.target.tagName!=='BUTTON'){e.preventDefault();if(!e.repeat)input.keys.add(e.code);}else if(e.code==='Space'&&mode==='playing'){e.preventDefault();if(!e.repeat)input.keys.add(e.code);}if(e.code==='Escape')pause();});
window.addEventListener('keyup',e=>{input.keys.delete(e.code);render();});
function suspend(){audio.suspend();clearInput();pause();}window.addEventListener('blur',suspend);window.addEventListener('pagehide',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
function finish(){clearInput();mode='result';if(state.status==='clear'){stats.clears++;if(state.bonus)stats.bonusClears++;if(journey&&results[stageIndex]!=='full')results[stageIndex]=state.fullMoon?'full':'clear';
 if(state.bonus)dangoGot[stageIndex]=true;sky.celebrate(level.goal[0],level.goal[1],FLOOR);}
 else{audio.cue('miss');stats.falls.push({stage:level.id,hop:state.jumps,x:state.x,reason:state.failure?.reason});}
 showResult();}
// Result card text only, so a language switch can redraw it.
function showResult(){
 if(state.status==='clear'){
  // Journey: the gold stop on the route already says "cleared"; keep the story and the dango.
  const line=level.festival?(journey?t('festival')(dangoGot.filter(Boolean).length):'地球見祭に、団子が届いた。'):!journey?(state.fullMoon?'月印から戻らず渡りきった。':'無事に渡りきった。'):level.bonusIsland?t(state.bonus?'dangoGot':'dangoMissed'):'';
  show(state.fullMoon?t('full'):t('clear'),line,journey?(stageIndex<moonLevels.length-1?t('next'):t('again')):'もう一度');
 }else{const fail=t('fail'),[title,why]=fail[state.failure?.reason]||fail.other;show(title,why,state.checkpoint?t('retryMark'):t('retry'));}
}
// Frozen first-bridge demonstrations (003 moon bridge, 006 meteor bridge) use the real collision/prediction rule.
const demoOf=l=>l.demo||(l.id==='003'?{x:760,phase:.5}:null);
function previewState(){const d=demoOf(level);return mode==='ready'&&d?{...state,...d}:state;}
function render(){
 $('progress').textContent=`HOP ${state.jumps}`;
 $('checkpoint').hidden=!state.checkpoint;
 if(journey){$('checkpoint').textContent='☾';$('checkpoint').classList.toggle('used',state.usedCheckpoint);$('checkpoint').setAttribute('aria-label',t(state.usedCheckpoint?'checkpointUsed':'checkpointPassed'));$('bonus').setAttribute('aria-label',t('dangoHud'));renderRoute();}
 else{$('checkpoint').textContent=state.usedCheckpoint?'☾ 月印から':'☾ 月印';$('bonus').textContent='● 団子';}
 $('bonus').hidden=!state.bonus;
 renderCue();
 $('hold').classList.toggle('active',input.fast);if(!journey)$('speed').textContent=input.fast?'FAST · RELEASE':'HOLD · FAST';
 if(bridgeDemo){bridgeDemo.classList.toggle('fast',input.fast);bridgeDemo.textContent=input.fast?'FAST：橋は透ける':'SLOW：橋は光る';}
 // A steady camera: speed is shown by the sky and the trail, never by zooming the stage.
 const zoom=mode==='checkpoint-ready'?.6:1,heroX=65;
 // Frozen first-bridge demonstration uses the real collision/prediction rule.
 const viewState=previewState();
 const next=predictMoon(viewState,level,input.fast),offset=viewState.x-heroX/zoom,sx=x=>(x-offset)*zoom,y=FLOOR;
 $('resume').hidden=mode!=='checkpoint-ready';
 for(const m of [$('mute'),$('title-mute')])if(m){m.textContent=audio.muted?'♪̸':'♪';m.setAttribute('aria-pressed',String(audio.muted));m.setAttribute('aria-label',journey?t(audio.muted?'unmuteLabel':'muteLabel'):audio.muted?'効果音をオン':'効果音をミュート');}
 if(journey)setHint(t(mode==='playing'?'hintPlay':'hintReady'));
 else setHint(mode==='playing'?(level.id==='003'?'薄藤の橋は、離して着地。NEXTの輪が赤なら危険。':state.x>1250&&state.x<1720?'近い足場か、団子の島か。どちらからでも、その先へ。':'NEXTは今の速度を保った着地点。団子は着地で獲得。'):'NEXTの輪は、今の速度のまま跳んだ着地点。');
 if(mode==='checkpoint-ready')setHint(journey?t('checkpointReady'):'NEXTを確認。最初はSLOWで安全。');
 ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.clearRect(0,0,W,H);
 const camera=viewState.x-heroX;
 sky.drawSky(ctx,W,H,y,camera);
 const ey=Math.round(y*.25),ex=302;
 // Earth, seen from the Moon: it swells as the festival night nears its end.
 const earth=level.festival?30+24*Math.min(1,state.x/level.goal[0]):30;
 if(!sky.drawEarth(ctx,ex,ey,earth)){ctx.fillStyle=level.festival?'#72b9c8':'#26305a';ctx.beginPath();ctx.arc(ex,ey,earth,0,Math.PI*2);ctx.fill();}
 if(level.festival&&!sky.earthReady){ctx.save();ctx.beginPath();ctx.arc(ex,ey,earth,0,Math.PI*2);ctx.clip();ctx.fillStyle='#a9d8ba';ctx.beginPath();ctx.ellipse(ex-14,ey-14,14,23,-.4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(ex+18,ey+12,18,13,.5,0,Math.PI*2);ctx.fill();ctx.restore();}

 // The selected stage is already visible in the tabs; do not repeat its title in the sky.
 let bridgeCaptionDrawn=false;
 for(const surface of level.surfaces){const L=sx(surface.a),R=sx(surface.b),a=sx(surface.a+8),width=(surface.b-surface.a-16)*zoom;if(R<-10||L>W+10)continue;
  const bridge=surface.kind==='bridge';
  if(surface.kind==='meteor'){sky.drawMeteor(ctx,L,R,a,a+width,y,mode==='ready'?input.fast:meteorSolid(state,input.fast));continue;}
  // The bridge fades only after the grace period, exactly when collision would drop it; the frozen demo shows it at once.
  if(bridge)sky.drawBridge(ctx,L,R,a,a+width,y,mode==='ready'?input.fast:bridgeGhost(state,input.fast));
  else{const dash=[];for(let xx=surface.a+14;xx<surface.b-10;xx+=26){const d=sx(xx);if(d>=-30&&d<=W+5)dash.push(d);}sky.drawLane(ctx,L,R,a,a+width,y,dash);}
  if(bridge&&!bridgeCaptionDrawn&&a+width>=0&&a<=360){
    bridgeCaptionDrawn=true;
    if(input.fast&&!journey){ctx.font='bold 11px sans-serif';ctx.fillStyle='#ffadbf';ctx.fillText('離して着地',Math.max(4,Math.min(a+2,278)),y-12);}
  }
 }
 if(level.checkpoint){const cp=sx(level.checkpoint.x);ctx.strokeStyle='#8ee7cb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cp,y-50);ctx.lineTo(cp,y);ctx.stroke();ctx.beginPath();ctx.arc(cp+8,y-43,7,0,Math.PI*2);ctx.stroke();if(!journey){ctx.fillStyle='#8ee7cb';ctx.font='10px sans-serif';ctx.fillText('月印',cp-9,y-60);}}
 if(level.bonusIsland&&!state.bonus){const bx=sx((level.bonusIsland.a+level.bonusIsland.b)/2);
  if(journey){const glow=ctx.createRadialGradient(bx,y-36,2,bx,y-36,30);glow.addColorStop(0,'#ffe9a888');glow.addColorStop(1,'#ffe9a800');ctx.fillStyle=glow;ctx.fillRect(bx-30,y-66,60,60);}
  ctx.strokeStyle='#ffd879';ctx.beginPath();ctx.moveTo(bx,y-15);ctx.lineTo(bx,y-55);ctx.stroke();for(let i=0;i<3;i++){ctx.fillStyle=i===1?'#e5becd':'#f4f0e7';ctx.beginPath();ctx.arc(bx,y-26-i*10,5,0,Math.PI*2);ctx.fill();}
  if(!journey){ctx.fillStyle='#ffd879';ctx.font='10px sans-serif';ctx.fillText('着地で団子',bx-26,y-65);}}
 const failed=mode==='result'&&state.status==='dead';
 const finish=sx(level.goal[0]),goalR=sx(level.goal[1]);
 // Gold landing pad over the goal span, under the ring so the ring stays on top.
 if(journey){if(goalR>-60&&finish<W+60)sky.drawGoal(ctx,finish,goalR,y);}
 else if(goalR>-10&&finish<W+10){const beam=ctx.createLinearGradient(0,y-120,0,y);beam.addColorStop(0,'#ffd65a00');beam.addColorStop(1,'#ffd65a40');ctx.fillStyle=beam;ctx.fillRect(finish,y-120,goalR-finish,120);ctx.fillStyle='#ffcf4a';ctx.fillRect(finish,y-2,goalR-finish,4);}
 sky.drawTrail(ctx,sx);sky.drawMotes(ctx,sx);
 // A gold ring means this landing takes the dango.
 const isle=level.bonusIsland,takesDango=journey&&isle&&!state.bonus&&next.safe&&next.x>=isle.a&&next.x<=isle.b;
 if(state.status!=='clear'){const nx=sx(failed?state.x:next.x);
 ctx.strokeStyle=failed||!next.safe?'#ff9daf':takesDango?'#ffd879':'#8ee7cb';
 // Prediction ring always reads first: dark under-shadow, tinted fill, bright stroke and a short stem.
 const pulse=sky.reduceMotion?1:1+Math.sin(performance.now()/100)*.06;
 ctx.fillStyle='#050a1c88';ctx.beginPath();ctx.ellipse(nx,y-3,18*pulse,7.5*pulse,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=ctx.strokeStyle+'55';ctx.beginPath();ctx.ellipse(nx,y-4,15*pulse,6*pulse,0,0,Math.PI*2);ctx.fill();
 ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(nx,y-4,15*pulse,6*pulse,0,0,Math.PI*2);ctx.stroke();
 ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(nx,y-11);ctx.lineTo(nx,y-26);ctx.stroke();
 ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 12px sans-serif';
 // Journey: the ring is the label; only danger gets a mark.
 if(!journey)ctx.fillText(failed?'×':next.safe?'NEXT':'MISS!',nx-16,y-22);
 else if(failed||!next.safe){ctx.font='bold 14px sans-serif';ctx.fillText('×',nx-4,y-14);}}
 if(!journey){ctx.fillStyle='#ffd879';ctx.fillRect(finish,y-90,2,90);ctx.font='11px sans-serif';ctx.fillText('GOAL',finish+5,y-80);}
 if(level.festival){for(let i=0;i<5;i++){const lx=finish-35+i*24;ctx.strokeStyle='#e6bf73';ctx.beginPath();ctx.moveTo(lx,y-65);ctx.lineTo(lx,y);ctx.stroke();ctx.fillStyle=i%2?'#e4c5eb':'#ffdb83';ctx.beginPath();ctx.ellipse(lx,y-70,7,9,0,0,Math.PI*2);ctx.fill();}}

 const height=Math.sin(viewState.phase/PERIOD*Math.PI)*95;
 const pose=state.status==='clear'?'happy':state.status==='dead'?'land':mode==='ready'?'front':height<36?'land':input.fast?'fast':'slow';
 ctx.globalAlpha=Math.max(.12,.45-height/240);ctx.fillStyle='#a9dcff';ctx.beginPath();ctx.ellipse(heroX,y,Math.max(7,15-height*.07),3,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 michiru.draw(ctx,heroX,y-height,pose);
 if(failed){ctx.fillStyle='#fb7c8c22';ctx.fillRect(0,0,W,H);}
}
// The board keeps a 360-wide logical frame and grows taller with the screen; backing pixels follow DPR.
let W=360,H=420,FLOOR=270,skyClock=null;
const sky=createSky();sky.reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function fit(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const dpr=Math.min(3,devicePixelRatio||1);
 H=Math.max(420,Math.min(800,Math.round(W*r.height/r.width)));FLOOR=Math.round(H*.64);
 canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.width*dpr*H/W);}
new ResizeObserver(fit).observe(canvas);fit();
function frame(time){
 const dt=skyClock===null?0:Math.min((time-skyClock)/1000,.05);skyClock=time;
 if(last!==null&&mode==='playing'){const events=advanceMoon(state,level,Math.min((time-last)/1000,.05),input.fast);audio.play(events);if(events.some(e=>e.type==='landing'))sky.landing(state.x,FLOOR);if(journey&&events.includes('bonus'))sky.pop(state.x,FLOOR-70,t('dangoPop'));if(state.status!=='playing')finish();}
 last=time;
 const live=mode==='playing'&&state.status==='playing',height=Math.sin(state.phase/PERIOD*Math.PI)*95;
 if(live&&input.fast!==wasFast){audio.whoosh(input.fast);if(input.fast)touched();}
 wasFast=live&&input.fast;
 stepPractice(dt,live);
 sky.step(dt,input.fast,live,{x:state.x-10,y:FLOOR-height-24});
 audio.mix(live?(input.fast?'fast':'slow'):'menu');
 render();if(titleOpen())renderTitle();requestAnimationFrame(frame);}
let wasFast=false;
$('resume').addEventListener('click',()=>{clearInput();void audio.activate();mode='playing';render();});
$('mute').addEventListener('click',()=>{audio.setMuted(!audio.muted);render();});
// ---- Journey: title screen, language switch, way home.
const titleScreen=$('title-screen'),titleArt=$('title-art'),titleCtx=titleArt?.getContext('2d');
const titleOpen=()=>!!titleScreen&&!titleScreen.hidden;
function showTitle(){if(!titleScreen)return;select(stageIndex);audio.suspend();titleScreen.hidden=false;$('title-start').focus({preventScroll:true});}
function hideTitle(){titleScreen.hidden=true;}
function renderTitle(){
 if(titleScreen.classList.contains('has-art'))return;
 const r=titleArt.getBoundingClientRect();if(!r.width)return;const dpr=Math.min(3,devicePixelRatio||1),TH=Math.round(360*r.height/r.width);
 if(titleArt.width!==Math.round(r.width*dpr)){titleArt.width=Math.round(r.width*dpr);titleArt.height=Math.round(r.height*dpr);}
 const g=titleCtx,floor=Math.round(TH*.6),now=performance.now()/1000;g.setTransform(titleArt.width/360,0,0,titleArt.height/TH,0,0);
 sky.drawSky(g,360,TH,floor,now*28);
 // Earth rising behind, and a pale crescent under the logo.
 g.fillStyle='#4f86b8';g.beginPath();g.arc(310,floor-120,64,0,Math.PI*2);g.fill();g.fillStyle='#7fb8d8';g.beginPath();g.ellipse(292,floor-140,20,32,-.4,0,Math.PI*2);g.ellipse(330,floor-100,24,16,.5,0,Math.PI*2);g.fill();
 g.fillStyle='#f3ead0';g.beginPath();g.arc(62,TH*.3,24,0,Math.PI*2);g.fill();g.fillStyle='#16205a';g.beginPath();g.arc(72,TH*.3-6,22,0,Math.PI*2);g.fill();
 const dash=[];for(let x=30;x<330;x+=26)dash.push(x);sky.drawLane(g,-20,380,0,360,floor,dash);
 const bob=sky.reduceMotion?0:Math.abs(Math.sin(now*2.4))*14;
 g.globalAlpha=.4;g.fillStyle='#a9dcff';g.beginPath();g.ellipse(180,floor,30-bob*.4,5,0,0,Math.PI*2);g.fill();g.globalAlpha=1;
 michiru.draw(g,180,floor-2-bob,'front',1.3);
}
function applyLang(){
 i18n.apply();
 $('resume').textContent=t('resumeButton');$('hold').setAttribute('aria-label',t('holdLabel'));
 $('pause').setAttribute('aria-label',t('pauseLabel'));$('help').setAttribute('aria-label',t('helpLabel'));$('home').setAttribute('aria-label',t('homeLabel'));
 for(const b of [$('lang'),$('title-lang')]){b.textContent=t('lang');b.setAttribute('aria-label',t('langLabel'));}
 canvas.setAttribute('aria-label',t('canvas'));document.querySelector('.stage-tabs').setAttribute('aria-label',i18n.lang==='ja'?'ステージ':'Stages');
 $('title-start').textContent=t('titleStart');$('title-select').textContent=t('titleSelect');$('title-sub').textContent=t('subtitle');
 labelStops();
 if(mode==='ready')select(stageIndex);else if(mode==='paused')show(t('pause'),'',t('resume'));else if(mode==='result')showResult();
 render();
}
if(journey){
 const keyArt=$('title-img');if(keyArt){const on=()=>titleScreen.classList.add('has-art');if(keyArt.complete&&keyArt.naturalWidth)on();else keyArt.addEventListener('load',on,{once:true});}
 for(const b of [$('lang'),$('title-lang')])b.addEventListener('click',()=>{i18n.toggle();applyLang();});
 $('title-mute').addEventListener('click',()=>{audio.setMuted(!audio.muted);render();});
 $('title-start').addEventListener('click',()=>{hideTitle();const open=moonLevels.findIndex((_,i)=>!results[i]);select(open<0?0:open);start();});
 $('title-select').addEventListener('click',()=>{hideTitle();select(stageIndex);});
 $('home').addEventListener('click',showTitle);
}
select(0);if(journey){applyLang();titleScreen.hidden=false;}requestAnimationFrame(frame);
window.__MOON_LAB__={get stage(){return level.id;},get sprites(){return michiru.status;},get pose(){return michiru.pose;},get state(){return structuredClone(state);},get mode(){return mode;},get fast(){return input.fast;},get prediction(){return predictMoon(previewState(),level,input.fast);},get stats(){return structuredClone(stats);},get audio(){return audio.diagnostics;}};
