import {createMichiru} from './michiru.mjs';
import {createMoonAudio} from './moon-audio.mjs';
import {PERIOD} from './core.mjs';
import {createInput} from './star-run-core.mjs';
import {moonLevels as labLevels} from './moon-levels.mjs';
import {journeyLevels} from './moon-journey-levels.mjs';
const journey=document.body.dataset.journey==='true';
const moonLevels=journey?journeyLevels:labLevels;
import {createMoonState,advanceMoon,retryMoon,predictMoon} from './moon-core.mjs';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d'),input=createInput();
let level=moonLevels[0],state=createMoonState(level),mode='ready',last=null;
const audio=createMoonAudio(),michiru=createMichiru();
let stageIndex=0;
const stats={attempts:0,falls:[],hints:0,clears:0,bonusClears:0};
const failureWords={
 'quiet-bridge-fast':['橋が消えた！','指を離して着地。'],
 undershoot:['届かなかった！','HOLDを長めに。'],
 overshoot:['飛び越した！','少し早く離そう。'],
 edge:['端に落ちた！','輪を足場の中へ。']
};
// Avoid repeatedly announcing identical live-region text at animation framerate.
function setHint(value){if($('hint').textContent!==value)$('hint').textContent=value;}
function clearInput(){input.reset();last=null;}
function show(title,description,action){$('title').textContent=title;$('description').textContent=description;$('action').textContent=action;$('panel').hidden=false;$('demo').hidden=mode!=='ready'||level.id!=='003';$('restart').hidden=mode==='ready';}
function select(index){audio.suspend();clearInput();stageIndex=index;level=moonLevels[index];state=createMoonState(level);mode='ready';$('eyebrow').textContent=`STAGE ${level.id}`;
 document.querySelectorAll('[data-stage]').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===index));if(journey)b.setAttribute('aria-label',`Stage ${moonLevels[i].id} ${moonLevels[i].title}`);});
 show(level.title,level.id==='003'?'着地する速さで、橋が変わる。':level.subtitle,'はじめる');render();}
