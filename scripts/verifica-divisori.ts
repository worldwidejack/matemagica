/**
 * Verifica di «I due divisori»: 3000 quesiti per ogni difficoltà 0-10.
 * Controlla che ogni numero si spacchi davvero con lo scalpello (un numero dell'anello
 * 2-19 lo divide), che `giusta` accetti tutte le coppie in entrambi gli ordini e rifiuti
 * 1 × N, N × 1 e i colpi sbagliati; misura i trucchi (la regola di papà).
 *
 *   node scripts/verifica-divisori.ts
 */
import { rngConSeme } from '../src/engine/caso.ts';
import * as g from '../src/games/divisori/logica.ts';

const rng = rngConSeme(13);
const N = 3000;
let problemi = 0;

function controlla(cond: boolean, msg: string) {
  if (!cond) {
    problemi++;
    if (problemi < 15) console.log('  ✗ ' + msg);
  }
}

/** Scomposizioni ricalcolate da zero, senza le funzioni del gioco. */
function coppieVere(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 2; a < n; a++) if (n % a === 0) out.push([a, n / a]);
  return out;
}

const PRIMI_IN_FILA = [7, 11, 13, 17, 19];

type Conti = {
  n: number;
  t235: number;
  cifra: number;
  sette: number;
  colpi: Map<number, number>;
  errSpazzata: number;
  piccoli: number;
  quadrati: number;
  buoni: number;
  somma: number;
  valori: number[];
  minimo: Map<number, number>;
};
const conti: Conti[] = [];
const t0 = performance.now();
let lento = 0;

for (let d = 0; d <= 10; d++) {
  const c: Conti = { n: 0, t235: 0, cifra: 0, sette: 0, colpi: new Map(), errSpazzata: 0, piccoli: 0, quadrati: 0, buoni: 0, somma: 0, valori: [], minimo: new Map() };
  for (let k = 0; k < N; k++) {
    const t = performance.now();
    const r = g.genera(d, rng);
    lento = Math.max(lento, performance.now() - t);
    const n = r.n;
    const id = `d${d} n=${n} (${r.famiglia})`;

    // Correttezza.
    const tutte = coppieVere(n);
    const buoni = g.ANELLO.filter((a) => n % a === 0 && n / a > 1);
    controlla(Number.isInteger(n) && n >= 20, `${id}: numero non valido`);
    controlla(tutte.length > 0, `${id}: primo, non si spacca`);
    controlla(buoni.length > 0, `${id}: nessun numero dell'anello lo spacca`);
    controlla(JSON.stringify(buoni) === JSON.stringify(g.colpiBuoni(n)), `${id}: colpiBuoni sbagliato`);
    for (const [a, b] of tutte) {
      controlla(g.giusta(r, { a, b }) && g.giusta(r, { a: b, b: a }), `${id}: rifiuta ${a} × ${b}`);
    }
    controlla(!g.giusta(r, { a: 1, b: n }) && !g.giusta(r, { a: n, b: 1 }), `${id}: accetta 1 × N`);
    for (const a of g.ANELLO) {
      if (n % a !== 0) controlla(!g.giusta(r, { a, b: n / a }), `${id}: accetta il colpo sbagliato ${a}`);
    }
    controlla(!g.giusta(r, { a: buoni[0]!, b: n / buoni[0]! + 1 }), `${id}: accetta un prodotto diverso`);
    const [p, q] = g.spaccoMostrato(n);
    controlla(p * q === n && p >= 2 && q >= 2, `${id}: scomposizione mostrata sbagliata`);
    controlla(g.tempo(d, r) >= 6000, `${id}: tempo troppo corto`);

    // I trucchi.
    const minimo = g.fattoreMinimo(n);
    c.n++;
    if (n % 2 === 0 || n % 3 === 0 || n % 5 === 0) c.t235++;
    if ([0, 2, 4, 5, 6, 8].includes(n % 10)) c.cifra++;
    if (n % 7 === 0) c.sette++;
    for (const a of buoni) c.colpi.set(a, (c.colpi.get(a) ?? 0) + 1);
    // Chi spazza in fila dopo 2, 3, 5: 7, 11, 13… quanti colpi sbagliati prima di quello buono.
    const i = PRIMI_IN_FILA.findIndex((x) => n % x === 0);
    if (minimo >= 7) c.errSpazzata += i < 0 ? 5 : i;
    if (n <= 250) c.piccoli++;
    if (Number.isInteger(Math.sqrt(n))) c.quadrati++;
    c.buoni += buoni.length;
    c.somma += n;
    c.valori.push(n);
    c.minimo.set(minimo, (c.minimo.get(minimo) ?? 0) + 1);

    if (d >= 6) {
      controlla(minimo >= 7, `${id}: a d≥6 si divide per 2, 3 o 5`);
    }
  }
  conti.push(c);
}

