import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {journeyLevels as levels} from '../src/moon-journey-levels.mjs';
const executablePath=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>p&&existsSync(p));
const browser=await chromium.launch({executablePath,headless:true});
const url=process.env.JOURNEY_URL||'http://127.0.0.1:8013/moon-journey.html';
const errors=[];mkdirSync('docs/moon-journey-screenshots',{recursive:true});
async function open(width=360,height=640,broken=false){
 const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 page.on('requestfailed',r=>{if(!(broken&&r.url().endsWith('michiru-sprites.png')))errors.push(`request failed ${r.url()}`);});
 if(broken)await page.route('**/michiru-sprites.png',r=>r.abort());
 await page.clock.install();await page.goto(url);await page.waitForFunction(()=>window.__MOON_LAB__?.sprites!=='loading');
 assert.equal(await page.locator('#title-screen').isVisible(),true,'title screen not shown on load');await page.locator('#title-select').tap();return page;
}
async function play(page,route,expect='clear'){
 const events=[];let time=0,last=false;
 for(const c of route)for(const [dt,fast] of c==='M'?[[.5,true],[.28,false]]:[[.78,c==='F']]){
  if(fast!==last){events.push({time,fast});last=fast;}time+=dt;
 }
 const initial=await page.evaluate(()=>({x:window.__MOON_LAB__.state.x,stage:window.__MOON_LAB__.stage}));const level=levels.find(l=>l.id===initial.stage);let x=initial.x;const bridgeHops=new Set();
 for(let i=0;i<route.length;i++){x+=route[i]==='M'?164.4:route[i]==='F'?210.6:81.9;if(level.surfaces.some(s=>s.kind==='bridge'&&x>=s.a+8-1e-8&&x<=s.b-8+1e-8))bridgeHops.add(i+1);}
 for(let i=1;i<events.length;i++){const hop=Math.round(events[i].time/.78);if(Math.abs(events[i].time-hop*.78)<1e-8&&(route[hop-1]==='M'||bridgeHops.has(hop))&&route[hop]==='F'){events[i].time+=.06;events[i-1].time+=.06;}}
 await page.evaluate(events=>{for(const e of events)setTimeout(()=>window.dispatchEvent(new KeyboardEvent(e.fast?'keydown':'keyup',{code:'Space',bubbles:true})),e.time*1000);},events);
 await page.clock.runFor(time*1000+80);
 const end=await page.evaluate(()=>({stage:window.__MOON_LAB__.stage,state:window.__MOON_LAB__.state}));assert.equal(end.state.status,expect,JSON.stringify(end));
}
try{
 for(const [width,height] of [[320,700],[360,640],[720,1280]]){
  const page=await open(width,height);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.sprites),'ready');
  assert.equal(await page.locator('[data-stage]').count(),levels.length);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const hold=await page.locator('#hold').boundingBox();assert.ok(hold.y+hold.height<=height);
  // The whole board is the press target; aim at open sky above the lane (cards now sit below it).
  const sky0=await page.locator('.world').boundingBox(),press={x:sky0.x+sky0.width*.5,y:sky0.y+sky0.height*.3};
  for(let i=0;i<levels.length;i++){
   await page.locator(`[data-stage="${i}"]`).tap();
   const panel=await page.locator('#panel').boundingBox(),world=await page.locator('.world').boundingBox();
   // Cards sit in the night under the lane (thumb reach), never across the hop band or the lane.
   assert.ok(panel.y>=world.y+world.height*.64+10,'card overlaps landing track');assert.ok(panel.y+panel.height<=world.y+world.height+1,'card leaves the board');
   const button=await page.locator(`[data-stage="${i}"]`).boundingBox();assert.ok(button.x+button.width<=width);
  }
  // The first bridge demonstration actually changes collision prediction while frozen.
  await page.locator('[data-stage="2"]').tap();const slowDemo=await page.evaluate(()=>window.__MOON_LAB__.prediction);
  await page.mouse.move(press.x,press.y);await page.mouse.down();await page.clock.runFor(30);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.prediction.safe),false);assert.equal(slowDemo.safe,true);
  await page.mouse.up();
  await page.locator('[data-stage="0"]').tap();
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:press.x,y:press.y}]});assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),false);

  await page.screenshot({path:`docs/moon-journey-screenshots/entry-${width}.png`});
  await page.locator('#action').tap();await page.clock.runFor(400);
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.pose),'slow');
  await page.screenshot({path:`docs/moon-journey-screenshots/michiru-${width}.png`});
  await page.keyboard.down('Space');await page.clock.runFor(30);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.pose),'fast');
  await page.keyboard.up('Space');
  // Touch-first: anywhere on the board is FAST; menu buttons never are, and a stray route tap pauses the run.
  {const board=await page.locator('.world').boundingBox(),bx=board.x+board.width*.4,by=board.y+board.height*.82;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bx,y:by}]});assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),true,'board press is not FAST');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),false,'board release kept FAST');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bx,y:by}]});await page.evaluate(()=>window.dispatchEvent(new Event('pointercancel')));assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),false,'pointercancel kept FAST');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.locator('#mute').tap();assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),false,'mute became FAST');await page.locator('#mute').tap();
   await page.locator('[data-stage="3"]').tap();assert.equal(await page.evaluate(()=>window.__MOON_LAB__.mode),'paused');assert.equal(await page.evaluate(()=>window.__MOON_LAB__.stage),'001','route tap switched stage mid-run');assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),false);
   await page.locator('#action').tap();assert.equal(await page.evaluate(()=>window.__MOON_LAB__.mode),'playing');}
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>window.__MOON_LAB__.mode),'paused');assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),false);
  await page.locator('#action').tap();await page.clock.runFor(15000);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.status),'dead');
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.pose),'land');
  const failure=await page.locator('#panel').boundingBox(),world=await page.locator('.world').boundingBox();assert.ok(failure.y>=world.y+world.height*.64+10);
  await page.screenshot({path:`docs/moon-journey-screenshots/failure-${width}.png`});
  await page.locator('#action').tap();assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.jumps),0);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),false);
  await page.close();
 }
 {const p=await browser.newPage({viewport:{width:360,height:640},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));await p.clock.install();await p.goto(url);
  await p.waitForFunction(()=>window.__MOON_LAB__?.sprites!=='loading');const before=await p.evaluate(()=>document.documentElement.lang);
  await p.locator('#title-lang').tap();const after=await p.evaluate(()=>document.documentElement.lang);assert.notEqual(after,before,'language did not switch');
  await p.locator('#title-start').tap();assert.equal(await p.locator('#title-screen').isVisible(),false);assert.equal(await p.evaluate(()=>window.__MOON_LAB__.mode),'playing');assert.equal(await p.evaluate(()=>window.__MOON_LAB__.stage),'001');
  await p.locator('#pause').tap();assert.equal(await p.evaluate(()=>window.__MOON_LAB__.mode),'paused');await p.locator('#home').tap();assert.equal(await p.locator('#title-screen').isVisible(),true);await p.close();}
 const page=await open();
 for(let i=0;i<levels.length;i++){
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.stage),levels[i].id);
  await page.locator('#action').tap();await play(page,levels[i].route);
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.pose),'happy');
  await page.screenshot({path:`docs/moon-journey-screenshots/clear-${levels[i].id}.png`});
  if(i<levels.length-1)await page.locator('#action').tap();
 }
 await page.locator('#action').tap();assert.equal(await page.evaluate(()=>window.__MOON_LAB__.stage),'001');
 await page.close();
 // Every checkpoint and its actual restore path in the same built runtime.
 for(let i=1;i<levels.length;i++){
  console.log(`CHECKPOINT ${levels[i].id}`);
  const level=levels[i],p=await open();await p.locator(`[data-stage="${i}"]`).tap();
  // Explicitly validate the checkpoint-ready screen in English as well as Japanese.
  if(i===1){
    if(await p.evaluate(()=>document.documentElement.lang)!=='en')await p.locator('#lang').tap();
    assert.equal(await p.evaluate(()=>document.documentElement.lang),'en');
  }
  await p.locator('#action').tap();
  await play(p,level.route.slice(0,level.checkpoint.hop),'playing');
  const saved=await p.evaluate(()=>window.__MOON_LAB__.state.checkpoint);assert.ok(saved);
  await p.keyboard.up('Space');await p.clock.runFor(5000);assert.equal(await p.evaluate(()=>window.__MOON_LAB__.state.status),'dead');
  await p.locator('#action').tap();assert.equal(await p.evaluate(()=>window.__MOON_LAB__.mode),'checkpoint-ready');
  if(i===1)assert.match(await p.locator('#hint').textContent(),/Check the landing ring/, 'Checkpoint recovery hint must follow English UI');
  const restored=await p.evaluate(()=>window.__MOON_LAB__.state);assert.equal(restored.x,saved.x);assert.equal(restored.phase,0);assert.equal(restored.bonus,saved.bonus);
  await p.clock.runFor(500);assert.equal(await p.evaluate(()=>window.__MOON_LAB__.state.phase),0);assert.equal(await p.evaluate(()=>window.__MOON_LAB__.prediction.safe),true);
  if(level.festival)await p.screenshot({path:'docs/moon-journey-screenshots/festival-recovery.png'});
  await p.locator('#resume').tap();await play(p,level.recoveryRoute||level.route.slice(level.checkpoint.hop));
  assert.equal(await p.evaluate(()=>window.__MOON_LAB__.state.fullMoon),false);
  await p.locator('#restart').tap();assert.equal(await p.evaluate(()=>window.__MOON_LAB__.state.jumps),0);assert.equal(await p.evaluate(()=>window.__MOON_LAB__.state.usedCheckpoint),false);await p.close();
 }
 // Optional choices at both forks, using ordinary input and no mutable state hook.
 for(const [index,hop] of [[levels.findIndex(l=>l.id==='004'),9],[levels.findIndex(l=>l.festival),20]]){
  const p=await open(),level=levels[index];await p.locator(`[data-stage="${index}"]`).tap();await p.locator('#action').tap();
  const route=level.route.slice(0,hop)+(levels[index].id==='004'?'FS':'SF')+level.route.slice(hop+2);await play(p,route);
  assert.equal(await p.evaluate(()=>window.__MOON_LAB__.state.bonus),levels[index].id==='004');await p.close();
 }
 const fallback=await open(360,640,true);assert.equal(await fallback.evaluate(()=>window.__MOON_LAB__.sprites),'broken');
 await fallback.locator('#action').tap();await fallback.clock.runFor(400);
 await fallback.screenshot({path:'docs/moon-journey-screenshots/fallback.png'});await fallback.close();
 // Real-time narrow viewport performance/audio sanity, with the actual browser engine.
 const live=await browser.newPage({viewport:{width:320,height:700}});live.on('pageerror',e=>errors.push(e.message));await live.goto(url);await live.locator('#title-select').click();await live.locator('#action').click();
 const metrics=await live.evaluate(()=>new Promise(resolve=>{const frames=[];let last=performance.now(),peak=0;function frame(now){frames.push(now-last);last=now;peak=Math.max(peak,window.__MOON_LAB__.audio.peak);if(window.__MOON_LAB__.state.jumps>=2){frames.sort((a,b)=>a-b);resolve({frames:frames.length,p95:frames[Math.floor(frames.length*.95)],peak,played:window.__MOON_LAB__.audio.played});}else requestAnimationFrame(frame);}requestAnimationFrame(frame);}));
 assert.ok(metrics.frames>10);assert.ok(metrics.p95<100,'narrow viewport frame pacing exceeded sanity bound');assert.ok(metrics.peak>0,'built landing audio silent');assert.equal(metrics.played,2);
 await live.locator('#mute').click();await live.waitForFunction(()=>window.__MOON_LAB__.audio.state==='suspended');await live.locator('#pause').click();assert.equal(await live.evaluate(()=>window.__MOON_LAB__.fast),false);
 console.log('NARROW realtime',JSON.stringify(metrics));await live.close();
 assert.deepEqual(errors,[]);console.log('PASS Journey: English checkpoint hint, six-stage flow and completion, three viewports, sprite poses/failure fallback, bridge demo, optional forks, four checkpoint recoveries, touchCancel/blur/retry');
}finally{await browser.close();}
