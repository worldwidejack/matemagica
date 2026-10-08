/**
 * Verifica del Quadrato magico: 600 quesiti per ogni difficoltà 0-10.
 * Controlla con algebra esatta e indipendente (eliminazione di Gauss su
 * interi grandi, sulle equazioni nude delle linee) che la soluzione sia
 * unica e coerente; misura i trucchi ovvi (la regola di papà).
 *
 *   node scripts/verifica-quadrato.ts
 */
import { rngConSeme } from '../src/engine/caso.ts';
import * as q from '../src/games/quadrato/logica.ts';

const rng = rngConSeme(11);
const SENZA_ANGOLO: ReadonlySet<q.TipoPasso> = new Set(['somma', 'centro', 'riga', 'media']);
const N = 600;
let problemi = 0;

function controlla(cond: boolean, msg: string) {
  if (!cond) {
    problemi++;
    if (problemi < 15) console.log('  ✗ ' + msg);
  }
}

// ── Le linee, riscritte da zero (non quelle del gioco) ──
function lineeVere(n: number): number[][] {
  const L: number[][] = [];
  for (let i = 0; i < n; i++) {
    L.push(Array.from({ length: n }, (_, j) => i * n + j));
    L.push(Array.from({ length: n }, (_, j) => j * n + i));
  }
  L.push(Array.from({ length: n }, (_, i) => i * n + i));
  L.push(Array.from({ length: n }, (_, i) => i * n + n - 1 - i));
  return L;
}

// ── Rango esatto (Gauss senza frazioni, BigInt) ──
function mcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}
function rango(M: bigint[][]): number {
  const A = M.map((r) => [...r]);
  const colonne = A[0]?.length ?? 0;
  let r = 0;
  for (let c = 0; c < colonne && r < A.length; c++) {
    let p = -1;
    for (let i = r; i < A.length; i++) if (A[i]![c] !== 0n) { p = i; break; }
    if (p < 0) continue;
    [A[r], A[p]] = [A[p]!, A[r]!];
    const piv = A[r]!;
    for (let i = 0; i < A.length; i++) {
      const riga = A[i]!;
      if (i === r || riga[c] === 0n) continue;
      const f = riga[c]!;
      const g = piv[c]!;
      let nuova = riga.map((x, j) => x * g - piv[j]! * f);
      const d = nuova.reduce((m, x) => mcd(m, x), 0n);
      if (d > 1n) nuova = nuova.map((x) => x / d);
      A[i] = nuova;
    }
    r++;
  }
  return r;
}

/** Sistema nudo: incognite = caselle + somma S. true se la soluzione è unica e quella data lo soddisfa. */
function unicaECoerente(r: q.RoundQuadrato): { unica: boolean; coerente: boolean } {
  const n = r.lato;
  const nv = n * n + 1;
  const A: bigint[][] = [];
  const b: bigint[] = [];
  for (const l of lineeVere(n)) {
    const riga = new Array<bigint>(nv).fill(0n);
    for (const i of l) riga[i] = 1n;
    riga[n * n] = -1n;
    A.push(riga);
    b.push(0n);
  }
  r.date.forEach((data, i) => {
    if (!data) return;
    const riga = new Array<bigint>(nv).fill(0n);
    riga[i] = 1n;
    A.push(riga);
    b.push(BigInt(r.soluzione[i]!));
  });
  if (r.sommaData) {
    const riga = new Array<bigint>(nv).fill(0n);
    riga[n * n] = 1n;
    A.push(riga);
    b.push(BigInt(r.somma));
  }
  const x = [...r.soluzione, r.somma].map(BigInt);
  const coerente = A.every((riga, k) => riga.reduce((s, a, j) => s + a * x[j]!, 0n) === b[k]);
  return { unica: rango(A) === nv, coerente };
}

function griglia(r: q.RoundQuadrato): string {
  const w = Math.max(...r.soluzione.map((x) => q.testoNumero(x).length));
  const righe: string[] = [];
  for (let i = 0; i < r.lato; i++) {
    righe.push(
      r.soluzione
        .slice(i * r.lato, (i + 1) * r.lato)
        .map((x, j) => (r.date[i * r.lato + j] ? q.testoNumero(x) : '·').padStart(w))
        .join(' '),
    );
  }
  return righe.join('   /   ');
}

type Conti = { n: number; angolo: number; linea: number; centro: number; somma: number; ovvio: number; tipi: number; q4: number; neg: number; date: number };
const conti: Conti[] = [];
const t0 = performance.now();
let lento = 0;

