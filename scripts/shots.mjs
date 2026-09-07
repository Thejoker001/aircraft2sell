// Capture d'écran locale des pages (desktop + mobile) pour contrôle visuel.
// Usage : node scripts/shots.mjs [page.html ...]   -> /tmp/a2s-shots/<page>-<desktop|mobile>.png
import { chromium } from 'playwright';
import fs from 'node:fs';
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html','login.html'];
const base = 'http://127.0.0.1:8765/';
fs.mkdirSync('/tmp/a2s-shots', { recursive: true });
const browser = await chromium.launch();
const errors = {};
for (const p of pages) {
  for (const [name, vp] of [['desktop',{width:1366,height:900}],['mobile',{width:390,height:844}]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.route(/^(?!http:\/\/127\.0\.0\.1)/, r => r.abort());
    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await page.goto(base + p, { waitUntil: 'load', timeout: 20000 }).catch(e => errs.push('goto: ' + e.message));
    await page.waitForTimeout(600);
    const out = `/tmp/a2s-shots/${p.replace(/[\/.]/g,'_')}-${name}.png`;
    await page.screenshot({ path: out, fullPage: true });
    errors[`${p} [${name}]`] = errs.filter(e => !/supabase|er-api|exchangerate|jsdelivr|fonts\.g|ERR_INTERNET|net::|favicon|404 \(File not found\)/.test(e));
    await ctx.close();
    console.log(out);
  }
}
await browser.close();
for (const [k, v] of Object.entries(errors)) if (v.length) console.log('ERRORS', k, v);
