// A/B capture: Canvas Michiru (A, forced) vs sprite Michiru (B) in the built game, same synthetic states.
// Writes per-scene screenshots and one side-by-side board to docs/screenshots/michiru/ab/.
import {chromium} from 'playwright-core';
import {mkdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const out='docs/screenshots/michiru/ab';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const errors=[],shots=[];
const scenes=['slow','fast','landing','clear'];
try{
 for(const [w,h] of [[360,640],[320,700]])for(const mode of ['A','B']){
  const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
  page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();
  await page.goto(pathToFileURL(resolve('itch-dist/index.html')).href);
  await page.clock.runFor(48);
  const sprites=await page.evaluate(()=>window.__HOPSCROLL_DEBUG__.sprites);
  if(sprites!=='ready')throw Error('sprite atlas not ready: '+sprites);
  await page.evaluate(m=>{window.__HOPSCROLL_DEBUG__.forceCanvas=m==='A';},mode);
  await page.locator('#modal-action').click();
  const shot=async name=>{const path=`${out}/${mode}-${name}-${w}x${h}.png`;await page.screenshot({path});shots.push({mode,name,w,h,path});};
  // SLOW near the top of a hop, FAST at the same height, then a touchdown crouch and the clear hop.
  await page.evaluate(()=>{const s=window.__HOPSCROLL_DEBUG__.state;s.phase=.3;});await page.clock.runFor(32);await shot('slow');
  await page.keyboard.down('Space');await page.clock.runFor(400);
  await page.evaluate(()=>{const s=window.__HOPSCROLL_DEBUG__.state;s.phase=.3;});await page.clock.runFor(32);await shot('fast');
  await page.keyboard.up('Space');await page.clock.runFor(400);
  await page.evaluate(()=>{const s=window.__HOPSCROLL_DEBUG__.state;s.phase=.765;});await page.clock.runFor(16);await shot('landing');
  await page.evaluate(()=>{const s=window.__HOPSCROLL_DEBUG__.state;s.x=540;s.phase=.77;});
  await page.clock.runFor(80);await shot('clear');
  await page.close();
 }
 // Board: rows = scene, columns = A/B at 360x640 then A/B at 320x700, plus a 3x crop around the hero.
 const page=await browser.newPage({viewport:{width:1600,height:1200}});
 await page.setContent('<canvas id="b"></canvas>');
 await page.evaluate(async shots=>{
  const zw=200,zh=330,colW=360+zw+30,rowH=zh+16;
  const c=document.getElementById('b');c.width=colW*4+20;c.height=rowH*4+60;
  const g=c.getContext('2d');g.fillStyle='#0a1124';g.fillRect(0,0,c.width,c.height);
  g.fillStyle='#e5e0f2';g.font='bold 22px sans-serif';
  ['A Canvas 360x640','B Sprite 360x640','A Canvas 320x700','B Sprite 320x700'].forEach((t,i)=>g.fillText(t,14+i*colW,34));
  const scenes=['slow','fast','landing','clear'];
  for(const s of shots){
   const col=(s.w===360?0:2)+(s.mode==='B'?1:0),row=scenes.indexOf(s.name);
   const img=new Image();img.src=s.data;await img.decode();
   const x=10+col*colW,y=50+row*rowH,k=img.width/s.w;
   // Left: the play band around the hero (CSS px 160..490 of the viewport). Right: the hero at 3x.
   const fy=s.h===700?178:160;
   g.drawImage(img,0,fy*k,s.w*k,zh*k,x,y,s.w,zh);
   // Hero column: x 2..102, the full hop height (y 210..375 logical, scaled for the letterboxed 320x700 frame).
   const sc=s.w/360,oy=(s.h-640*sc)/2;
   g.drawImage(img,2*sc*k,(oy+210*sc)*k,100*sc*k,165*sc*k,x+s.w+10,y,zw,zh);
   g.fillText(s.name.toUpperCase(),x+6,y+24);
  }
 },shots.map(s=>({...s,data:'data:image/png;base64,'+readFileSync(s.path).toString('base64')})));
 await page.locator('#b').screenshot({path:`${out}/board.png`});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS Michiru A/B captures',shots.length,'shots; no page errors');
}finally{await browser.close();}
