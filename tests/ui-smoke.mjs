import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

// Run the actual built itch single-HTML page in Chrome, not an extracted helper.
const browserPaths = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
const executablePath = browserPaths.find(p => p && existsSync(p)) || chromium.executablePath();
const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
const url = pathToFileURL(resolve('itch-dist/index.html')).href;
const pageErrors = [];
mkdirSync('qa-screenshots', {recursive: true});

async function openGame(viewport) {
  const page = await browser.newPage({viewport, deviceScaleFactor: 1});
  page.on('pageerror', err => pageErrors.push(err.message));
  await page.goto(url);
  await page.waitForFunction(() => !!window.__HOPSCROLL_DEBUG__, {timeout: 3000});
  await page.locator('#modal-action').click();
  await page.waitForFunction(() => window.__HOPSCROLL_DEBUG__.playing);
  return page;
}

try {
  for (const viewport of [{width:360,height:640}, {width:720,height:1280}, {width:320,height:700}]) {
    const page = await openGame(viewport);
    const button = await page.locator('#accelerate').boundingBox();
    assert.ok(button, 'missing FAST button');
    assert.ok(button.x >= -1 && button.y >= -1 && button.x + button.width <= viewport.width + 1 && button.y + button.height <= viewport.height + 1, 'FAST button offscreen ' + JSON.stringify(viewport));
    await page.screenshot({path: 'qa-screenshots/' + viewport.width + 'x' + viewport.height + '.png'});
    await page.keyboard.down('Space');
    assert.equal(await page.evaluate(() => window.__HOPSCROLL_DEBUG__.pressed), true, 'Space did not activate FAST');
    await page.keyboard.up('Space');
    assert.equal(await page.evaluate(() => window.__HOPSCROLL_DEBUG__.pressed), false, 'release left FAST stuck');
    await page.close();
    console.log('PASS viewport and input', viewport.width + 'x' + viewport.height);
  }

  // Synthetic in-game state positions make the difficult-to-reproduce UI failures
  // deterministic; the actual requestAnimationFrame, core collision and DOM run.
  const scenarios = [
    {id:'gap', x:300, reason:'overshoot', message:'You landed in the gap!'},
    {id:'edge', x:254, reason:'edge', message:'So close to the edge!'},
    {id:'past-goal', x:940, reason:'overshoot', message:'You passed the GOAL!'}
  ];
  for (const scenario of scenarios) {
    const page = await openGame({width:360,height:640});
    await page.evaluate(x => {
      const s = window.__HOPSCROLL_DEBUG__.state;
      s.x = x;
      s.phase = 0.76;
      s.failure = null;
      s.status = 'playing';
    }, scenario.x);
    await page.locator('#overlay').waitFor({state:'visible', timeout:3500});
    const message = await page.locator('#modal-message').innerText();
    const actualReason = await page.evaluate(() => window.__HOPSCROLL_DEBUG__.state.failure?.reason);
    assert.equal(actualReason, scenario.reason, 'wrong core failure reason ' + scenario.id);
    assert.ok(message.includes(scenario.message), 'wrong modal for ' + scenario.id + ': ' + message);
    await page.screenshot({path:'qa-screenshots/' + scenario.id + '.png'});
    await page.locator('#modal-action').click();
    await page.waitForFunction(() => window.__HOPSCROLL_DEBUG__.state.failure === null);
    assert.equal(await page.evaluate(() => window.__HOPSCROLL_DEBUG__.pressed), false, 'FAST stuck on retry');
    await page.close();
    console.log('PASS browser failure/retry', scenario.id);
  }
  assert.deepEqual(pageErrors, [], 'browser console errors: ' + pageErrors.join(' | '));
  console.log('PASS built itch HTML smoke suite: 3 viewports + input + 3 failure/retry cases');
} finally {
  await browser.close();
}
