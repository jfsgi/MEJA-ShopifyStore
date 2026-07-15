import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { pathToFileURL } from 'url';
const url = pathToFileURL(process.cwd() + '/mockups/index.html').href;
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1280,height:1000}, deviceScaleFactor:2 });
await p.goto(url,{waitUntil:'networkidle'});
await p.addStyleTag({content:'.gallery-head{display:none!important}'});
const picks = {v2:'gallery-white', v5:'scandi-light'};
for (const [id,name] of Object.entries(picks)){
  const el = await p.$('#'+id+' .store');
  await el.scrollIntoViewIfNeeded();
  await el.screenshot({path:`/tmp/${name}.png`});
}
await b.close(); console.log('captured v2, v5 (clean)');
