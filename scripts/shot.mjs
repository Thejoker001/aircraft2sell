#!/usr/bin/env node
/**
 * Capture d'écran via CDP, sans dépendance npm (WebSocket natif de Node >= 22).
 * Playwright n'est pas installé dans cet environnement : ce script pilote
 * directement chrome-headless-shell.
 *
 * Usage :
 *   node scripts/shot.mjs <url> <sortie.png> [--w=1440] [--h=1000] [--full]
 *                         [--eval='JS exécuté avant le rendu, puis reload']
 *                         [--after='JS exécuté après le rendu, sans reload']
 *                         [--wait=800]
 *
 * Exemple (page protégée par login) :
 *   node scripts/shot.mjs http://127.0.0.1:8799/moderation.html /tmp/mod.png \
 *     --eval="sessionStorage.setItem('a2s_admin_session', TOKEN)"
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { writeFile } from 'node:fs/promises';

const CANDIDATES = [
  `${homedir()}/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`,
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
];
const BIN = CANDIDATES.find(existsSync);
if (!BIN) { console.error('Aucun binaire Chromium trouvé.'); process.exit(1); }

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const hit = args.find(a => a.startsWith(`--${name}=`));
  return hit === undefined ? dflt : hit.slice(name.length + 3);
};
const flag = name => args.includes(`--${name}`);
const positional = args.filter(a => !a.startsWith('--'));
const url = positional[0];
const out = positional[1] || '/tmp/shot.png';
if (!url) { console.error('URL manquante.'); process.exit(1); }

const width = Number(opt('w', 1440));
const height = Number(opt('h', 1000));
const waitMs = Number(opt('wait', 800));
const evalBefore = opt('eval', '');
const evalAfter = opt('after', '');
const fullPage = flag('full');

const PORT = 9000 + Math.floor(Math.random() * 900);
const chrome = spawn(BIN, [
  '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--disable-dev-shm-usage', `--remote-debugging-port=${PORT}`,
  `--window-size=${width},${height}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const fail = async (msg, code = 1) => { console.error(msg); chrome.kill(); process.exit(code); };

// Attendre que le endpoint CDP réponde
let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(250);
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    wsUrl = (await r.json()).webSocketDebuggerUrl;
  } catch { /* pas encore prêt */ }
}
if (!wsUrl) await fail('CDP injoignable.');

const ws = new WebSocket(wsUrl);
let msgId = 0;
const pending = new Map();
const events = [];

ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  } else if (m.method) events.push(m.method);
});
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++msgId;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});

await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', rej, { once: true });
});

// Attacher une cible page
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);

await S('Page.enable');
await S('Runtime.enable');
await S('Emulation.setDeviceMetricsOverride', {
  width, height, deviceScaleFactor: 1, mobile: false,
});

const goto = async target => {
  await S('Page.navigate', { url: target });
  for (let i = 0; i < 80; i++) {
    await sleep(125);
    if (events.includes('Page.loadEventFired')) break;
  }
  events.length = 0;
};

await goto(url);

if (evalBefore) {
  const r = await S('Runtime.evaluate', { expression: evalBefore, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) await fail('Erreur --eval : ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
  await goto(url); // recharge pour que la page lise l'état injecté
}

await sleep(waitMs);

if (evalAfter) {
  const r = await S('Runtime.evaluate', { expression: evalAfter, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) await fail('Erreur --after : ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
  await sleep(400);
}

// Remonter les erreurs JS de la page
const errs = await S('Runtime.evaluate', {
  expression: '(window.__a2sErrors||[]).join(" | ")', returnByValue: true,
});

const params = { format: 'png' };
if (fullPage) {
  const { cssContentSize } = await S('Page.getLayoutMetrics');
  params.captureBeyondViewport = true;
  params.clip = { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 };
}
const { data } = await S('Page.captureScreenshot', params);
await writeFile(out, Buffer.from(data, 'base64'));

console.log(out);
if (errs.result?.value) console.log('JS errors: ' + errs.result.value);
ws.close();
chrome.kill();
process.exit(0);
