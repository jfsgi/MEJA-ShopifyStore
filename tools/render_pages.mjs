import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { pathToFileURL } from 'url';
const names = process.argv.slice(2);
const b = await chromium.launch();
for (const name of names){
  const p = await b.newPage({ viewport:{width:1280,height:1000}, deviceScaleFactor:2 });
  await p.goto(pathToFileURL(process.cwd()+`/mockups/${name}.html`).href,{waitUntil:'networkidle'});
  await p.screenshot({path:`/tmp/page-${name}.png`, fullPage:true});
  await p.close();
}
await b.close(); console.log('rendered', names.join(', '));
