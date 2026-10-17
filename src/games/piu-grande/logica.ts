import type { Rng } from '../../engine/caso.ts';
import { intero, scegli } from '../../engine/caso.ts';

/**
 * "Chi è più grande?" — due espressioni, tocca la maggiore.
 *
 * Regola di papà: un gioco non deve svuotarsi con un solo trucco. Il trucco
 * ovvio qui è "vince chi mostra il numero più grosso": metà dei quesiti sono
 * costruiti apposta perché quel trucco sbagli (`ingannevole`). Per vincere
 * bisogna stimare davvero.
 *
 * Quattro famiglie di quesiti, mescolate (le ultime tre dalle risposte di papà, 16/10):
 * - classica: le due espressioni pescate dalla fascia di difficoltà;
 * - mista: operazioni diverse ai due lati, da subito (papà: "9 + 4 contro 4 × 3");
 * - divisione: rapporti con resto, da metà gioco (papà: "6 : 4 contro 25 : 14");
 * - quadrato: l'"ah, carina" di papà, (n+1)² contro n² + 2n ("4 × 4 contro 9 + 6",
 *   "8 + 8 contro 9 + 6"), rara, insieme al classico n² contro (n−1)(n+1).
 *   Metà delle volte vince l'altro lato: capito il trucco, bisogna ancora fare il conto.
 */

export type Espressione = { testo: string; valore: number; numeri: number[] };
export type Lato = 'a' | 'b';
export type Famiglia = 'classica' | 'mista' | 'divisione' | 'quadrato';
export type RoundPiuGrande = { a: Espressione; b: Espressione; ingannevole: boolean; famiglia: Famiglia };

type Costruttore = (rng: Rng) => Espressione;
type Coppia = [Espressione, Espressione];
/** Cosa chiede il quesito: fascia (0-4), quanto sei avanti nella fascia (0-1), se il trucco deve sbagliare. */
type Richiesta = { fascia: number; dentro: number; inganno: boolean };

const somma = (x: number, y: number): Espressione => ({ testo: `${x} + ${y}`, valore: x + y, numeri: [x, y] });
const somma3 = (x: number, y: number, z: number): Espressione => ({
  testo: `${x} + ${y} + ${z}`,
  valore: x + y + z,
  numeri: [x, y, z],
});
const diff = (x: number, y: number): Espressione => ({ testo: `${x} − ${y}`, valore: x - y, numeri: [x, y] });
const per = (x: number, y: number): Espressione => ({ testo: `${x} × ${y}`, valore: x * y, numeri: [x, y] });
const alQuadrato = (n: number): Espressione => ({ testo: `${n}²`, valore: n * n, numeri: [n] });
/** Divisione col simbolo di papà, ":". Qui il valore non è intero: si confrontano rapporti. */
const diviso = (x: number, y: number): Espressione => ({ testo: `${x} : ${y}`, valore: x / y, numeri: [x, y] });
const piu = (e: Espressione, c: number): Espressione => ({
  testo: `${e.testo} + ${c}`,
  valore: e.valore + c,
  numeri: [...e.numeri, c],
});

/** Fasce di difficoltà: ogni fascia copre 2 punti della scala 0-10. */
const FASCE: Costruttore[][] = [
  // 0 — somme a una cifra
  [(r) => somma(intero(r, 1, 9), intero(r, 1, 9))],
  // 1 — somme e differenze con le decine
  [
    (r) => somma(intero(r, 10, 49), intero(r, 2, 9)),
    (r) => diff(intero(r, 20, 60), intero(r, 2, 19)),
  ],
  // 2 — tabelline contro somme e differenze
  [
    (r) => per(intero(r, 2, 9), intero(r, 2, 9)),
    (r) => somma(intero(r, 10, 79), intero(r, 5, 30)),
    (r) => diff(intero(r, 30, 99), intero(r, 5, 40)),
  ],
  // 3 — prodotti fuori tabellina, prodotto più qualcosa
  [
    (r) => per(intero(r, 2, 9), intero(r, 11, 25)),
    (r) => per(intero(r, 11, 19), intero(r, 3, 6)),
    (r) => piu(per(intero(r, 3, 9), intero(r, 3, 9)), intero(r, 2, 20)),
  ],
  // 4 — prodotti a due cifre, quadrati
  [
    (r) => per(intero(r, 11, 39), intero(r, 11, 39)),
    (r) => per(intero(r, 2, 9), intero(r, 26, 99)),
    (r) => alQuadrato(intero(r, 11, 30)),
  ],
];

