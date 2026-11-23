import type { Rng } from '../../engine/caso.ts';
import { scegli } from '../../engine/caso.ts';

/**
 * «I due divisori» (idea di papà): compare un numero, lo si spacca in due numeri
 * maggiori di 1 che moltiplicati lo danno. 91 → 7 × 13.
 *
 * Regola di papà: il trucco ovvio è «provo solo 2, 3 e 5» (e «guardo l'ultima cifra»).
 * Dalla difficoltà 6 in su nessun numero si divide per 2, 3 o 5: il fattore più piccolo
 * è 7, 11, 13, 17 o 19 (49, 77, 91, 119, 143, 221…), mescolati a numeri che si spaccano
 * in più modi (77 = 7 × 11 si spacca col 7 e con l'11; 1001 = 7 × 11 × 13 in tre).
 *
 * Il secondo trucco nasce dal gesto: lo scalpello gira su un anello di numeri da 2 a 19,
 * quindi «colpisco sempre il 7» o «spazzo 7, 11, 13 in fila». Lo smontano le dosi: in alto
 * il 7 è il fattore giusto al massimo una volta su tre, e chi spazza in fila sbaglia in
 * media più di un colpo a quesito (ogni colpo sbagliato costa una vita).
 *
 * La scala non è solo «numeri più grandi»: sale il fattore più piccolo. 143 = 11 × 13 e
 * 221 = 13 × 17 restano piccoli e stanno in cima.
 */

export type Famiglia = 'tabellina' | 'ricco' | 'oltre' | 'falso-primo' | 'sette' | 'nascosto' | 'molti';
export type RoundDivisori = { n: number; famiglia: Famiglia };
/** La risposta: i due pezzi del cristallo. `b` può non essere intero se `a` non divide. */
export type Spacco = { a: number; b: number };

/** I numeri sull'anello dello scalpello. */
export const ANELLO: readonly number[] = Array.from({ length: 18 }, (_, i) => i + 2);
export const ANELLO_MAX = 19;

export function primo(n: number): boolean {
  if (n < 2 || !Number.isInteger(n)) return false;
  for (let k = 2; k * k <= n; k++) if (n % k === 0) return false;
  return true;
}

/** Il fattore primo più piccolo (n ≥ 2). */
export function fattoreMinimo(n: number): number {
  for (let k = 2; k * k <= n; k++) if (n % k === 0) return k;
  return n;
}

/** Tutte le scomposizioni a × b = n con 2 ≤ a ≤ b. */
export function scomposizioni(n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 2; a * a <= n; a++) if (n % a === 0) out.push([a, n / a]);
  return out;
}

/** I numeri dell'anello che spaccano n (l'altro pezzo maggiore di 1). */
export function colpiBuoni(n: number): number[] {
  return ANELLO.filter((a) => n % a === 0 && n / a > 1);
}

/** La scomposizione da mostrare quando il cristallo regge: col fattore più piccolo. */
export function spaccoMostrato(n: number): [number, number] {
  const p = fattoreMinimo(n);
  return [p, n / p];
}

export function giusta(round: RoundDivisori, s: Spacco): boolean {
  const { a, b } = s;
  return Number.isInteger(a) && Number.isInteger(b) && a >= 2 && b >= 2 && a * b === round.n;
}

function primiTra(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let k = Math.max(2, lo); k <= hi; k++) if (primo(k)) out.push(k);
  return out;
}

type Generatore = (rng: Rng) => number | null;
type Voce = readonly [peso: number, genera: Generatore, famiglia: Famiglia];

// ── Le famiglie ──

/** Un fatto delle tabelline: 6 × 7 = 42, 7 × 7 = 49. */
const tabellina: Generatore = (rng) => {
  const n = scegli(rng, ANELLO.slice(0, 8)) * scegli(rng, ANELLO.slice(0, 8));
  return n >= 20 ? n : null;
};

/** Un numero che si spacca in almeno tre modi: 36 = 2 × 18 = 3 × 12 = 4 × 9 = 6 × 6. */
const ricco =
  (max: number): Generatore =>
  (rng) => {
    for (let t = 0; t < 20; t++) {
      const a = scegli(rng, [2, 3, 4, 5, 6]);
      const b = scegli(rng, ANELLO.filter((x) => x >= 4 && a * x <= max && a * x >= 20));
      const n = a * b;
      if (scomposizioni(n).length >= 3) return n;
    }
    return null;
  };

/** Fuori tabellina: 4 × 13 = 52, 6 × 17 = 102. */
const oltre: Generatore = (rng) => scegli(rng, [2, 3, 4, 5, 6]) * scegli(rng, primiTra(11, 19));

