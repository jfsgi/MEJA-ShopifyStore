// Renders every top-level mockups/*.html to a shareable PDF + PNG in assets/.
// Usage: node tools/render_mockups.mjs
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { pathToFileURL } from 'url';
import { readdirSync } from 'fs';

const files = readdirSync('mockups').filter(f => f.endsWith('.html')).sort();
const browser = await chromium.launch();
for (const f of files) {
  const name = f.replace(/\.html$/, '');
  const url = pathToFileURL(process.cwd() + '/mockups/' + f).href;
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle' });
  const out = name === 'index' ? 'MEJA-UI-Iterations' : 'mockup-' + name;
  await page.pdf({ path: `assets/${out}.pdf`, width: '1280px', printBackground: true });
  await page.screenshot({ path: `assets/${out}.png`, fullPage: true });
  await page.close();
  console.log('rendered', f, '→ assets/' + out + '.{pdf,png}');
}
await browser.close();