/** Quanto possono distare i due valori, in proporzione: più si sale, più sono vicini. */
const DISTANZA_MAX = [0.35, 0.2, 0.12, 0.06, 0.03] as const;

/**
 * Quanto spesso esce ogni famiglia nuova, per fascia; il resto è classica.
 * Restano minoritarie: la mista da subito, la divisione da metà, il quadrato raro.
 */
const DOSI = {
  quadrato: [0, 0.06, 0.06, 0.06, 0.12],
  divisione: [0, 0, 0.18, 0.2, 0.2],
  mista: [0.3, 0.25, 0.2, 0.2, 0.15],
} as const;

function fasciaPer(d: number, rng: Rng): { fascia: number; dentro: number } {
  const base = Math.min(4, Math.floor(d / 2));
  // Ogni tanto una fascia sotto: un respiro, e il ritmo non è mai piatto.
  const fascia = base > 0 && rng() < 0.2 ? base - 1 : base;
  const dentro = Math.min(1, (d - base * 2) / 2); // 0-1: quanto sei avanti nella fascia
  return { fascia, dentro };
}

function scegliFamiglia(fascia: number, rng: Rng): Famiglia {
  let x = rng();
  for (const f of ['quadrato', 'divisione', 'mista'] as const) {
    const p = DOSI[f][fascia] ?? 0;
    if (x < p) return f;
    x -= p;
  }
  return 'classica';
}

/** Il trucco da smontare: "vince chi mostra il numero più grosso". */
function truccoSbaglia(a: Espressione, b: Espressione): boolean {
  const ma = Math.max(...a.numeri);
  const mb = Math.max(...b.numeri);
  if (ma === mb) return false;
  return ma > mb !== a.valore > b.valore;
}

/** Le condizioni di ogni quesito: valori positivi e diversi, niente numeri in comune. */
function valida([x, y]: Coppia): boolean {
  if (x.valore <= 0 || y.valore <= 0 || x.testo === y.testo || x.valore === y.valore) return false;
  // Un numero in comune (8+6 contro 8+3) è un altro trucco: basta guardare
  // l'altro numero, senza calcolare. Si scarta sempre.
  return !x.numeri.some((n) => y.numeri.includes(n));
}

function tolleranza(r: Richiesta): number {
  return (DISTANZA_MAX[r.fascia] ?? 0.35) * (1 - 0.4 * r.dentro);
}

function vicini([x, y]: Coppia, r: Richiesta): boolean {
  const distanza = Math.abs(x.valore - y.valore);
  const max = Math.max(1, Math.round(Math.max(x.valore, y.valore) * tolleranza(r)));
  return distanza > 0 && distanza <= max;
}

/**
 * Pesca coppie finché ne trova una valida, vicina quanto chiede `buona` e con
 * l'inganno richiesto. Dopo tanti tentativi si accetta anche senza inganno:
 * meglio un quesito onesto che un ciclo infinito.
 */
function cerca(pesca: () => Coppia | null, buona: (c: Coppia) => boolean, inganno: boolean): Coppia | null {
  for (let t = 0; t < 600; t++) {
    const c = pesca();
    if (c === null || !valida(c) || !buona(c)) continue;
    if (truccoSbaglia(c[0], c[1]) !== inganno && t < 450) continue;
    return c;
  }
  return null;
}

// ── Classica ──

function classica(r: Richiesta, rng: Rng): Coppia | null {
  const costruttori = FASCE[r.fascia] ?? FASCE[0]!;
  return cerca(() => [scegli(rng, costruttori)(rng), scegli(rng, costruttori)(rng)], (c) => vicini(c, r), r.inganno);
}

