// Il foglio delle schermate: apre l'app in un Chrome senza finestra a misura telefono,
// fa il giro (prima apertura, partita, risultato, tappa, palestra, i giochi, collezione,
// profilo) e salva un PNG per schermata. Poi `foglio-monta.py` li mette in un foglio solo.
//
//   node scripts/foglio-schermate.mjs [http://localhost:5182] [cartella] [breve]
//
// Serve il server di sviluppo acceso (le prove `?prova=` esistono solo lì).
// «breve» = solo prima apertura, una partita e il viaggio: è il controllo del link pubblicato.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:5182';
const DOVE = process.argv[3] ?? '_lavoro/foglio';
const BREVE = process.argv[4] === 'breve';
const PORTA = 9347;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
mkdirSync(DOVE, { recursive: true });

const chrome = spawn(
  CHROME,
  ['--headless=new', `--remote-debugging-port=${PORTA}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'foglio-'))}`, '--hide-scrollbars', '--mute-audio', 'about:blank'],
  { stdio: 'ignore' },
);
const z = (ms) => new Promise((r) => setTimeout(r, ms));

async function pagina() {
  for (let i = 0; i < 40; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${PORTA}/json/list`)).json();
      const p = l.find((x) => x.type === 'page');
      if (p) return p.webSocketDebuggerUrl;
    } catch {
      /* non ancora su */
    }
    await z(250);
  }
  throw new Error('Chrome non risponde');
}

const ws = new WebSocket(await pagina());
await new Promise((r) => ws.addEventListener('open', r));
let n = 0;
const attese = new Map();
const errori = [];
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.id && attese.has(d.id)) {
    attese.get(d.id)(d);
    attese.delete(d.id);
  }
  if (d.method === 'Runtime.exceptionThrown') errori.push(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text);
  if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errori.push(d.params.args.map((a) => a.value ?? a.description).join(' '));
});
const manda = (method, params = {}) =>
  new Promise((ok) => {
    const id = ++n;
    attese.set(id, ok);
    ws.send(JSON.stringify({ id, method, params }));
  });
const js = async (expression) => {
  const r = await manda('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(`${r.result.exceptionDetails.exception?.description}\n  in: ${expression.slice(0, 120)}`);
  return r.result?.result?.value;
};

await manda('Runtime.enable');
await manda('Page.enable');
await manda('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });

const AIUTI = `
  window.z = (ms) => new Promise((r) => setTimeout(r, ms));
  window.bottoni = () => [...document.querySelectorAll('button')];
  window.premi = (t) => { const b = bottoni().find((b) => !b.disabled && b.textContent.includes(t)); if (!b) return false; b.click(); return true; };
  window.val = (t) => Function('return ' + t.replace(/×/g, '*').replace(/[:÷]/g, '/').replace(/−/g, '-').replace(/²/g, '**2'))();
  window.carte = () => bottoni().filter((b) => !b.disabled && b.querySelector('span') && /\\d/.test(b.textContent) && !/Livello|Aiuto/.test(b.textContent));
  window.finita = () => bottoni().some((b) => /Continua|Rigioca|Ancora una/.test(b.textContent));
  window.tocca = (giusta) => { const c = carte(); if (c.length < 2) return false; const v = c.map((b) => val(b.querySelector('span').textContent)); const g = v[0] > v[1] ? 0 : 1; c[giusta ? g : 1 - g].click(); return true; };
  window.gioca = async (giusta) => { for (let i = 0; i < 80 && !finita(); i++) { tocca(giusta); await z(450); } return finita(); };
  true`;

let passo = 0;
const scatti = [];
async function scatto(nome, attesa = 900) {
  await z(attesa);
  const r = await manda('Page.captureScreenshot', { format: 'png' });
  const file = join(DOVE, `${String(++passo).padStart(2, '0')}-${nome}.png`);
  writeFileSync(file, Buffer.from(r.result.data, 'base64'));
  scatti.push(file);
  console.log('·', file);
}
async function vai(url, pulito = false) {
  await manda('Page.navigate', { url: BASE + url });
  await z(1200);
  if (pulito) {
    await js('localStorage.clear(); true');
    await manda('Page.navigate', { url: BASE + url });
    await z(1200);
  }
  await js(AIUTI);
}
const premi = async (t, attesa = 900) => {
  const ok = await js(`premi(${JSON.stringify(t)})`);
  if (!ok) console.log('  ! manca il pulsante', t);
  await z(attesa);
  return ok;
};

try {
  // 1 · prima apertura, fino alla prima partita
  await vai('/', true);
  await scatto('benvenuto');
  await js(`(() => { const b = bottoni().filter((b) => !/Si parte/.test(b.textContent)); b[1]?.click(); return b.length; })()`);
  await z(400);
  await scatto('benvenuto-scelto');
  await premi('Si parte');
  await scatto('spiegazione');
  await premi('Si gioca');
  await scatto('pronto');
  await premi('Via', 1500);
  await scatto('partita');
  await js('tocca(false)');
  await scatto('partita-sbagliata', 250);
  await z(1500);
  await js('tocca(true)');
  await scatto('partita-giusta', 200);
  await js('gioca(true)');
  await z(1800);
  await scatto('risultato');

  // 2 · una partita persa apposta: il gatto dubbioso
  await premi('Rigioca', 1200);
  await premi('Via', 1500);
  await js('gioca(false)');
  await z(1800);
  await scatto('risultato-perso');

  // 3 · il viaggio
  await vai('/?cammino=L4');
  await z(2500);
  await scatto('viaggio');
  await vai('/?cammino=L22');
  await z(2500);
  await scatto('viaggio-sera');
  if (BREVE) throw 'breve';

  // 4 · risultato pieno, luogo completato, fiamma
  await vai('/?prova=risultato');
  await z(1200);
  await scatto('risultato-pieno');
  await premi('Continua', 1600);
  await scatto('luogo-completato');
  await premi('Avanti', 1200);
  await scatto('fiamma');

  // 5 · palestra e i giochi
  await vai('/?cammino=L40');
  await z(1500);
  await premi('Palestra');
  await scatto('palestra');
  for (const [nome, etichetta, attesa] of [
    ['coppie', 'Coppie magiche', 1500],
    ['catena', 'CatenaArcade', 6500],
    ['stima', 'Stima lampo', 1500],
    ['bersaglio', 'Il Numero bersaglio', 1500],
    ['bilancia', 'La Bilancia', 1500],
    ['regola', 'Trova la regola', 1500],
    ['quadrato', 'Il Quadrato magico', 1500],
  ]) {
    await vai('/?cammino=L40');
    await z(800);
    await premi('Palestra');
    await premi(etichetta);
    if (nome === 'coppie') await scatto('spiegazione-coppie');
    await premi('Si gioca');
    await premi('Via', attesa);
    await scatto(`gioco-${nome}`);
  }

  // 6 · collezione, una storia, profilo
  await vai('/?cammino=L40');
  await z(800);
  // tre carte vinte, scritte nel profilo salvato: le storie si vincono giocando
  await js(`(() => { const k = Object.keys(localStorage).find((k) => localStorage[k].includes('stelleLivelli')); const p = JSON.parse(localStorage[k]); p.state.carte = ['gauss', 'al-khwarizmi', 'lo-shu']; localStorage[k] = JSON.stringify(p); return k; })()`);
  await vai('/?cammino=L40');
  await z(800);
  await premi('Collezione');
  await scatto('collezione');
  await premi('Gauss');
  await scatto('storia');
  await vai('/?cammino=L40');
  await z(800);
  await premi('Profilo');
  await scatto('profilo');
  await js(`(() => { const h = [...document.querySelectorAll('h2,h3')].find((h) => /Medaglie/.test(h.textContent)); h?.scrollIntoView({ block: 'start' }); return !!h; })()`);
  await scatto('profilo-medaglie');
  await js('window.scrollTo(0, 99999); true');
  await scatto('profilo-giu');
} catch (e) {
  if (e !== 'breve') throw e;
} finally {
  console.log(`${scatti.length} schermate in ${DOVE}`);
  console.log(errori.length ? `ERRORI in console (${errori.length}):\n- ${[...new Set(errori)].join('\n- ')}` : 'console senza errori');
  ws.close();
  chrome.kill();
}