function start(fromStart=false){clearInput();state=retryMoon(state,level,fromStart);mode=state.usedCheckpoint?'checkpoint-ready':'playing';audio.stop();if(mode==='playing')void audio.activate();else audio.suspend();stats.attempts++;$('panel').hidden=true;render();}
function pause(help=false){if(mode!=='playing')return;audio.suspend();clearInput();mode='paused';if(help)stats.hints++;show(help?'指一本で、着地点を選ぶ':'ひと休み',help?'HOLDでFAST、離すとSLOW。月光橋は離して着地。':'','つづける');}
$('action').addEventListener('click',()=>{if(mode==='paused'){clearInput();void audio.activate();mode='playing';$('panel').hidden=true;}else if(journey&&state.status==='clear'&&stageIndex<moonLevels.length-1)select(stageIndex+1);else if(journey&&state.status==='clear')select(0);else start(state.status==='clear');});
$('restart').addEventListener('click',()=>start(true));$('pause').addEventListener('click',()=>pause());$('help').addEventListener('click',()=>{if(mode==='playing')pause(true);else if(mode==='ready'){$('description').textContent='押して進み、離して着地。緑の輪が安全。';stats.hints++;}});
if(journey){const nav=document.querySelector('.stage-tabs');nav.replaceChildren(...moonLevels.map((l,i)=>{const b=document.createElement('button');b.dataset.stage=String(i);const n=document.createElement('span');n.className='stage-number';n.textContent=l.id.slice(1);const name=document.createElement('span');name.className='stage-name';name.textContent=l.title;b.append(n,name);return b;}));}
for(const button of document.querySelectorAll('[data-stage]'))button.addEventListener('click',()=>select(Number(button.dataset.stage)));
for(const target of [canvas,$('hold')]){
 target.addEventListener('pointerdown',e=>{if(mode!=='playing'&&mode!=='ready')return;e.preventDefault();input.pointers.add(e.pointerId);target.setPointerCapture(e.pointerId);render();});
 target.addEventListener('lostpointercapture',e=>{input.pointers.delete(e.pointerId);render();});
}
window.addEventListener('pointerup',e=>{input.pointers.delete(e.pointerId);render();});window.addEventListener('pointercancel',()=>{clearInput();render();});
window.addEventListener('keydown',e=>{if(e.code==='Space'&&(mode==='playing'||mode==='ready')&&e.target.tagName!=='BUTTON'){e.preventDefault();if(!e.repeat)input.keys.add(e.code);}else if(e.code==='Space'&&mode==='playing'){e.preventDefault();if(!e.repeat)input.keys.add(e.code);}if(e.code==='Escape')pause();});
window.addEventListener('keyup',e=>{input.keys.delete(e.code);render();});
function suspend(){audio.suspend();clearInput();pause();}window.addEventListener('blur',suspend);window.addEventListener('pagehide',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
function finish(){clearInput();mode='result';if(state.status==='clear'){stats.clears++;if(state.bonus)stats.bonusClears++;show(state.fullMoon?'FULL MOON!':'STAGE CLEAR',level.festival?'地球見祭に、団子が届いた。':state.fullMoon?'月印から戻らず渡りきった。':'無事に渡りきった。',journey?(stageIndex<moonLevels.length-1?'次の月道へ':'もう一度、月の庭へ'):'もう一度');}else{stats.falls.push({stage:level.id,hop:state.jumps,x:state.x,reason:state.failure?.reason});const [title,why]=failureWords[state.failure?.reason]||['落ちちゃった！','着地点を見直そう。'];show(title,why,state.checkpoint?'☾ 月印から再挑戦':'もう一度');}}
function previewState(){return mode==='ready'&&level.id==='003'?{...state,x:760,phase:.5}:state;}
function render(){
 $('progress').textContent=`HOP ${state.jumps}`;
 $('checkpoint').hidden=!state.checkpoint;$('checkpoint').textContent=state.usedCheckpoint?'☾ 月印から':'☾ 月印';
 $('bonus').hidden=!state.bonus;$('bonus').textContent='● 団子';
 $('hold').classList.toggle('active',input.fast);$('speed').textContent=input.fast?'FAST · RELEASE':'HOLD · FAST';$('bridge-demo').classList.toggle('fast',input.fast);$('bridge-demo').textContent=input.fast?'FAST：橋は透ける':'SLOW：橋は光る';
 const zoom=mode==='checkpoint-ready'?.6:1;
 // Frozen first-bridge demonstration uses the real collision/prediction rule.
 const viewState=previewState();
 const next=predictMoon(viewState,level,input.fast),offset=viewState.x-65/zoom,sx=x=>(x-offset)*zoom,y=270;
 $('resume').hidden=mode!=='checkpoint-ready';
 $('mute').textContent=audio.muted?'♪̸':'♪';$('mute').setAttribute('aria-pressed',String(audio.muted));$('mute').setAttribute('aria-label',audio.muted?'効果音をオン':'効果音をミュート');
 setHint(mode==='playing'?(level.id==='003'?'薄藤の橋は、離して着地。NEXTの輪が赤なら危険。':state.x>1250&&state.x<1720?'近い足場か、団子の島か。どちらからでも、その先へ。':'NEXTは今の速度を保った着地点。団子は着地で獲得。'):'NEXTの輪は、今の速度のまま跳んだ着地点。');
 if(mode==='checkpoint-ready')setHint('NEXTを確認。最初はSLOWで安全。');
 ctx.clearRect(0,0,360,420);
 // Quiet sky keeps the landing track readable behind Michiru.
 ctx.fillStyle='#667596';for(let i=0;i<22;i++){const x=(i*97+17-(state.x*.08)%360+360)%360;ctx.fillRect(x,30+(i*47)%190,1.5,1.5);}
 ctx.fillStyle=level.festival?'#72b9c8':'#222b46';ctx.beginPath();
 const earth=level.festival?26+22*Math.min(1,state.x/level.goal[0]):25;ctx.arc(302,68,earth,0,Math.PI*2);ctx.fill();
 if(level.festival){ctx.save();ctx.beginPath();ctx.arc(302,68,earth,0,Math.PI*2);ctx.clip();ctx.fillStyle='#a9d8ba';ctx.beginPath();ctx.ellipse(288,54,14,23,-.4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(320,80,18,13,.5,0,Math.PI*2);ctx.fill();ctx.restore();}

 // The selected stage is already visible in the tabs; do not repeat its title in the sky.
 let bridgeCaptionDrawn=false;
 for(const surface of level.surfaces){const a=sx(surface.a+8),width=(surface.b-surface.a-16)*zoom;if(a+width<0||a>360)continue;
  const bridge=surface.kind==='bridge';ctx.fillStyle=bridge?(input.fast?'#3c3553':'#7777ac'):'#394961';ctx.fillRect(a,y,width,bridge?12:60);
  ctx.strokeStyle=bridge?(input.fast?'#caa7c7':'#bfb7e8'):'#f4f0e7';ctx.lineWidth=3;ctx.setLineDash(bridge&&input.fast?[5,5]:[]);ctx.beginPath();ctx.moveTo(a,y);ctx.lineTo(a+width,y);ctx.stroke();ctx.setLineDash([]);
  if(bridge&&!bridgeCaptionDrawn&&a+width>=0&&a<=360){
    bridgeCaptionDrawn=true;
    if(input.fast){ctx.font='bold 11px sans-serif';ctx.fillStyle='#ffadbf';ctx.fillText('離して着地',Math.max(4,Math.min(a+2,278)),y-12);}
  }
 }
 if(level.checkpoint){const cp=sx(level.checkpoint.x);ctx.strokeStyle='#8ee7cb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cp,y-50);ctx.lineTo(cp,y);ctx.stroke();ctx.beginPath();ctx.arc(cp+8,y-43,7,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#8ee7cb';ctx.font='10px sans-serif';ctx.fillText('月印',cp-9,y-60);}
 if(level.bonusIsland&&!state.bonus){const bx=sx((level.bonusIsland.a+level.bonusIsland.b)/2);ctx.strokeStyle='#ffd879';ctx.beginPath();ctx.moveTo(bx,y-15);ctx.lineTo(bx,y-55);ctx.stroke();for(let i=0;i<3;i++){ctx.fillStyle=i===1?'#e5becd':'#f4f0e7';ctx.beginPath();ctx.arc(bx,y-26-i*10,5,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#ffd879';ctx.font='10px sans-serif';ctx.fillText('着地で団子',bx-26,y-65);}
 const failed=mode==='result'&&state.status==='dead';
 if(state.status!=='clear'){const nx=sx(failed?state.x:next.x);
 ctx.strokeStyle=failed||!next.safe?'#ff9daf':'#8ee7cb';
 ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(nx,y-4,14,6,0,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 12px sans-serif';
 ctx.fillText(failed?'×':next.safe?'NEXT':'MISS!',nx-16,y-22);}
 const finish=sx(level.goal[0]);ctx.fillStyle='#ffd879';ctx.fillRect(finish,y-90,2,90);ctx.font='11px sans-serif';ctx.fillText('GOAL',finish+5,y-80);
 if(level.festival){for(let i=0;i<5;i++){const lx=finish-35+i*24;ctx.strokeStyle='#e6bf73';ctx.beginPath();ctx.moveTo(lx,y-65);ctx.lineTo(lx,y);ctx.stroke();ctx.fillStyle=i%2?'#e4c5eb':'#ffdb83';ctx.beginPath();ctx.ellipse(lx,y-70,7,9,0,0,Math.PI*2);ctx.fill();}}

 const height=Math.sin(viewState.phase/PERIOD*Math.PI)*95;
 const pose=state.status==='clear'?'happy':state.status==='dead'?'land':mode==='ready'?'front':height<36?'land':input.fast?'fast':'slow';
 michiru.draw(ctx,65,y-height,pose);

}
function frame(time){if(last!==null&&mode==='playing'){audio.play(advanceMoon(state,level,Math.min((time-last)/1000,.05),input.fast));if(state.status!=='playing')finish();}last=time;render();requestAnimationFrame(frame);}
$('resume').addEventListener('click',()=>{clearInput();void audio.activate();mode='playing';render();});
$('mute').addEventListener('click',()=>{audio.setMuted(!audio.muted);render();});
select(0);requestAnimationFrame(frame);
window.__MOON_LAB__={get stage(){return level.id;},get sprites(){return michiru.status;},get pose(){return michiru.pose;},get state(){return structuredClone(state);},get mode(){return mode;},get fast(){return input.fast;},get prediction(){return predictMoon(previewState(),level,input.fast);},get stats(){return structuredClone(stats);},get audio(){return audio.diagnostics;}};
