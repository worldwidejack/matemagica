/**
 * Verifica dei generatori: migliaia di quesiti per gioco, a ogni difficoltà.
 * Controlla che ogni quesito sia risolvibile e coerente, misura quanto spesso
 * i trucchi ovvi funzionerebbero (la regola di papà) e quanto costa generarli.
 *
 *   npm run verifica
 */
import { rngConSeme } from '../src/engine/caso.ts';
import * as piuGrande from '../src/games/piu-grande/logica.ts';
import * as coppie from '../src/games/coppie/logica.ts';
import * as catena from '../src/games/catena/logica.ts';
import * as stima from '../src/games/stima/logica.ts';
import * as bersaglio from '../src/games/bersaglio/logica.ts';
import * as bilancia from '../src/games/bilancia/logica.ts';
import * as regola from '../src/games/regola/logica.ts';

const rng = rngConSeme(7);
const N = 600;
const DIFF = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let problemi = 0;

function controlla(cond: boolean, msg: string) {
  if (!cond) {
    problemi++;
    if (problemi < 15) console.log('  ✗ ' + msg);
  }
}

function prova<R>(nome: string, gen: (d: number) => R, verifica: (r: R, d: number) => void, esempio: (r: R) => string) {
  const t0 = performance.now();
  let lento = 0;
  for (const d of DIFF) {
    for (let i = 0; i < N; i++) {
      const t = performance.now();
      const r = gen(d);
      lento = Math.max(lento, performance.now() - t);
      verifica(r, d);
    }
  }
  const ms = (performance.now() - t0) / (N * DIFF.length);
  console.log(`\n${nome}: ${(N * DIFF.length)} quesiti, ${ms.toFixed(2)} ms medi, ${lento.toFixed(0)} ms il più lento`);
  for (const d of [0, 4, 8, 10]) console.log(`  d${d}: ${esempio(gen(d))}`);
}

// ── Chi è più grande? ──
prova('Chi è più grande?', (d) => piuGrande.genera(d, rng), (r) => {
  controlla(r.a.valore !== r.b.valore, 'più grande: valori uguali');
}, (r) => `${r.a.testo} vs ${r.b.testo}`);

// ── Coppie ──
let ultimaObbligata = 0;
let griglie = 0;
prova('Coppie magiche', (d) => coppie.genera(d, rng), (r, d) => {
  // Ogni numero ha il compagno o è un'esca; le coppie si completano tutte.
  const conti = new Map<number, number>();
  for (const c of r.celle) conti.set(c.n, (conti.get(c.n) ?? 0) + 1);
  let inCoppia = 0;
  for (const [n, k] of conti) {
    const c = coppie.compagno(r.tipo, r.obiettivo, n);
    if (c === null || !conti.has(c)) continue;
    if (c === n) {
      if (k === 1) continue; // un 5 da solo (obiettivo 10) è un'esca valida
      controlla(k % 2 === 0, `coppie: ${n} doppio dispari`);
      inCoppia += k;
    } else {
      controlla(conti.get(c) === k, `coppie: ${n} e ${c} sbilanciati`);
      inCoppia += k;
    }
  }
  controlla(inCoppia === r.coppie * 2, `coppie: ${inCoppia} numeri in coppia, attesi ${r.coppie * 2}`);
  griglie++;
  if (r.celle.length === r.coppie * 2 && d >= 2) ultimaObbligata++;
}, (r) => `${r.tipo} = ${r.obiettivo}: ${r.celle.map((c) => c.n).join(' ')}`);
console.log(`  griglie senza esche dalla difficoltà 2 in su: ${ultimaObbligata}/${griglie}`);

// ── Catena ──
prova('Catena', (d) => catena.genera(d, rng), (r) => {
  controlla(r.opzioni.includes(r.risultato), 'catena: risposta non tra le opzioni');
  controlla(new Set(r.opzioni).size === 4, 'catena: opzioni ripetute');
  controlla(Number.isInteger(r.risultato) && r.risultato >= 0, `catena: risultato ${r.risultato}`);
  // L'esca "risultato prima dell'ultimo passo" deve esserci sempre (se diverso dal risultato).
  let x = r.inizio;
  let prima = x;
  for (const p of r.passi) {
    prima = x;
    x = p.op === '+' ? x + p.v : p.op === '−' ? x - p.v : p.op === '×' ? x * p.v : x / p.v;
  }
  controlla(x === r.risultato, 'catena: risultato non coerente coi passi');
  controlla(prima === r.risultato || r.opzioni.includes(prima), 'catena: manca l\'esca del penultimo passo');
}, (r) => `${r.inizio} ${r.passi.map(catena.testoPasso).join(' ')} = ${r.risultato}  [${r.opzioni.join(', ')}] ${r.msPasso}ms/passo`);