for (let d = 0; d <= 10; d++) {
  const c: Conti = { n: 0, angolo: 0, linea: 0, centro: 0, somma: 0, ovvio: 0, tipi: 0, q4: 0, neg: 0, date: 0 };
  for (let k = 0; k < N; k++) {
    const t = performance.now();
    const r = q.genera(d, rng);
    lento = Math.max(lento, performance.now() - t);
    const n = r.lato;
    const id = `d${d} ${r.soluzione.join(',')}`;

    // Coerenza della griglia, con linee indipendenti.
    controlla(r.soluzione.length === n * n && r.date.length === n * n, `${id}: dimensioni`);
    controlla(lineeVere(n).every((l) => l.reduce((s, i) => s + r.soluzione[i]!, 0) === r.somma), `${id}: non magico`);
    controlla(new Set(r.soluzione).size === n * n, `${id}: valori ripetuti`);
    controlla(r.soluzione.every(Number.isInteger), `${id}: non interi`);

    // Unicità con algebra esatta.
    const { unica, coerente } = unicaECoerente(r);
    controlla(coerente, `${id}: soluzione incoerente con le date`);
    controlla(unica, `${id}: soluzione NON unica`);

    // La strada "umana" esiste e ricostruisce proprio la soluzione.
    const noti = r.soluzione.map((x, i) => (r.date[i] ? x : null));
    const umano = q.deduci(n, noti, r.sommaData ? r.somma : null);
    controlla(umano !== null && umano.griglia.every((x, i) => x === r.soluzione[i]), `${id}: il risolutore umano non arriva alla soluzione`);
    controlla(r.passi.every((p) => (p.a < 0 ? p.valore === r.somma : p.valore === r.soluzione[p.a])), `${id}: passo con valore sbagliato`);

    // Il controllo della risposta.
    controlla(q.corretta(r, r.soluzione), `${id}: corretta() rifiuta la soluzione`);
    const vuota = r.date.findIndex((x) => !x);
    const sbagliata = r.soluzione.map((x, i) => (i === vuota ? x + 1 : x));
    controlla(!q.corretta(r, sbagliata), `${id}: corretta() accetta una griglia sbagliata`);
    controlla(q.aiuti(r).length >= 2 && q.soluzione(r).length > 0, `${id}: aiuti o soluzione vuoti`);

    // I trucchi.
    const linea = lineeVere(n).some((l) => l.every((i) => r.date[i]));
    const centro = n === 3 && r.date[4] === true;
    const ovvio = q.risolviUmano(n, r.date, r.soluzione, r.sommaData, q.OVVIE) !== null;
    c.n++;
    if (linea) c.linea++;
    if (centro) c.centro++;
    if (r.sommaData) c.somma++;
    if (ovvio) c.ovvio++;
    if (n === 3 && q.risolviUmano(n, r.date, r.soluzione, r.sommaData, SENZA_ANGOLO) === null) c.angolo++;
    if (n === 4) c.q4++;
    if (r.soluzione.some((x) => x < 0)) c.neg++;
    c.tipi += new Set(r.passi.map((p) => p.tipo)).size;
    c.date += r.date.filter(Boolean).length;

    // Le regole di fascia.
    if (d < 2) controlla(linea && r.sommaData, `${id}: a d<2 serve una linea completa e la somma`);
    if (d >= 3) controlla(!linea, `${id}: linea completa data a d≥3`);
    if (d >= 5) {
      controlla(!centro && !ovvio, `${id}: a d≥5 il centro è dato o bastano i trucchi ovvi`);
      controlla(new Set(r.passi.map((p) => p.tipo)).size >= 2, `${id}: a d≥5 basta un solo tipo di deduzione`);
    }
  }
  conti.push(c);
}

const ms = (performance.now() - t0) / (N * 11);
console.log(`\nIl Quadrato magico: ${N * 11} quesiti, ${ms.toFixed(2)} ms medi (verifica compresa), ${lento.toFixed(0)} ms il più lento a generare`);
const pc = (x: number, n: number) => `${Math.round((x / n) * 100)}%`.padStart(5);
console.log('\n   d | linea completa data | centro dato | somma data | bastano i trucchi ovvi | serve l’angolo | tipi di deduzione | 4×4 | con negativi | caselle date');
conti.forEach((c, d) => {
  console.log(
    `  ${String(d).padStart(2)} |              ${pc(c.linea, c.n)} |       ${pc(c.centro, c.n)} |      ${pc(c.somma, c.n)} |                  ${pc(c.ovvio, c.n)} |          ${pc(c.angolo, c.n)} |               ${(c.tipi / c.n).toFixed(1)} | ${pc(c.q4, c.n)} |        ${pc(c.neg, c.n)} | ${(c.date / c.n).toFixed(1)}`,
  );
});

console.log('\nEsempi (· = da trovare):');
const esempi: [number, q.RoundQuadrato][] = [];
for (const d of [1, 5, 9]) for (let k = 0; k < 2; k++) esempi.push([d, q.genera(d, rng)]);
for (let k = 0; k < 2; ) {
  const r = q.genera(10, rng);
  if (r.lato === 4 && r.sommaData === (k === 0)) {
    esempi.push([10, r]);
    k++;
  }
}
{
  for (const [d, r] of esempi) {
    console.log(`\n  d${d} ${r.lato}×${r.lato}${r.sommaData ? `, somma data ${r.somma}` : ''}:  ${griglia(r)}`);
    console.log(`     strada: ${r.passi.map((p) => p.tipo).join(' → ')}`);
    q.aiuti(r).forEach((a, i) => console.log(`     aiuto ${i + 1}: ${a}`));
    console.log(`     aha: ${q.soluzione(r)}`);
  }
}

console.log(problemi === 0 ? '\n✓ Nessun problema.' : `\n✗ ${problemi} problemi.`);
process.exit(problemi === 0 ? 0 : 1);
