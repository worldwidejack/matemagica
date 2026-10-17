import type { Rng } from '../../engine/caso.ts';
import { intero, scegli } from '../../engine/caso.ts';

/**
 * "Catena" — un numero di partenza, poi le operazioni scorrono una alla volta.
 * Alla fine: quanto fa? Allena memoria di lavoro e calcolo a mente.
 *
 * Regola di papà: niente scorciatoie. Le risposte sbagliate sono errori tipici
 * (il risultato prima dell'ultimo passo, l'ultimo passo fatto due volte, un
 * passo sbagliato di poco), ma messe in modo da non tradire la giusta.
 *
 * Il trucco da smontare è "guardo solo l'ultima operazione": se tra le risposte
 * ci fosse sempre il risultato prima dell'ultimo passo, basterebbe cercare due
 * risposte legate dall'ultima operazione (24 e 21 dopo un "− 3") e prendere la
 * seconda: indovinava 9 volte su 10 senza fare la catena. Ora le quattro risposte
 * sono sempre DUE coppie legate dall'ultima operazione, e la giusta è a caso il
 * "prima" o il "dopo" della sua coppia: quella scorciatoia indovina 1 volta su 4,
 * come tirare a caso.
 */

export type Op = '+' | '−' | '×' | '÷';
export type Passo = { op: Op; v: number };
export type RoundCatena = {
  inizio: number;
  passi: Passo[];
  risultato: number;
  opzioni: number[];
  msPasso: number;
};

export function applica(x: number, p: Passo): number {
  switch (p.op) {
    case '+':
      return x + p.v;
    case '−':
      return x - p.v;
    case '×':
      return x * p.v;
    case '÷':
      return x / p.v;
  }
}

function passoCasuale(x: number, d: number, rng: Rng): Passo {
  const ops: Op[] = d < 3 ? ['+', '−'] : d < 6 ? ['+', '−', '+', '×'] : ['+', '−', '×', '÷'];
  for (let t = 0; t < 30; t++) {
    const op = scegli(rng, ops);
    const maxAdd = d < 3 ? 9 : d < 6 ? 15 : 30;
    if (op === '+') return { op, v: intero(rng, 1, maxAdd) };
    if (op === '−') {
      const v = intero(rng, 1, maxAdd);
      if (x - v >= 0) return { op, v };
    }
    if (op === '×') {
      const v = intero(rng, 2, d < 6 ? 3 : 5);
      if (x * v <= (d < 6 ? 120 : 400) && x > 0) return { op, v };
    }
    if (op === '÷') {
      const divisori = [2, 3, 4, 5].filter((k) => x > k && x % k === 0);
      if (divisori.length > 0) return { op, v: scegli(rng, divisori) };
    }
  }
  return { op: '+', v: intero(rng, 1, 9) };
}

/** Fisher-Yates: con sort(() => rng() - 0.5) le posizioni non escono alla pari. */
function mescola<T>(rng: Rng, lista: readonly T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Quante volte, fra le risposte, una diventa un'altra con l'ultima operazione. */
export function legami(opzioni: readonly number[], ultimo: Passo): number {
  let n = 0;
  for (const a of opzioni) for (const b of opzioni) if (a !== b && applica(a, ultimo) === b) n++;
  return n;
}

/**
 * Le quattro risposte: la coppia della giusta e un'altra coppia, tutte e due
 * legate dall'ultima operazione. `giustaDopo`: la giusta è il "dopo" della sua
 * coppia (accanto c'è il risultato prima dell'ultimo passo); se no è il "prima"
 * (accanto c'è l'ultimo passo fatto due volte). L'altra coppia parte da un
 * numero sbagliato di poco.
 */
function risposte(x: number, primaUltimo: number, ultimo: Passo, giustaDopo: boolean, rng: Rng): number[] | null {
  const coppia = (a: number): [number, number] | null => {
    const b = applica(a, ultimo);
    return a >= 0 && Number.isInteger(b) && b >= 0 ? [a, b] : null;
  };
  const u = giustaDopo ? primaUltimo : x;
  const sua = coppia(u);
  if (!sua) return null;
  // Lo scarto dell'altra coppia: col ÷ va a multipli del divisore, così il "dopo" resta intero.
  const scarti = ultimo.op === '÷' ? [ultimo.v, 2 * ultimo.v] : ultimo.op === '×' ? [1, 2, 3] : [1, 2, 10];
  const prova = (s: number): number[] | null => {
    const altra = coppia(u + s);
    if (!altra) return null;
    const opzioni = [...sua, ...altra];
    // Quattro numeri diversi e solo i due legami delle due coppie (niente catene di tre).
    return new Set(opzioni).size === 4 && legami(opzioni, ultimo) === 2 ? opzioni : null;
  };
  // L'altra coppia sta sopra o sotto metà e metà: serve che si possa in tutti e due
  // i versi, se no coi numeri piccoli starebbe quasi sempre sopra e la giusta
  // sarebbe di rado la più alta.
  const sopra = scarti.map(prova).filter((o) => o !== null);
  const sotto = scarti.map((k) => prova(-k)).filter((o) => o !== null);
  if (sopra.length === 0 || sotto.length === 0) return null;
  return mescola(rng, scegli(rng, rng() < 0.5 ? sopra : sotto));
}

export function genera(d: number, rng: Rng): RoundCatena {
  const nPassi = Math.min(7, 3 + Math.floor(d / 2.5));
  const msPasso = Math.round(Math.max(650, 1150 - 50 * d));
  for (let t = 0; t < 60; t++) {
    const inizio = intero(rng, d < 3 ? 2 : 5, d < 3 ? 12 : 30);
    const passi: Passo[] = [];
    let x = inizio;
    let primaUltimo = inizio;
    for (let i = 0; i < nPassi; i++) {
      const p = passoCasuale(x, d, rng);
      passi.push(p);
      primaUltimo = x;
      x = applica(x, p);
    }
    // Si tiene la catena solo se vanno bene TUTTI E DUE i modi (giusta "prima" e
    // giusta "dopo"), poi si tira a sorte: così gli scarti non legano il modo
    // all'operazione (col ÷ o col − il "prima" fallisce più spesso).
    const ultimo = passi[passi.length - 1]!;
    const dopo = risposte(x, primaUltimo, ultimo, true, rng);
    const prima = risposte(x, primaUltimo, ultimo, false, rng);
    if (dopo && prima) return { inizio, passi, risultato: x, opzioni: rng() < 0.5 ? dopo : prima, msPasso };
  }
  // Riserva (non esce mai nelle misure): 7 → +5 → ×2 → −3 = 21, coppie 24/21 e 26/23.
  return {
    inizio: 7,
    passi: [
      { op: '+', v: 5 },
      { op: '×', v: 2 },
      { op: '−', v: 3 },
    ],
    risultato: 21,
    opzioni: [26, 21, 23, 24],
    msPasso,
  };
}

export function rivelazione(r: RoundCatena): number {
  return r.msPasso * (r.passi.length + 1) + 250;
}

export function testoPasso(p: Passo): string {
  return `${p.op} ${p.v}`;
}
