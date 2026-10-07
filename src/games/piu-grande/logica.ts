import type { Rng } from '../../engine/caso.ts';
import { intero, scegli } from '../../engine/caso.ts';

/**
 * "Chi è più grande?" — due espressioni, tocca la maggiore.
 *
 * Regola di papà: un gioco non deve svuotarsi con un solo trucco. Il trucco
 * ovvio qui è "vince chi mostra il numero più grosso": metà dei quesiti sono
 * costruiti apposta perché quel trucco sbagli (`ingannevole`). Per vincere
 * bisogna stimare davvero.
 */

export type Espressione = { testo: string; valore: number; numeri: number[] };
export type Lato = 'a' | 'b';
export type RoundPiuGrande = { a: Espressione; b: Espressione; ingannevole: boolean };

type Costruttore = (rng: Rng) => Espressione;

const somma = (x: number, y: number): Espressione => ({ testo: `${x} + ${y}`, valore: x + y, numeri: [x, y] });
const diff = (x: number, y: number): Espressione => ({ testo: `${x} − ${y}`, valore: x - y, numeri: [x, y] });
const per = (x: number, y: number): Espressione => ({ testo: `${x} × ${y}`, valore: x * y, numeri: [x, y] });

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
    (r) => {
      const p = per(intero(r, 3, 9), intero(r, 3, 9));
      const c = intero(r, 2, 20);
      return { testo: `${p.testo} + ${c}`, valore: p.valore + c, numeri: [...p.numeri, c] };
    },
  ],
  // 4 — prodotti a due cifre, quadrati
  [
    (r) => per(intero(r, 11, 39), intero(r, 11, 39)),
    (r) => per(intero(r, 2, 9), intero(r, 26, 99)),
    (r) => {
      const n = intero(r, 11, 30);
      return { testo: `${n}²`, valore: n * n, numeri: [n] };
    },
  ],
];

/** Quanto possono distare i due valori, in proporzione: più si sale, più sono vicini. */
const DISTANZA_MAX = [0.35, 0.2, 0.12, 0.06, 0.03] as const;

function fasciaPer(d: number, rng: Rng): { fascia: number; dentro: number } {
  const base = Math.min(4, Math.floor(d / 2));
  // Ogni tanto una fascia sotto: un respiro, e il ritmo non è mai piatto.
  const fascia = base > 0 && rng() < 0.2 ? base - 1 : base;
  const dentro = Math.min(1, (d - base * 2) / 2); // 0-1: quanto sei avanti nella fascia
  return { fascia, dentro };
}

/** Il trucco da smontare: "vince chi mostra il numero più grosso". */
function truccoSbaglia(a: Espressione, b: Espressione): boolean {
  const ma = Math.max(...a.numeri);
  const mb = Math.max(...b.numeri);
  if (ma === mb) return false;
  return ma > mb !== a.valore > b.valore;
}

/** Il classico che fa dire "aha": n² contro (n−k)(n+k), che vale sempre n² − k². */
function coppiaQuadrato(rng: Rng): [Espressione, Espressione] {
  const n = intero(rng, 12, 30);
  const k = intero(rng, 1, 3);
  return [{ testo: `${n}²`, valore: n * n, numeri: [n] }, per(n - k, n + k)];
}

export function genera(d: number, rng: Rng): RoundPiuGrande {
  const { fascia, dentro } = fasciaPer(d, rng);
  const costruttori = FASCE[fascia] ?? FASCE[0]!;
  const vogliamoInganno = fascia > 0 && rng() < 0.5;

  let coppia: [Espressione, Espressione] | null = null;
  if (fascia === 4 && rng() < 0.2) coppia = coppiaQuadrato(rng);

  for (let tentativo = 0; coppia === null && tentativo < 600; tentativo++) {
    const x = scegli(rng, costruttori)(rng);
    const y = scegli(rng, costruttori)(rng);
    if (x.valore <= 0 || y.valore <= 0 || x.testo === y.testo) continue;
    // Un numero in comune (8+6 contro 8+3) è un altro trucco: basta guardare
    // l'altro numero, senza calcolare. Si scarta.
    if (x.numeri.some((n) => y.numeri.includes(n)) && tentativo < 450) continue;
    const distanza = Math.abs(x.valore - y.valore);
    const rel = (DISTANZA_MAX[fascia] ?? 0.35) * (1 - 0.4 * dentro);
    const max = Math.max(1, Math.round(Math.max(x.valore, y.valore) * rel));
    if (distanza === 0 || distanza > max) continue;
    // Dopo tanti tentativi si accetta anche senza inganno: meglio un quesito
    // onesto che un ciclo infinito.
    if (truccoSbaglia(x, y) !== vogliamoInganno && tentativo < 450) continue;
    coppia = [x, y];
  }
  if (coppia === null) coppia = [somma(3, 4), somma(2, 4)];

  const [x, y] = rng() < 0.5 ? coppia : [coppia[1], coppia[0]];
  return { a: x, b: y, ingannevole: truccoSbaglia(x, y) };
}

export function giusta(round: RoundPiuGrande, scelta: Lato): boolean {
  return scelta === 'a' ? round.a.valore > round.b.valore : round.b.valore > round.a.valore;
}

/** Più tempo ai quesiti difficili: la pressione la fa il bonus rapidità, non il panico. */
export function tempo(d: number): number {
  return Math.round(4500 + 300 * d);
}