// ── Mista: operazioni diverse ai due lati ──
// Un lato si pesca, l'altro si costruisce vicino al suo valore con un'altra operazione.

/** Una somma che fa `t`, addendi tra `lo` e `hi`. */
function sommaVerso(t: number, lo: number, hi: number, rng: Rng): Espressione | null {
  const da = Math.max(lo, t - hi);
  const a = Math.min(hi, t - lo);
  if (da > a) return null;
  const x = intero(rng, da, a);
  return somma(x, t - x);
}

function somma3Verso(t: number, lo: number, hi: number, rng: Rng): Espressione | null {
  const x = intero(rng, lo, hi);
  const y = intero(rng, lo, hi);
  const z = t - x - y;
  return z >= lo && z <= hi ? somma3(x, y, z) : null;
}

/** Una differenza che fa `t`, col sottraendo tra `lo` e `hi`. */
function diffVerso(t: number, lo: number, hi: number, rng: Rng): Espressione | null {
  if (t < 1) return null;
  const y = intero(rng, lo, hi);
  return diff(t + y, y);
}

/** Una divisione con resto a meno di 1 da `v` (intero): 25 : 4 contro 2 × 3. */
function divisioneVerso(v: number, lo: number, hi: number, rng: Rng): Espressione | null {
  const b = intero(rng, lo, hi);
  const resto = intero(rng, 1, b - 1) * (rng() < 0.5 ? -1 : 1);
  const a = v * b + resto;
  return a > b ? diviso(a, b) : null;
}

type Modello = (r: Richiesta, rng: Rng) => Coppia | null;

/** Pesca un lato con `pesca` e costruisce l'altro vicino al suo valore. */
function attorno(pesca: Costruttore, costruisci: (t: number, rng: Rng) => Espressione | null): Modello {
  return (r, rng) => {
    const x = pesca(rng);
    const larghezza = Math.max(1, Math.round(x.valore * tolleranza(r)));
    const scarto = intero(rng, 1, larghezza) * (rng() < 0.5 ? -1 : 1);
    const y = costruisci(x.valore + scarto, rng);
    return y === null ? null : [x, y];
  };
}

/** Come `attorno`, ma l'altro lato è una divisione con resto: lo scarto ce l'ha già (meno di 1). */
function attornoDivisione(pesca: Costruttore, lo: number, hi: number): Modello {
  return (_r, rng) => {
    const x = pesca(rng);
    const y = divisioneVerso(x.valore, lo, hi, rng);
    return y === null ? null : [x, y];
  };
}

const MISTE: Modello[][] = [
  // 0 — papà: 9 + 4 contro 4 × 3
  [
    attorno((r) => per(intero(r, 2, 5), intero(r, 2, 5)), (t, r) => sommaVerso(t, 1, 9, r)),
    attorno((r) => per(intero(r, 2, 5), intero(r, 2, 5)), (t, r) => diffVerso(t, 1, 9, r)),
    attorno((r) => somma(intero(r, 1, 9), intero(r, 1, 9)), (t, r) => diffVerso(t, 1, 9, r)),
  ],
  // 1 — tabelline contro somme (anche di tre numeri) e differenze
  [
    attorno((r) => per(intero(r, 2, 9), intero(r, 2, 9)), (t, r) => sommaVerso(t, 2, 60, r)),
    attorno((r) => per(intero(r, 2, 9), intero(r, 2, 9)), (t, r) => somma3Verso(t, 2, 9, r)),
    attorno((r) => per(intero(r, 2, 9), intero(r, 2, 9)), (t, r) => diffVerso(t, 2, 19, r)),
  ],
  // 2
  [
    attorno((r) => per(intero(r, 2, 9), intero(r, 2, 9)), (t, r) => somma3Verso(t, 5, 30, r)),
    attorno((r) => per(intero(r, 2, 9), intero(r, 11, 15)), (t, r) => diffVerso(t, 5, 60, r)),
    attorno((r) => piu(per(intero(r, 3, 9), intero(r, 3, 9)), intero(r, 2, 20)), (t, r) => sommaVerso(t, 5, 80, r)),
  ],
  // 3 — e la divisione con resto contro una tabellina
  [
    attorno((r) => per(intero(r, 2, 9), intero(r, 11, 25)), (t, r) => sommaVerso(t, 10, 199, r)),
    attorno((r) => per(intero(r, 11, 19), intero(r, 3, 6)), (t, r) => diffVerso(t, 10, 99, r)),
    attornoDivisione((r) => per(intero(r, 2, 9), intero(r, 2, 9)), 3, 9),
    attornoDivisione((r) => somma(intero(r, 2, 20), intero(r, 2, 20)), 3, 9),
  ],
  // 4
  [
    attorno((r) => per(intero(r, 11, 39), intero(r, 11, 39)), (t, r) => sommaVerso(t, 50, 999, r)),
    attorno((r) => alQuadrato(intero(r, 11, 30)), (t, r) => diffVerso(t, 10, 400, r)),
    attorno((r) => per(intero(r, 2, 9), intero(r, 26, 99)), (t, r) => sommaVerso(t, 20, 600, r)),
    attornoDivisione((r) => per(intero(r, 2, 9), intero(r, 2, 12)), 3, 12),
  ],
];