const ms = (performance.now() - t0) / (N * 11);
console.log(`\nI due divisori: ${N * 11} quesiti, ${ms.toFixed(3)} ms medi (verifica compresa), ${lento.toFixed(1)} ms il più lento a generare`);
const pc = (x: number, n: number) => `${Math.round((x / n) * 100)}%`.padStart(4);
console.log('\n   d | 2,3,5 bastano | ultima cifra | colpo fisso al 7 | miglior colpo fisso | errori spazzando 7,11,13… | N ≤ 250 | quadrati | colpi buoni | N mediano | fattore più piccolo');
conti.forEach((c, d) => {
  const [migliore, quante] = [...c.colpi.entries()].sort((x, y) => y[1] - x[1])[0] ?? [0, 0];
  const nonPiccoli = c.n - c.t235;
  const valori = [...c.valori].sort((a, b) => a - b);
  const mediano = valori[Math.floor(valori.length / 2)] ?? 0;
  const minimi = [...c.minimo.entries()].sort((a, b) => a[0] - b[0]).map(([p, k]) => `${p}:${Math.round((k / c.n) * 100)}`).join(' ');
  console.log(
    `  ${String(d).padStart(2)} |          ${pc(c.t235, c.n)} |         ${pc(c.cifra, c.n)} |             ${pc(c.sette, c.n)} |        ${pc(quante, c.n)} (${String(migliore).padStart(2)}) |                      ${nonPiccoli ? (c.errSpazzata / nonPiccoli).toFixed(2) : '   –'} |    ${pc(c.piccoli, c.n)} |     ${pc(c.quadrati, c.n)} |         ${(c.buoni / c.n).toFixed(1)} |       ${String(mediano).padStart(4)} | ${minimi}`,
  );
});

// Le soglie della regola di papà: se una non regge, esce con errore.
const soglia = (cond: boolean, msg: string) => {
  if (!cond) {
    problemi++;
    console.log('  ✗ soglia: ' + msg);
  }
};
conti.forEach((c, d) => {
  const quota = (x: number) => x / c.n;
  const migliore = Math.max(...c.colpi.values());
  const nonPiccoli = c.n - c.t235;
  const err = nonPiccoli ? c.errSpazzata / nonPiccoli : 0;
  if (d <= 1) soglia(quota(c.t235) >= 0.85, `d${d}: all'inizio 2, 3, 5 devono bastare quasi sempre`);
  if (d >= 6) {
    soglia(c.t235 === 0 && c.cifra === 0, `d${d}: 2, 3, 5 o l'ultima cifra funzionano ancora`);
    soglia(quota(c.sette) <= 0.45 && quota(migliore) <= 0.45, `d${d}: un colpo fisso riesce troppo spesso`);
    soglia(err >= 0.8, `d${d}: spazzare 7, 11, 13 in fila costa troppo poco (${err.toFixed(2)})`);
  }
  if (d >= 8) {
    soglia(quota(migliore) <= 0.35, `d${d}: miglior colpo fisso oltre il 35%`);
    soglia(err >= 1.3, `d${d}: spazzare in fila costa meno di 1,3 errori a quesito (${err.toFixed(2)})`);
    soglia(quota(c.piccoli) >= 0.12, `d${d}: in alto ci sono solo numeri grandi`);
  }
});

console.log('\nEsempi:');
for (const d of [0, 3, 5, 7, 10]) {
  const xs = Array.from({ length: 8 }, () => g.genera(d, rng).n);
  console.log(`  d${d}: ${xs.map((n) => `${n} = ${g.spaccoMostrato(n).join(' × ')}`).join(' · ')}`);
}

console.log(problemi === 0 ? '\n✓ Nessun problema.' : `\n✗ ${problemi} problemi.`);
process.exit(problemi === 0 ? 0 : 1);
