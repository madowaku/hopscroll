import {PERIOD,predictLanding,isSafe} from './core.mjs';
import {course,gates,bonusStars,newRun,stepRun,readBest,saveBest,createInput} from './star-run-core.mjs';
const $=id=>document.getElementById(id),canvas=$('play'),ctx=canvas.getContext('2d'),input=createInput();
let storage;try{storage=window.localStorage;}catch{}
let best=readBest(storage),state=newRun(),running=false,paused=false,last=null;
function resetInput(){input.reset();$('hold').classList.remove('active');last=null;}
function reset(){resetInput();state=newRun();running=true;paused=false;$('result').hidden=true;render();}
function score(){return {gates:state.gates,stars:state.starCount};}
function finish(){running=false;resetInput();best=saveBest(storage,best,score());$('message').textContent=state.status==='clear'?'COURSE COMPLETE':'TRY AGAIN';$('summary').textContent=`${state.gates} GATES · ${state.starCount} STARS · BEST ${best.gates} / ${best.stars}★`;$('retry').textContent='RETRY';$('result').hidden=false;}
function suspend(){resetInput();if(running){paused=true;$('message').textContent='PAUSED';$('summary').textContent='Take a breath. Resume with SLOW.';$('retry').textContent='RESUME';$('result').hidden=false;}}
$('retry').addEventListener('click',()=>{if(paused){resetInput();paused=false;$('result').hidden=true;}else reset();});
for(const el of [canvas,$('hold')]) {
 el.addEventListener('pointerdown',e=>{e.preventDefault();if(!running||paused)return;input.pointers.add(e.pointerId);el.setPointerCapture(e.pointerId);});
 el.addEventListener('lostpointercapture',e=>input.pointers.delete(e.pointerId));
}
window.addEventListener('pointerup',e=>input.pointers.delete(e.pointerId));
window.addEventListener('pointercancel',resetInput);
window.addEventListener('keydown',e=>{if(e.code==='Space'&&running&&!paused){e.preventDefault();if(!e.repeat)input.keys.add(e.code);}});
window.addEventListener('keyup',e=>input.keys.delete(e.code));
window.addEventListener('blur',suspend);
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
window.addEventListener('pagehide',suspend);
function render(){
 $('gates').textContent=state.gates;$('stars').textContent=state.starCount;$('best').textContent=`${best.gates} / ${best.stars}★`;
 $('hold').classList.toggle('active',input.fast);$('hold').textContent=input.fast?'FAST · RELEASE TO BRAKE':'HOLD TO GO FAST';
 const offset=state.x-65,screen=x=>x-offset,y=265;
 ctx.clearRect(0,0,360,360);ctx.fillStyle='#a7b7d5';ctx.font='12px system-ui';ctx.fillText(`HOP ${Math.min(state.jumps+1,24)} / 24`,16,26);ctx.fillText(input.fast?'FAST 270':'SLOW 105',260,26);
 for(const gate of gates){const a=screen(gate.left),b=screen(gate.right);if(b<0||a>360)continue;ctx.fillStyle='#4b2846';ctx.fillRect(a,y,b-a,65);ctx.strokeStyle='#985574';for(let n=a;n<b;n+=12){ctx.beginPath();ctx.moveTo(n,y+8);ctx.lineTo(Math.min(n+10,b),y+24);ctx.stroke();}}
 for(const [a,b] of course.platforms){ctx.fillStyle='#234958';ctx.fillRect(screen(a),y,b-a,65);ctx.fillStyle='#8cf5cf';ctx.fillRect(screen(a+8),y,b-a-16,5);}
 ctx.font='22px system-ui';ctx.fillStyle='#f9db81';for(const star of bonusStars)if(!state.collected.includes(star.id))ctx.fillText('★',screen(star.x)-10,y-75);
 const next=predictLanding(state,input.fast),nx=screen(next);ctx.strokeStyle=isSafe(course,next)?'#8cf5cf':'#ff9aaf';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(nx,y-25);ctx.lineTo(nx,y-5);ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 12px system-ui';ctx.fillText('NEXT',nx-16,y-33);
 ctx.fillStyle='#f9db81';ctx.fillRect(screen(course.goal[0]),y-115,3,115);ctx.font='12px system-ui';ctx.fillText('FINISH',screen(course.goal[0])+5,y-100);
 const by=y-12-Math.sin(state.phase/PERIOD*Math.PI)*95;ctx.fillStyle='#f4f5ff';ctx.beginPath();ctx.ellipse(65,by,12,11,0,0,Math.PI*2);ctx.fill();ctx.fillRect(57,by-26,5,20);ctx.fillRect(66,by-28,5,20);ctx.fillStyle='#182039';ctx.fillRect(70,by-4,3,3);
}
render();
function frame(time){if(last!==null&&running&&!paused){stepRun(state,Math.min((time-last)/1000,.05),input.fast);if(state.status!=='playing')finish();}last=time;render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
// Read-only snapshots for smoke tests; no teleport or collision bypass.
window.__STAR_RUN__={get state(){return structuredClone(state);},get fast(){return input.fast;},get paused(){return paused;}};
