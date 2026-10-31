import assert from 'node:assert/strict';
import {existsSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {moonLevels} from '../src/moon-levels.mjs';
const levels=moonLevels;
const executablePath=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>p&&existsSync(p));
const browser=await chromium.launch({executablePath,headless:true});
const url=process.env.JOURNEY_URL||'http://127.0.0.1:8013/moon-journey.html';
const errors=[];mkdirSync('docs/moon-journey-screenshots',{recursive:true});
async function open(width=360,height=640,broken=false){
 const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));
 if(broken)await page.route('**/michiru-sprites.png',r=>r.abort());
 await page.clock.install();await page.goto(url);await page.waitForFunction(()=>window.__MOON_LAB__?.sprites!=='loading');return page;
}
async function play(page,route){
 const events=[];let time=0,last=false;
 for(const c of route)for(const [dt,fast] of c==='M'?[[.5,true],[.28,false]]:[[.78,c==='F']]){
  if(fast!==last){events.push({time,fast});last=fast;}time+=dt;
 }
 for(let i=1;i<events.length;i++){const hop=Math.round(events[i].time/.78);if(Math.abs(events[i].time-hop*.78)<1e-8&&route[hop-1]==='M'&&route[hop]==='F'){events[i].time+=.06;events[i-1].time+=.06;}}
 await page.evaluate(events=>{for(const e of events)setTimeout(()=>window.dispatchEvent(new KeyboardEvent(e.fast?'keydown':'keyup',{code:'Space',bubbles:true})),e.time*1000);},events);
 await page.clock.runFor(time*1000+80);
 assert.equal(await page.evaluate(()=>window.__MOON_LAB__.state.status),'clear');
}
try{
 for(const [width,height] of [[320,700],[360,640],[720,1280]]){
  const page=await open(width,height);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.sprites),'ready');
  await page.screenshot({path:`docs/moon-journey-screenshots/entry-${width}.png`});
  await page.locator('#action').tap();await page.clock.runFor(400);
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.pose),'slow');
  await page.screenshot({path:`docs/moon-journey-screenshots/michiru-${width}.png`});
  await page.keyboard.down('Space');await page.clock.runFor(30);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.pose),'fast');
  await page.keyboard.up('Space');await page.close();
 }
 const page=await open();
 for(let i=0;i<levels.length;i++){
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.stage),levels[i].id);
  await page.locator('#action').tap();await play(page,levels[i].route);
  assert.equal(await page.evaluate(()=>window.__MOON_LAB__.pose),'happy');
  await page.screenshot({path:`docs/moon-journey-screenshots/clear-${levels[i].id}.png`});
  if(i<levels.length-1)await page.locator('#action').tap();
 }
 await page.close();
 const fallback=await open(360,640,true);assert.equal(await fallback.evaluate(()=>window.__MOON_LAB__.sprites),'broken');
 await fallback.locator('#action').tap();await fallback.clock.runFor(400);
 await fallback.screenshot({path:'docs/moon-journey-screenshots/fallback.png'});await fallback.close();
 assert.deepEqual(errors,[]);console.log('PASS Journey: Michiru SLOW/FAST/HAPPY, real HTTP image failure fallback, stage next flow, three sizes');
}finally{await browser.close();}