function mista(r: Richiesta, rng: Rng): Coppia | null {
  const modelli = MISTE[r.fascia] ?? MISTE[0]!;
  return cerca(() => scegli(rng, modelli)(r, rng), (c) => vicini(c, r), r.inganno);
}

// ── Divisione: due rapporti con resto ──

type Rapporti = { divisore: [number, number]; dividendoMax: number; valoreMax: number; distanza: [number, number] };

const RAPPORTI: (Rapporti | null)[] = [
  null,
  null,
  { divisore: [2, 12], dividendoMax: 60, valoreMax: 9, distanza: [0.03, 0.25] },
  { divisore: [2, 19], dividendoMax: 150, valoreMax: 12, distanza: [0.02, 0.15] },
  { divisore: [3, 25], dividendoMax: 300, valoreMax: 20, distanza: [0.01, 0.08] },
];

function divisione(r: Richiesta, rng: Rng): Coppia | null {
  const p = RAPPORTI[r.fascia];
  if (!p) return null;
  const [bMin, bMax] = p.divisore;
  const relMax = p.distanza[1] * (1 - 0.4 * r.dentro);
  const relMin = Math.min(p.distanza[0], relMax / 2);
  return cerca(
    () => {
      const b = intero(rng, bMin, bMax);
      const a = intero(rng, b + 1, Math.max(b + 1, Math.min(p.dividendoMax, b * p.valoreMax)));
      const d = intero(rng, bMin, bMax);
      const scarto = (relMin + rng() * (relMax - relMin)) * (rng() < 0.5 ? -1 : 1);
      const c = Math.round((a / b) * d * (1 + scarto));
      // Mai una divisione esatta: il bello è che il risultato non è intero.
      if (a % b === 0 || c % d === 0 || c <= d || c > p.dividendoMax) return null;
      return [diviso(a, b), diviso(c, d)];
    },
    ([x, y]) => {
      const [a = 0, b = 1] = x.numeri;
      const [c = 0, d = 1] = y.numeri;
      if (a * d === b * c) return false; // stesso rapporto scritto diverso: pareggio
      const scarto = Math.abs(x.valore - y.valore);
      const rel = scarto / Math.max(x.valore, y.valore);
      // Almeno 0,02 di differenza: a fine quesito i risultati, arrotondati, restano diversi.
      return rel >= relMin && rel <= relMax && scarto >= 0.02;
    },
    r.inganno,
  );
}

// ── Quadrato: l'"ah, carina" di papà ──
// (n+1)² = n² + 2n + 1. Contro n² + 2n vince il quadrato, contro n² + 2n + 2
// vince l'altro: chi ha capito il trucco deve ancora contare. Il numero più grosso
// sta sempre dal lato non quadrato, quindi il trucco sbaglia quando vince il quadrato.

