// Before/after captures for the Journey look: SLOW, FAST, just after RELEASE, and failure,
// at 360x640 and 320x700. Pages are served from disk through page.route (no server needed).
// Usage: node tests/moon-journey-captures.mjs <before-dir> <after-dir>
import {chromium} from 'playwright-core';
import {existsSync,mkdirSync,readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
const [beforeDir,afterDir='.']=process.argv.slice(2);
const out='docs/moon-journey-screenshots/compare';mkdirSync(out,{recursive:true});
const executablePath=[process.env.CHROME_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>p&&existsSync(p));
const browser=await chromium.launch({executablePath,headless:true});
const types={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.png':'image/png','.mp3':'audio/mpeg'};
const errors=[],shots=[],scenes=['slow','fast','release','fail'],sizes=[[360,640],[320,700]];
async function capture(label,dir,[w,h]){
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(`${label}: ${e.message}`));
 await page.route('http://hop.test/**',r=>{const path=new URL(r.request().url()).pathname.slice(1);let file=resolve(dir,path);
  // A built dist names the page index.html.
  if(path==='moon-journey.html'&&!existsSync(file))file=resolve(dir,'index.html');
  if(!existsSync(file))return r.fulfill({status:404});r.fulfill({body:readFileSync(file),contentType:types[extname(file)]||'application/octet-stream'});});
 await page.addInitScript(()=>{try{localStorage.setItem('hopscroll-journey-pressed','1');localStorage.setItem('hopscroll-journey-practice','1');}catch{}});
 await page.clock.install();await page.goto('http://hop.test/moon-journey.html');
 await page.waitForFunction(()=>window.__MOON_LAB__?.sprites==='ready');
 if(await page.locator('#title-select').isVisible().catch(()=>false))await page.locator('#title-select').tap();
 // Stage 003: the first moon bridge sits in view, so lanes and bridge states show together.
 await page.locator('[data-stage="2"]').tap();await page.locator('#action').tap();
 const shot=async name=>{const path=`${out}/${label}-${name}-${w}x${h}.png`;await page.screenshot({path});shots.push({label,name,w,h,path});};
 await page.clock.runFor(1250);await shot('slow');
 await page.keyboard.down('Space');await page.clock.runFor(520);await shot('fast');
 await page.keyboard.up('Space');await page.clock.runFor(140);await shot('release');
 await page.keyboard.down('Space');await page.clock.runFor(9000);await page.keyboard.up('Space');await page.clock.runFor(200);
 if(await page.evaluate(()=>window.__MOON_LAB__.state.status)!=='dead')throw Error(`${label} ${w}x${h}: run did not fail`);
 await shot('fail');await page.close();
}
try{
 for(const size of sizes){if(beforeDir)await capture('before',beforeDir,size);await capture('after',afterDir,size);}
 // Board: rows = scene; columns = before/after at 360x640, then before/after at 320x700.
 const cols=sizes.flatMap(([w,h])=>(beforeDir?['before','after']:['after']).map(label=>({label,w,h})));
 const page=await browser.newPage({viewport:{width:1600,height:1200}});
 await page.setContent('<canvas id="b"></canvas>');
 await page.evaluate(async({shots,cols,scenes})=>{
  const cw=300,ch=560,g=document.getElementById('b').getContext('2d'),c=g.canvas;c.width=cols.length*(cw+12)+12;c.height=scenes.length*(ch+12)+50;
  g.fillStyle='#070b1c';g.fillRect(0,0,c.width,c.height);g.fillStyle='#e5e0f2';g.font='bold 18px sans-serif';
  cols.forEach((col,i)=>g.fillText(`${col.label} ${col.w}x${col.h}`,12+i*(cw+12),30));
  for(const s of shots){const i=cols.findIndex(c=>c.label===s.label&&c.w===s.w),row=scenes.indexOf(s.name);
   const img=new Image();img.src=s.data;await img.decode();const k=Math.min(cw/img.width,ch/img.height);
   const x=12+i*(cw+12),y=44+row*(ch+12);g.drawImage(img,x,y,img.width*k,img.height*k);
   g.fillStyle='#ffd879';g.font='bold 15px sans-serif';g.fillText(s.name.toUpperCase(),x+6,y+ch-8);}
 },{shots:shots.map(s=>({...s,data:'data:image/png;base64,'+readFileSync(s.path).toString('base64')})),cols,scenes});
 await page.locator('#b').screenshot({path:`${out}/board.png`});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('PASS Journey captures',shots.length,'shots; board',`${out}/board.png`);
}finally{await browser.close();}
