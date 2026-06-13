// Renders mockups/index.html to a shareable PDF and PNG in assets/.
// Usage: node tools/render_mockups.mjs
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
import { pathToFileURL } from 'url';
const url = pathToFileURL(process.cwd() + '/mockups/index.html').href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
await page.pdf({ path: 'assets/MEJA-UI-Iterations.pdf', width: '1280px', printBackground: true });
await page.screenshot({ path: 'assets/MEJA-UI-Iterations.png', fullPage: true });
await browser.close();
console.log('rendered PDF + PNG');
