import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const errors=[];mkdirSync('docs/star-run-screenshots',{recursive:true});
try {
for(const [width,height] of [[360,640],[720,1280],[320,700]]) {
 const page=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000/star-run.html');await page.waitForFunction(()=>!!window.__STAR_RUN__);
 await page.locator('#retry').tap();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const box=await page.locator('#hold').boundingBox();assert.ok(box.y+box.height<=height);
 await page.screenshot({path:`docs/star-run-screenshots/${width}x${height}.png`});
 const hold=page.locator('#hold');await hold.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',bubbles:true});
 // Synthetic pointer cannot own native capture; CDP supplies actual touch below.
 await page.evaluate(()=>window.dispatchEvent(new Event('pointercancel')));
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+30,y:box.y+20}]});
 assert.equal(await page.evaluate(()=>window.__STAR_RUN__.fast),true);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await page.evaluate(()=>window.__STAR_RUN__.fast),false);
 await page.keyboard.down('Space');assert.equal(await page.evaluate(()=>window.__STAR_RUN__.fast),true);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await page.evaluate(()=>window.__STAR_RUN__.fast),false);
 assert.equal(await page.evaluate(()=>window.__STAR_RUN__.paused),true);await page.keyboard.up('Space');await page.locator('#retry').tap();
 await page.waitForFunction(()=>window.__STAR_RUN__.state.status==='dead',{},{timeout:7000});
 await page.screenshot({path:`docs/star-run-screenshots/result-${width}.png`});await page.locator('#retry').tap();
 assert.equal(await page.evaluate(()=>window.__STAR_RUN__.state.gates),0);assert.equal(await page.evaluate(()=>window.__STAR_RUN__.fast),false);
 await page.close();console.log(`PASS ${width}x${height}: HTTP, touch/cancel, space, blur/resume, death/retry`);
}
assert.deepEqual(errors,[]);
}finally{await browser.close();}
