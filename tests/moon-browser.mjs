import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {moonLevels} from '../src/moon-levels.mjs';
const executablePath=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>p&&existsSync(p));
const browser=await chromium.launch({executablePath,headless:true});
const errors=[];mkdirSync('docs/moon-lab-screenshots',{recursive:true});
const url=process.env.MOON_URL||'http://127.0.0.1:8000/moon-lab.html';
function schedule(route,guarded=false){
 const spans=[];for(const c of route)for(const [dt,fast]of c==='M'?[[.5,true],[.28,false]]:[[.78,c==='F']]){if(spans.at(-1)?.fast===fast)spans.at(-1).dt+=dt;else spans.push({dt,fast});}
 let t=0;const events=[{time:0,fast:spans[0].fast}];
 for(let i=0;i<spans.length-1;i++){t+=spans[i].dt;events.push({time:t,fast:spans[i+1].fast});}
 if(guarded)for(let i=1;i<events.length;i++){const hop=Math.round(events[i].time/.78);if(Math.abs(events[i].time-hop*.78)<1e-8&&route[hop-1]==='M'&&route[hop]==='F'){events[i].time+=.06;events[i-1].time+=.06;}}
 return events;
}
async function open(width=360,height=640,index=0){const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(url);await page.waitForFunction(()=>!!window.__MOON_LAB__);if(index)await page.locator(`[data-stage="${index}"]`).tap();return page;}
async function queue(page,route,guarded=false){await page.evaluate(events=>{for(const e of events)setTimeout(()=>window.dispatchEvent(new KeyboardEvent(e.fast?'keydown':'keyup',{code:'Space',bubbles:true})),e.time*1000);},schedule(route,guarded));}
try{
 for(const [width,height]of [[360,640],[720,1280],[320,700]]){
  const page=await open(width,height);await page.screenshot({path:`docs/moon-lab-screenshots/intro-${width}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const box=await page.locator('#hold').boundingBox();assert.ok(box.y+box.height<=height,'hold outside viewport');
  const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+20,y:box.y+20}]});assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),true);assert.match(await page.locator('#bridge-demo').innerText(),/踏めない/);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),false);
  await page.locator('#action').tap();await page.keyboard.down('Space');await page.clock.runFor(80);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>window.__MOON_LAB__.mode),'paused');assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),false);await page.keyboard.up('Space');await page.locator('#action').tap();await page.clock.runFor(4000);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.status),'dead');await page.locator('#action').tap();assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.jumps),0);
  await page.close();console.log(`PASS ${width}x${height}: intro/demo, touch cancel, pause, death/retry`);
 }
 for(const index of [0,1]){
  const page=await open(360,640,index),level=moonLevels[index];await page.locator('#action').tap();await queue(page,level.route,index===0);
  if(index===0){await page.clock.runFor(3450);await page.screenshot({path:'docs/moon-lab-screenshots/bridge-fast.png'});await page.clock.runFor(300);await page.screenshot({path:'docs/moon-lab-screenshots/bridge-slow.png'});await page.clock.runFor(14000);}else{await page.clock.runFor(7100);await page.screenshot({path:'docs/moon-lab-screenshots/fork.png'});await page.clock.runFor(13500);}
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.status),'clear');assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.fullMoon),true);await page.screenshot({path:`docs/moon-lab-screenshots/clear-${level.id}.png`});await page.close();
 }
 // Bonus branch through normal UI, then deliberately fall after the checkpoint.
 {
  const page=await open(360,640,1),level=moonLevels[1],route=level.route.slice(0,9)+'FS'+level.route.slice(11);
  await page.locator('#action').tap();await queue(page,route.slice(0,12));await page.clock.runFor(9400);
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.bonus),true);assert.ok(await page.evaluate(()=>window.__MOON_LAB__.state.checkpoint));
  await page.keyboard.up('Space');await page.clock.runFor(4000);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.status),'dead');await page.locator('#action').tap();
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.jumps),12);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.phase),0);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.bonus),true);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),false);
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.mode),'checkpoint-ready');await page.clock.runFor(1000);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.phase),0);await page.locator('#resume').tap();
  await queue(page,route.slice(12));await page.clock.runFor(11200);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.status),'clear');assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.fullMoon),false);await page.screenshot({path:'docs/moon-lab-screenshots/checkpoint-clear.png'});await page.locator('#restart').tap();assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.bonus),false);await page.close();
 }

 for(const [width,height]of [[360,640],[720,1280],[320,700]]){
  const page=await open(width,height),level=moonLevels[0];await page.locator('#action').tap();await queue(page,level.route.slice(0,9));await page.clock.runFor(7050);await page.keyboard.up('Space');await page.clock.runFor(2500);
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.status),'dead');await page.locator('#action').tap();
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.mode),'checkpoint-ready');assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.jumps),9);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),false);
  await page.clock.runFor(1500);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.phase),0);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.prediction.safe),true);
  const box=await page.locator('#hold').boundingBox();assert.ok(box.y+box.height<=height);await page.screenshot({path:`docs/moon-lab-screenshots/recovery-${width}.png`});
  await page.locator('#resume').tap();await queue(page,'SFM');await page.clock.runFor(2500);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.status),'playing');assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.jumps),12);await page.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS browser: full routes, bridge states, fork, bonus checkpoint recovery, FULL MOON');
}finally{await browser.close();}