/** Faccia da primo ma si divide per 3: 51, 57, 87, 111… (e ogni tanto 9 × 13 = 117). */
const falsoPrimo =
  (qlo: number, qhi: number): Generatore =>
  (rng) =>
    rng() < 0.15 ? 9 * scegli(rng, primiTra(11, 19)) : 3 * scegli(rng, primiTra(qlo, qhi));

/** p × q con q primo ≥ p: il fattore più piccolo è proprio p. */
const semiprimo =
  (p: number, qlo: number, qhi: number): Generatore =>
  (rng) =>
    p * scegli(rng, primiTra(Math.max(p, qlo), qhi));

/** Tre primi da 7 in su: si spacca in più modi. 1001 = 7 × 143 = 11 × 91 = 13 × 77. */
const MOLTI = [343, 539, 637, 833, 847, 931, 1001] as const;
const molti: Generatore = (rng) => scegli(rng, MOLTI);

/**
 * Le tabelle per difficoltà: T0 a d=0, T1 a d=2 … T5 a d=10. Fra due tabelle il
 * quesito viene da quella dopo con probabilità crescente: la scala è continua.
 * Da T3 (d ≥ 6) niente 2, 3, 5.
 */
const TABELLE: readonly (readonly Voce[])[] = [
  [
    [0.65, tabellina, 'tabellina'],
    [0.35, ricco(60), 'ricco'],
  ],
  [
    [0.4, oltre, 'oltre'],
    [0.25, falsoPrimo(11, 31), 'falso-primo'],
    [0.15, ricco(90), 'ricco'],
    [0.15, semiprimo(7, 7, 13), 'sette'],
    [0.05, tabellina, 'tabellina'],
  ],
  [
    [0.3, falsoPrimo(17, 61), 'falso-primo'],
    [0.3, semiprimo(7, 7, 31), 'sette'],
    [0.18, semiprimo(11, 11, 17), 'nascosto'],
    [0.12, oltre, 'oltre'],
    [0.1, ricco(180), 'ricco'],
  ],
  [
    [0.32, semiprimo(7, 7, 37), 'sette'],
    [0.28, semiprimo(11, 11, 29), 'nascosto'],
    [0.25, semiprimo(13, 13, 23), 'nascosto'],
    [0.07, semiprimo(17, 17, 19), 'nascosto'],
    [0.08, molti, 'molti'],
  ],
  [
    [0.18, semiprimo(7, 19, 61), 'sette'],
    [0.25, semiprimo(11, 11, 37), 'nascosto'],
    [0.25, semiprimo(13, 13, 31), 'nascosto'],
    [0.17, semiprimo(17, 17, 23), 'nascosto'],
    [0.1, semiprimo(19, 19, 23), 'nascosto'],
    [0.05, molti, 'molti'],
  ],
  [
    [0.12, semiprimo(7, 23, 71), 'sette'],
    [0.2, semiprimo(11, 13, 41), 'nascosto'],
    [0.25, semiprimo(13, 13, 37), 'nascosto'],
    [0.23, semiprimo(17, 17, 29), 'nascosto'],
    [0.15, semiprimo(19, 19, 23), 'nascosto'],
    [0.05, molti, 'molti'],
  ],
];

function pesca(tab: readonly Voce[], rng: Rng): Voce {
  const tot = tab.reduce((s, v) => s + v[0], 0);
  let x = rng() * tot;
  for (const v of tab) {
    x -= v[0];
    if (x < 0) return v;
  }
  return tab[tab.length - 1]!;
}

function valido(n: number): boolean {
  return n >= 20 && n <= 1001 && colpiBuoni(n).length > 0;
}

export function genera(d: number, rng: Rng): RoundDivisori {
  const dd = Math.max(0, Math.min(10, d));
  const base = Math.min(5, Math.floor(dd / 2));
  const t = base >= 5 ? 0 : (dd - base * 2) / 2;
  const tab = TABELLE[rng() < t ? Math.min(5, base + 1) : base] ?? TABELLE[0]!;
  for (let k = 0; k < 30; k++) {
    const [, gen, famiglia] = pesca(tab, rng);
    const n = gen(rng);
    if (n !== null && valido(n)) return { n, famiglia };
  }
  return { n: 91, famiglia: 'sette' };
}

/** Più tempo in alto: provare 13 o 17 a mente è un conto vero. */
export function tempo(d: number, round?: RoundDivisori): number {
  return Math.round(6000 + 600 * d) + (round && round.n > 500 ? 1500 : 0);
}
