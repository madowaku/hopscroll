import {PERIOD} from './core.mjs';
import {createInput} from './star-run-core.mjs';
import {moonLevels} from './moon-levels.mjs';
import {createMoonState,advanceMoon,retryMoon,predictMoon} from './moon-core.mjs';
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d'),input=createInput();
let level=moonLevels[0],state=createMoonState(level),mode='ready',last=null;
const stats={attempts:0,falls:[],hints:0,clears:0,bonusClears:0};
const explanations={
 'quiet-bridge-fast':'月光橋にFASTで着地しました。着く前に指を離すと、橋が光って踏めます。',
 undershoot:'足場まで、あと少し。HOLDを少し長くしてみよう。',
 overshoot:'足場を飛び越えました。少し早く指を離してみよう。',
 edge:'足場の端でした。NEXTの輪を、明るい面の内側へ。'
};
function clearInput(){input.reset();last=null;}
function show(title,description,action){$('title').textContent=title;$('description').textContent=description;$('action').textContent=action;$('panel').hidden=false;$('demo').hidden=mode!=='ready'||level.id!=='003';$('restart').hidden=mode==='ready';}
function select(index){clearInput();level=moonLevels[index];state=createMoonState(level);mode='ready';$('eyebrow').textContent=`STAGE ${level.id}`;
 document.querySelectorAll('[data-stage]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
 show(level.title,level.id==='003'?'速く進み、着地前に離す。月光橋はSLOWの時だけ、あなたを支えます。':'近い足場と遠い足場。途中の道が違っても、その先でまた出会えます。遠い島のおまけ団子は任意です。','はじめる');render();}
function start(fromStart=false){clearInput();state=retryMoon(state,level,fromStart);mode='playing';stats.attempts++;$('panel').hidden=true;render();}
function pause(help=false){if(mode!=='playing')return;clearInput();mode='paused';if(help)stats.hints++;show(help?'速さを変えて、着地点を選ぶ':'ひと休み',help?'押すとFAST、離すとSLOW。NEXTの輪が明るい面の内側なら安全。月光橋はSLOW着地だけ。団子は島への着地で獲得。':'再開するとSLOWに戻ります。','つづける');}
$('action').addEventListener('click',()=>{if(mode==='paused'){clearInput();mode='playing';$('panel').hidden=true;}else start(state.status==='clear');});
$('restart').addEventListener('click',()=>start(true));$('pause').addEventListener('click',()=>pause());$('help').addEventListener('click',()=>{if(mode==='playing')pause(true);else if(mode==='ready'){$('description').textContent='HOLDで距離を稼ぎ、離して着地を調整。NEXTは今の速度を保った場合の予測。月光橋は離して踏もう。';stats.hints++;}});
for(const button of document.querySelectorAll('[data-stage]'))button.addEventListener('click',()=>select(Number(button.dataset.stage)));
for(const target of [canvas,$('hold')]){
 target.addEventListener('pointerdown',e=>{if(mode!=='playing'&&mode!=='ready')return;e.preventDefault();input.pointers.add(e.pointerId);target.setPointerCapture(e.pointerId);render();});
 target.addEventListener('lostpointercapture',e=>{input.pointers.delete(e.pointerId);render();});
}
window.addEventListener('pointerup',e=>{input.pointers.delete(e.pointerId);render();});window.addEventListener('pointercancel',()=>{clearInput();render();});
window.addEventListener('keydown',e=>{if(e.code==='Space'&&(mode==='playing'||mode==='ready')&&e.target.tagName!=='BUTTON'){e.preventDefault();if(!e.repeat)input.keys.add(e.code);}else if(e.code==='Space'&&mode==='playing'){e.preventDefault();if(!e.repeat)input.keys.add(e.code);}if(e.code==='Escape')pause();});
window.addEventListener('keyup',e=>{input.keys.delete(e.code);render();});
function suspend(){clearInput();pause();}window.addEventListener('blur',suspend);window.addEventListener('pagehide',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
function finish(){clearInput();mode='result';if(state.status==='clear'){stats.clears++;if(state.bonus)stats.bonusClears++;show(state.fullMoon?'FULL MOON':'STAGE CLEAR',state.fullMoon?'月印から戻らず、渡りきりました。もう一つのリズムも探してみよう。':'月印からの旅も、無事に到着。次は最初からのFULL MOONにも挑めます。','もう一度');}else{stats.falls.push({stage:level.id,hop:state.jumps,x:state.x,reason:state.failure.reason});show('もう一度、渡ろう。',explanations[state.failure.reason]||'NEXTの輪を、明るい足場へ。',state.checkpoint?'月印から再挑戦':'再挑戦');}}
function render(){
 $('progress').textContent=`HOP ${state.jumps}`;$('checkpoint').textContent=state.usedCheckpoint?'月印から再開':state.checkpoint?'月印 記録済':'月印 —';$('bonus').textContent=level.id==='004'?(state.bonus?'団子 GET':'団子 —'):'SLOWで橋が光る';
 $('hold').classList.toggle('active',input.fast);$('speed').textContent=input.fast?'FAST → 離して SLOW':'HOLD → FAST';$('bridge-demo').classList.toggle('fast',input.fast);$('bridge-demo').textContent=input.fast?'FAST：橋が透ける・踏めない':'SLOW：橋が光る・踏める';
 const next=predictMoon(state,level,input.fast),offset=state.x-65,sx=x=>x-offset,y=310;
 $('hint').textContent=mode==='playing'?(level.id==='003'?'薄藤の橋は、離して着地。NEXTの輪が赤なら危険。':state.x>1250&&state.x<1720?'近い足場か、団子の島か。どちらからでも、その先へ。':'NEXTは今の速度を保った着地点。団子は着地で獲得。'):'NEXTの輪は、今の速度のまま跳んだ着地点。';
 ctx.clearRect(0,0,360,420);
 // Quiet, code-native greybox scenery; no final Michiru art is implied.
 ctx.fillStyle='#667596';for(let i=0;i<22;i++){const x=(i*97+17-(state.x*.08)%360+360)%360;ctx.fillRect(x,30+(i*47)%190,1.5,1.5);}
 ctx.fillStyle='#222b46';ctx.beginPath();ctx.arc(302,68,25,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#bfc6df';ctx.font='12px sans-serif';ctx.fillText(level.title,15,23);
 for(const surface of level.surfaces){const a=sx(surface.a+8),width=surface.b-surface.a-16;if(a+width<0||a>360)continue;
  const bridge=surface.kind==='bridge';ctx.fillStyle=bridge?(input.fast?'#3c3553':'#7777ac'):'#394961';ctx.fillRect(a,y,width,bridge?12:60);
  ctx.strokeStyle=bridge?(input.fast?'#caa7c7':'#bfb7e8'):'#f4f0e7';ctx.lineWidth=3;ctx.setLineDash(bridge&&input.fast?[5,5]:[]);ctx.beginPath();ctx.moveTo(a,y);ctx.lineTo(a+width,y);ctx.stroke();ctx.setLineDash([]);
  if(bridge){ctx.font='10px sans-serif';ctx.fillStyle=input.fast?'#ff9daf':'#d7d1fb';ctx.fillText(input.fast?'離して着地':'SLOW ONLY',a+2,y+32);}
 }
 const cp=sx(level.checkpoint.x);ctx.strokeStyle='#8ee7cb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cp,y-50);ctx.lineTo(cp,y);ctx.stroke();ctx.beginPath();ctx.arc(cp+8,y-43,7,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#8ee7cb';ctx.font='10px sans-serif';ctx.fillText('月印',cp-9,y-60);
 if(level.bonusIsland&&!state.bonus){const bx=sx(1620);ctx.strokeStyle='#ffd879';ctx.beginPath();ctx.moveTo(bx,y-15);ctx.lineTo(bx,y-55);ctx.stroke();for(let i=0;i<3;i++){ctx.fillStyle=i===1?'#e5becd':'#f4f0e7';ctx.beginPath();ctx.arc(bx,y-26-i*10,5,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#ffd879';ctx.font='10px sans-serif';ctx.fillText('着地で団子',bx-26,y-65);}
 const nx=sx(next.x);ctx.strokeStyle=next.safe?'#8ee7cb':'#ff9daf';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(nx,y-4,13,5,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 11px sans-serif';ctx.fillText(next.safe?'NEXT':'MISS!',nx-16,y-20);
 const finish=sx(level.goal[0]);ctx.fillStyle='#ffd879';ctx.fillRect(finish,y-90,2,90);ctx.font='11px sans-serif';ctx.fillText('GOAL',finish+5,y-80);
 const by=y-12-Math.sin(state.phase/PERIOD*Math.PI)*95;ctx.fillStyle='#f4f0e7';ctx.beginPath();ctx.ellipse(65,by,12,11,0,0,Math.PI*2);ctx.fill();ctx.save();ctx.translate(65,by);ctx.rotate(input.fast?-.35:0);ctx.fillRect(-8,-27,5,20);ctx.fillRect(1,-30,5,20);ctx.restore();ctx.fillStyle='#243052';ctx.fillRect(70,by-4,3,3);
}
function frame(time){if(last!==null&&mode==='playing'){advanceMoon(state,level,Math.min((time-last)/1000,.05),input.fast);if(state.status!=='playing')finish();}last=time;render();requestAnimationFrame(frame);}
select(0);requestAnimationFrame(frame);
window.__MOON_LAB__={get state(){return structuredClone(state);},get mode(){return mode;},get fast(){return input.fast;},get prediction(){return predictMoon(state,level,input.fast);},get stats(){return structuredClone(stats);}};