// ── Stima ──
const posizioni = [0, 0, 0];
prova('Stima lampo', (d) => stima.genera(d, rng), (r) => {
  const g = r.opzioni[r.giusta]!;
  const dist = Math.abs(g - r.valore);
  controlla(r.opzioni.every((o, i) => i === r.giusta || Math.abs(o - r.valore) > dist), `stima: ${r.testo} giusta non la più vicina`);
  const ordinate = [...r.opzioni].sort((a, b) => a - b);
  posizioni[ordinate.indexOf(g)]!++;
}, (r) => `${r.testo} ≈ ? [${r.opzioni.join(', ')}] → ${r.opzioni[r.giusta]} (vero ${r.valore.toFixed(1)})`);
const tot = posizioni.reduce((a, b) => a + b, 0);
console.log(`  la giusta è la più bassa / in mezzo / la più alta: ${posizioni.map((p) => Math.round((p / tot) * 100) + '%').join(' / ')}`);

// ── Bersaglio ──
let sommaFunziona = 0;
let rondeB = 0;
prova('Il Numero bersaglio', (d) => bersaglio.genera(d, rng), (r, d) => {
  controlla(bersaglio.verifica(r, r.soluzione), `bersaglio: soluzione non valida ${JSON.stringify(r)}`);
  if (d >= 2) {
    rondeB++;
    if (r.numeri.reduce((s, n) => s + n, 0) === r.bersaglio) sommaFunziona++;
  }
}, (r) => `[${r.numeri.join(' ')}] → ${r.bersaglio}   (${r.soluzione.map(bersaglio.testoPasso).join(', ')})`);
console.log(`  bersagli raggiungibili "sommando tutto" (d≥2): ${sommaFunziona}/${rondeB}`);

// ── Bilancia ──
prova('La Bilancia', (d) => bilancia.genera(d, rng), (r) => {
  for (const b of r.bilance) {
    const v = (p: bilancia.Piatto) => p.forme.reduce((s, n, i) => s + n * r.pesi[i]!, 0) + p.peso;
    controlla(v(b.sinistra) === v(b.destra), 'bilancia: non in equilibrio');
  }
}, (r) => {
  const piatto = (p: bilancia.Piatto) =>
    [...p.forme.flatMap((n, i) => Array<string>(n).fill(bilancia.FORME[i]!)), ...(p.peso ? [String(p.peso)] : [])].join('') || '∅';
  return `${r.bilance.map((b) => `${piatto(b.sinistra)} = ${piatto(b.destra)}`).join(' ; ')}  → ${bilancia.FORME[r.chiesta]}? (${bilancia.soluzione(r)})`;
});

// ── Trova la regola ──
const truccoPerFascia = [0, 0, 0, 0, 0];
const contaPerFascia = [0, 0, 0, 0, 0];
prova('Trova la regola', (d) => regola.genera(d, rng), (r, d) => {
  controlla(Number.isFinite(r.risposta), 'regola: risposta non finita');
  const f = Math.min(4, Math.floor(d / 2));
  contaPerFascia[f]!++;
  if (regola.previsioneTrucco(r.termini) === r.risposta) truccoPerFascia[f]!++;
}, (r) => `${r.termini.join(', ')}, ? → ${r.risposta}   (${r.regola})`);
console.log(
  `  il trucco "aggiungo l'ultima differenza" indovina, per fascia 0-4: ${truccoPerFascia
    .map((t, i) => Math.round((t / contaPerFascia[i]!) * 100) + '%')
    .join(' / ')}`,
);

console.log(problemi === 0 ? '\n✓ Nessun problema.' : `\n✗ ${problemi} problemi.`);
process.exit(problemi === 0 ? 0 : 1);
