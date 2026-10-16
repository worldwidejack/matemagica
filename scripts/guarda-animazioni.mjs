// Guarda le animazioni come le vede un telefono, in un Chrome headless (lì requestAnimationFrame
// gira davvero: nelle schede in background e nel pannello browser nascosto è fermo).
// Per ogni animazione della pagina di prova: tempo vero fra un disegno e l'altro, e una foto
// di ogni disegno (col rallentatore). In più quanti fotogrammi al secondo regge il tremolio.
//
//   npm run build && npx vite preview --port 5199 --strictPort &
//   node scripts/guarda-animazioni.mjs http://localhost:5199/prova.html /tmp/guarda
//
// Scrive <out>/<nome>/NN.png e stampa un riassunto. Chrome: CHROME=… se non è in /Applications.
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [URL_PAGINA, OUT] = process.argv.slice(2);
if (!URL_PAGINA || !OUT) throw new Error('uso: node scripts/guarda-animazioni.mjs <url di prova.html> <cartella>');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORTA = 9333;
const PROFILO = join(OUT, '.profilo-chrome');
rmSync(PROFILO, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORTA}`, `--user-data-dir=${PROFILO}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const dormi = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 50 && !target; i++) {
  await dormi(200);
  try { target = await (await fetch(`http://127.0.0.1:${PORTA}/json/new?about:blank`, { method: 'PUT' })).json(); } catch {}
}
if (!target) throw new Error('Chrome non risponde');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const attese = new Map();
const errori = [];
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.id && attese.has(d.id)) { attese.get(d.id)(d.result ?? d); attese.delete(d.id); }
  else if (d.method === 'Runtime.exceptionThrown') errori.push(d.params.exceptionDetails.text);
});
const cdp = (method, params = {}) => new Promise((r) => { const k = ++id; attese.set(k, r); ws.send(JSON.stringify({ id: k, method, params })); });
const valuta = async (expr) => (await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;

await cdp('Page.enable');
await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
await cdp('Page.navigate', { url: URL_PAGINA });
for (let i = 0; i < 40 && !(await valuta(`/pronte/.test(document.body.innerText)`)); i++) await dormi(250);

// Le animazioni del catalogo: un bottone per foglio, col nome in grassetto.
const nomi = await valuta(`[...document.querySelectorAll('section button span.font-bold')].map((s) => s.textContent)`);
const riassunto = {};

for (const nome of nomi) {
  // 1) tempi veri alla velocità normale
  const tempi = await valuta(`(async () => {
    const b = [...document.querySelectorAll('section button')].find((x) => x.querySelector('span.font-bold')?.textContent === ${JSON.stringify(nome)});
    b.scrollIntoView({ block: 'center' });
    const el = b.querySelector('[aria-hidden]');
    b.click();
    const t0 = performance.now(); const c = [];
    await new Promise((f) => { const g = () => { const t = performance.now() - t0; c.push([t, el.style.backgroundPosition]);
      if (t < 2500) requestAnimationFrame(g); else f(); }; requestAnimationFrame(g); });
    const cambi = c.filter((x, i) => i === 0 || x[1] !== c[i - 1][1]).map((x) => x[0]);
    const passi = cambi.slice(1).map((t, i) => t - cambi[i]);
    return { disegni: cambi.length, msMedi: passi.length ? Math.round(passi.reduce((s, x) => s + x, 0) / passi.length) : null };
  })()`);

  // 2) una foto per disegno, col rallentatore (3 al secondo)
  await valuta(`(() => { const c = document.querySelector('input[type=checkbox]'); if (!c.checked) c.click(); })()`);
  await dormi(200);
  const box = await valuta(`(() => {
    const b = [...document.querySelectorAll('section button')].find((x) => x.querySelector('span.font-bold')?.textContent === ${JSON.stringify(nome)});
    b.scrollIntoView({ block: 'center' }); b.click();
    const r = b.getBoundingClientRect();
    const disegni = Number(b.textContent.match(/(\\d+) disegni/)?.[1] ?? 8);
    // le coordinate del ritaglio sono della pagina, non dello schermo
    return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, disegni };
  })()`);
  const cartella = join(OUT, nome);
  mkdirSync(cartella, { recursive: true });
  const t0 = Date.now();
  let ultima = '';
  let n = 0;
  const { disegni, ...clip } = box;
  while (Date.now() - t0 < (disegni + 1) * 340) {
    const s = await cdp('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } });
    if (s.data !== ultima) { writeFileSync(join(cartella, `${String(n++).padStart(2, '0')}.png`), Buffer.from(s.data, 'base64')); ultima = s.data; }
  }
  await valuta(`document.querySelector('input[type=checkbox]').click()`);
  riassunto[nome] = { ...tempi, foto: n };
}

// 3) il tremolio: fotogrammi al secondo dello schermo, spento e forte
riassunto.tremolio = await valuta(`(async () => {
  const misura = async () => { let n = 0; const t0 = performance.now();
    await new Promise((f) => { const g = () => { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(g); else f(); }; requestAnimationFrame(g); });
    return Math.round(n / ((performance.now() - t0) / 1000)); };
  const s = [...document.querySelectorAll('section')].at(-1); s.scrollIntoView();
  const b = [...s.querySelectorAll('button')];
  b[0].click(); await new Promise((r) => setTimeout(r, 300)); const spento = await misura();
  b[2].click(); await new Promise((r) => setTimeout(r, 300)); const forte = await misura();
  return { fpsSpento: spento, fpsForte: forte };
})()`);
riassunto.errori = errori;

console.log(JSON.stringify(riassunto, null, 1));
ws.close();
const uscito = new Promise((r) => chrome.once('exit', r));
chrome.kill();
await uscito;
rmSync(PROFILO, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
