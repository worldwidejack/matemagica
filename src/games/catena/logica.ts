import type { Rng } from '../../engine/caso.ts';
import { intero, scegli } from '../../engine/caso.ts';

/**
 * "Catena" — un numero di partenza, poi le operazioni scorrono una alla volta.
 * Alla fine: quanto fa? Allena memoria di lavoro e calcolo a mente.
 *
 * Regola di papà: niente scorciatoie tipo "guardo solo l'ultima operazione".
 * Le risposte sbagliate proposte sono proprio gli errori tipici: il risultato
 * prima dell'ultimo passo, o sbagliato di poco.
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

function applica(x: number, p: Passo): number {
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

export function genera(d: number, rng: Rng): RoundCatena {
  const nPassi = Math.min(7, 3 + Math.floor(d / 2.5));
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

  // Distrattori: sempre l'errore tipico (il risultato prima dell'ultimo passo),
  // poi numeri vicini al risultato.
  const opzioni = new Set<number>([x]);
  if (primaUltimo !== x) opzioni.add(primaUltimo);
  const vicini = [x + 1, x - 1, x + 2, x - 2, x + 10, x - 10];
  for (const c of vicini.sort(() => rng() - 0.5)) {
    if (opzioni.size >= 4) break;
    if (c >= 0 && c !== x) opzioni.add(c);
  }
  while (opzioni.size < 4) opzioni.add(x + opzioni.size * 3);

  return {
    inizio,
    passi,
    risultato: x,
    opzioni: [...opzioni].sort(() => rng() - 0.5),
    msPasso: Math.round(Math.max(650, 1150 - 50 * d)),
  };
}

export function rivelazione(r: RoundCatena): number {
  return r.msPasso * (r.passi.length + 1) + 250;
}

export function testoPasso(p: Passo): string {
  return `${p.op} ${p.v}`;
}
