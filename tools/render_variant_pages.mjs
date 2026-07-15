// One full, uncut PNG per variant → combined into a one-variant-per-page PDF.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { pathToFileURL } from 'url';
const url = pathToFileURL(process.cwd() + '/mockups/index.html').href;
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1280,height:1000}, deviceScaleFactor:2 });
await p.goto(url,{waitUntil:'networkidle'});
for (let i=1;i<=10;i++){
  const el = await p.$('#v'+i);
  await el.screenshot({path:`/tmp/vpages/v${String(i).padStart(2,'0')}.png`});
}
await b.close(); console.log('captured 10 variant pages');
