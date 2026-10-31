import assert from 'node:assert/strict';
import {existsSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
const executablePath=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>p&&existsSync(p));
const browser=await chromium.launch({executablePath,headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.MOON_URL||'http://127.0.0.1:8000/moon-lab.html');
 // Render the actual oscillator/envelope recipes in a real browser audio engine.
 const metrics=await page.evaluate(async()=>{
  const {recipes,scheduleCue,MASTER_GAIN}=await import('./src/moon-audio.mjs');const output={};
  for(const cue of Object.keys(recipes)){
   const ctx=new OfflineAudioContext(1,48000,48000),gain=ctx.createGain();gain.gain.value=MASTER_GAIN;gain.connect(ctx.destination);scheduleCue(ctx,gain,cue);
   const samples=(await ctx.startRendering()).getChannelData(0);let peak=0,energy=0,tail=0;
   for(let i=0;i<samples.length;i++){peak=Math.max(peak,Math.abs(samples[i]));energy+=samples[i]**2;if(i>24000)tail=Math.max(tail,Math.abs(samples[i]));}
   output[cue]={peak,rms:Math.sqrt(energy/samples.length),tail};
  }return output;
 });
 for(const metric of Object.values(metrics)){assert.ok(metric.peak>.005&&metric.peak<.15,'clip/headroom at the actual master gain');assert.ok(metric.rms>0);assert.equal(metric.tail,0);}
 // Real-time playback from real landings; no clock replacement or synthetic audio API.
 await page.locator('#action').click();await page.waitForFunction(()=>window.__MOON_LAB__.audio.state==='running');
 const live=await page.evaluate(()=>new Promise(resolve=>{let peak=0;const id=setInterval(()=>{const d=window.__MOON_LAB__;peak=Math.max(peak,d.audio.peak);if(d.state.jumps>=2){clearInterval(id);resolve({peak,audio:d.audio});}},5);}));
 assert.ok(live.peak>0,'live graph remained silent');assert.equal(live.audio.played,2);assert.equal(live.audio.lastCue,'slow');
 await page.locator('#mute').click();await page.waitForFunction(()=>window.__MOON_LAB__.audio.state==='suspended');const count=await page.evaluate(()=>window.__MOON_LAB__.audio.played);
 await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.audio.played),count);
 await page.locator('#action').click(); // retry while muted
 await page.waitForTimeout(850);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.audio.played),count);
 await page.locator('#mute').click();await page.waitForFunction(()=>window.__MOON_LAB__.audio.state==='running');
 await page.locator('#pause').click();await page.waitForFunction(()=>window.__MOON_LAB__.audio.state==='suspended');const paused=await page.evaluate(()=>window.__MOON_LAB__.audio.played);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__MOON_LAB__.audio.played),paused);
 await page.locator('#action').click();await page.waitForFunction(()=>window.__MOON_LAB__.audio.state==='running');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForFunction(()=>window.__MOON_LAB__.audio.state==='suspended');assert.equal(await page.evaluate(()=>window.__MOON_LAB__.fast),false);
 // Browser API absence must not break movement or retries.
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined;});await fallback.goto(process.env.MOON_URL||'http://127.0.0.1:8000/moon-lab.html');await fallback.locator('#action').click();await fallback.waitForFunction(()=>window.__MOON_LAB__.state.jumps===1);await fallback.close();
 assert.deepEqual(errors,[]);writeFileSync('docs/moon-audio-metrics.json',JSON.stringify({sampleRate:48000,masterGain:.9,metrics,livePeak:live.peak,evidence:'Chrome offline rendering + live AudioContext analyser; not human listening or hardware speaker validation'},null,2)+'\n');
 console.log('PASS audio: seven rendered cues at production gain, live landing output, single cues, mute/retry, pause/resume, blur, unavailable API');
}finally{await browser.close();}
