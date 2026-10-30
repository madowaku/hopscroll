import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
const page=await browser.newPage({viewport:{width:360,height:640}});await page.clock.install();await page.goto('http://127.0.0.1:8000/star-run.html');await page.locator('#retry').click();
await page.evaluate(()=>{for(const [time,down] of [[2340,true],[6240,false],[9360,true],[13260,false],[15600,true]])setTimeout(()=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code:'Space',bubbles:true})),time);});
await page.clock.runFor(19000);assert.equal(await page.evaluate(()=>window.__STAR_RUN__.state.status),'clear');assert.equal(await page.locator('#message').innerText(),'COURSE COMPLETE');assert.equal(await page.locator('#gates').innerText(),'14');await page.screenshot({path:'docs/star-run-screenshots/complete.png'});
const best=await page.locator('#best').innerText();await page.reload();assert.equal(await page.locator('#best').innerText(),best);await page.locator('#retry').click();assert.equal(await page.evaluate(()=>window.__STAR_RUN__.fast),false);console.log('PASS real browser virtual-clock input replay: COURSE COMPLETE, 14 gates, persistent best, fresh input');
}finally{await browser.close();}