function quadratoConcreto(fascia: number, vinceQuadrato: boolean, rng: Rng): Coppia {
  const [lo, hi] = fascia <= 1 ? [3, 6] : fascia === 2 ? [3, 9] : [5, 12];
  const n = intero(rng, lo, hi);
  const q = (n + 1) * (n + 1);
  // 4 × 4, oppure 8 + 8 quando il quadrato è pari (papà).
  const lato = q % 2 === 0 && rng() < 0.4 ? somma(q / 2, q / 2) : per(n + 1, n + 1);
  const m = vinceQuadrato ? 2 * n : 2 * n + 2;
  return [lato, rng() < 0.75 ? somma(n * n, m) : somma(m, n * n)];
}

/** Coi quadrati scritti: 13² + 26 contro 14². */
function quadratoPotenze(vinceQuadrato: boolean, rng: Rng): Coppia {
  const n = intero(rng, 11, 20);
  return [alQuadrato(n + 1), piu(alQuadrato(n), vinceQuadrato ? 2 * n : 2 * n + 2)];
}

/** Il classico n² contro (n−k)(n+k) = n² − k², e la sua rivincita con + c. */
function quadratoProdotto(vinceQuadrato: boolean, rng: Rng): Coppia {
  const n = intero(rng, 12, 30);
  const k = intero(rng, 1, 3);
  const c = vinceQuadrato ? k * k - 1 : k * k + 1;
  const prodotto = per(n - k, n + k);
  return [alQuadrato(n), c === 0 ? prodotto : piu(prodotto, c)];
}

function quadrato(r: Richiesta, rng: Rng): Coppia | null {
  for (let t = 0; t < 50; t++) {
    const c =
      r.fascia >= 4
        ? rng() < 0.5
          ? quadratoPotenze(r.inganno, rng)
          : quadratoProdotto(r.inganno, rng)
        : quadratoConcreto(r.fascia, r.inganno, rng);
    if (valida(c) && truccoSbaglia(c[0], c[1]) === r.inganno) return c;
  }
  return null;
}

const GENERATORI: Record<Famiglia, (r: Richiesta, rng: Rng) => Coppia | null> = {
  classica,
  mista,
  divisione,
  quadrato,
};

export function genera(d: number, rng: Rng): RoundPiuGrande {
  const { fascia, dentro } = fasciaPer(d, rng);
  let famiglia = scegliFamiglia(fascia, rng);
  // Al primo gradino il confronto classico è un riscaldamento: lì il numero grosso non inganna.
  const inganno = (fascia > 0 || famiglia !== 'classica') && rng() < 0.5;
  const richiesta: Richiesta = { fascia, dentro, inganno };

  let coppia = GENERATORI[famiglia](richiesta, rng);
  for (const riserva of ['classica', 'mista'] as const) {
    if (coppia !== null || riserva === famiglia) continue;
    famiglia = riserva;
    coppia = GENERATORI[riserva](richiesta, rng);
  }
  if (coppia === null) {
    famiglia = 'classica';
    coppia = [somma(3, 5), somma(2, 4)];
  }

  const [x, y] = rng() < 0.5 ? coppia : [coppia[1], coppia[0]];
  return { a: x, b: y, ingannevole: truccoSbaglia(x, y), famiglia };
}

export function giusta(round: RoundPiuGrande, scelta: Lato): boolean {
  return scelta === 'a' ? round.a.valore > round.b.valore : round.b.valore > round.a.valore;
}

/** Il risultato da mostrare dopo la risposta: "= 16", "= 1,5", "≈ 1,79" (virgola italiana). */
export function risultato(valore: number): string {
  if (Number.isInteger(valore)) return `= ${valore}`;
  const arrotondato = Math.round(valore * 100) / 100;
  return `${arrotondato === valore ? '=' : '≈'} ${String(arrotondato).replace('.', ',')}`;
}

/**
 * Più tempo ai quesiti difficili: la pressione la fa il bonus rapidità, non il panico.
 * Due rapporti si stimano più piano di due prodotti: 1,5 s in più alle divisioni.
 */
export function tempo(d: number, round?: RoundPiuGrande): number {
  return Math.round(4500 + 300 * d) + (round?.famiglia === 'divisione' ? 1500 : 0);
}
