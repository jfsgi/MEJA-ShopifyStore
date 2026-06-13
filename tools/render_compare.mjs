import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { pathToFileURL } from 'url';
const indigo = ':root{--brand:#4f46e5!important;--accent:#818cf8!important;--accent-deep:#4338ca!important}';
const b = await chromium.launch();
for (const name of ['configurator','home']){
  for (const [variant,css] of [['sage',''],['indigo',indigo]]){
    const p = await b.newPage({ viewport:{width:1280,height:1000}, deviceScaleFactor:2 });
    await p.goto(pathToFileURL(process.cwd()+`/mockups/${name}.html`).href,{waitUntil:'networkidle'});
    if(css) await p.addStyleTag({content:css});
    await p.screenshot({path:`/tmp/cmp-${name}-${variant}.png`, fullPage:true});
    await p.close();
  }
}
await b.close(); console.log('rendered sage + indigo for configurator, home');
