import {chromium} from 'playwright-core';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const out='docs/screenshots/michiru';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:360,height:640},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.clock.install();
 await page.goto(pathToFileURL(resolve('itch-dist/index.html')).href);
 await page.clock.runFor(32);
 await page.screenshot({path:out+'/title.png'});
 await page.locator('#modal-action').click();
 await page.clock.runFor(300);
 await page.screenshot({path:out+'/slow.png'});
 await page.keyboard.down('Space');await page.clock.runFor(300);
 await page.screenshot({path:out+'/fast.png'});
 await page.keyboard.up('Space');
 await page.evaluate(()=>{const s=window.__HOPSCROLL_DEBUG__.state;s.phase=.77;});
 await page.clock.runFor(32);await page.screenshot({path:out+'/landing.png'});
 await page.evaluate(()=>{const s=window.__HOPSCROLL_DEBUG__.state;s.x=540;s.phase=.77;});
 await page.clock.runFor(80);await page.screenshot({path:out+'/clear.png'});
 await page.clock.runFor(1200);await page.screenshot({path:out+'/clear-card.png'});
 await page.evaluate(()=>{const d=window.__HOPSCROLL_DEBUG__;d.reset(1,true);d.state.x=300;d.state.phase=.77;});
 await page.clock.runFor(80);await page.screenshot({path:out+'/fail.png'});
 await page.clock.runFor(700);await page.screenshot({path:out+'/fail-card.png'});
 // Extract the actual drawing function for a deterministic 48px visual inspection,
 // without adding test controls to the shipping game.
 const src=readFileSync('src/game.mjs','utf8');
 const shape=src.slice(src.indexOf('function michiruShape'),src.indexOf('function drawTrail'));
 await page.evaluate(shape=>{
  document.body.innerHTML='<canvas id="sample" width="360" height="160"></canvas>';
  document.body.style='margin:0;background:#0d1630;display:block';
  const c=document.querySelector('canvas'),g=c.getContext('2d');
  const draw=new Function(shape+';return michiruShape')();
  g.fillStyle='#0d1630';g.fillRect(0,0,360,160);
  for(const [i,flow,mood] of [[0,0,'play'],[1,1,'play'],[2,0,'happy'],[3,0,'dizzy']]){
   g.save();g.translate(48+i*86,68);g.scale(.4,.4);draw(g,{flow,earA:flow?-1.27:-.25,mood});g.restore();
  }
 },shape);
 await page.locator('#sample').screenshot({path:out+'/readability-48px.png'});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS Michiru captures; synthetic states, actual built renderer; no page errors');
}finally{await browser.close();}
