import type { Rng } from '../../engine/caso.ts';
import { intero, scegli } from '../../engine/caso.ts';

/**
 * "Coppie magiche" — griglia di numeri: tocca due numeri che insieme fanno
 * l'obiettivo. Il più "Candy Crush" dei giochi.
 *
 * Regola di papà: il trucco ovvio è "l'ultima coppia è obbligata, la prendo
 * senza pensare". Per questo dalla fascia 1 in su ci sono numeri esca, che non
 * hanno compagno: fino all'ultimo bisogna controllare.
 */

export type Tipo = 'somma' | 'prodotto';
export type Cella = { id: number; n: number };
export type RoundCoppie = { tipo: Tipo; obiettivo: number; celle: Cella[]; coppie: number };

export function compagno(tipo: Tipo, obiettivo: number, n: number): number | null {
  if (tipo === 'somma') return obiettivo - n > 0 ? obiettivo - n : null;
  return obiettivo % n === 0 ? obiettivo / n : null;
}

export function formano(r: Pick<RoundCoppie, 'tipo' | 'obiettivo'>, a: number, b: number): boolean {
  return r.tipo === 'somma' ? a + b === r.obiettivo : a * b === r.obiettivo;
}

type Ricetta = { tipo: Tipo; obiettivo: number; coppie: number; esche: number; coppia: (r: Rng) => [number, number] };

function sommaA(obiettivo: number, min: number): (r: Rng) => [number, number] {
  return (r) => {
    const a = intero(r, min, obiettivo - min);
    return [a, obiettivo - a];
  };
}

function prodottoA(obiettivo: number): (r: Rng) => [number, number] {
  const divisori: number[] = [];
  for (let k = 2; k * k <= obiettivo; k++) if (obiettivo % k === 0) divisori.push(k);
  return (r) => {
    const a = scegli(r, divisori);
    return r() < 0.5 ? [a, obiettivo / a] : [obiettivo / a, a];
  };
}

function ricetta(d: number, rng: Rng): Ricetta {
  const fascia = Math.min(4, Math.floor(d / 2));
  switch (fascia) {
    case 0:
      return { tipo: 'somma', obiettivo: 10, coppie: 4, esche: 1, coppia: sommaA(10, 1) };
    case 1: {
      const obiettivo = scegli(rng, [10, 20]);
      return { tipo: 'somma', obiettivo, coppie: 5, esche: 2, coppia: sommaA(obiettivo, 1) };
    }
    case 2:
      return { tipo: 'somma', obiettivo: 100, coppie: 5, esche: 2, coppia: sommaA(100, 6) };
    case 3: {
      const obiettivo = scegli(rng, [24, 36, 48, 60]);
      return { tipo: 'prodotto', obiettivo, coppie: 5, esche: 2, coppia: prodottoA(obiettivo) };
    }
    default: {
      if (rng() < 0.5) {
        const obiettivo = scegli(rng, [72, 96, 120, 144]);
        return { tipo: 'prodotto', obiettivo, coppie: 5, esche: 3, coppia: prodottoA(obiettivo) };
      }
      return { tipo: 'somma', obiettivo: 1000, coppie: 5, esche: 3, coppia: sommaA(1000, 105) };
    }
  }
}

function mescola<T>(rng: Rng, lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function genera(d: number, rng: Rng): RoundCoppie {
  const r = ricetta(d, rng);
  const numeri: number[] = [];
  for (let i = 0; i < r.coppie; i++) numeri.push(...r.coppia(rng));

  // Esche: numeri plausibili il cui compagno NON è in griglia.
  const max = r.tipo === 'somma' ? r.obiettivo - 1 : Math.min(r.obiettivo, 30);
  let tentativi = 0;
  const esche: number[] = [];
  while (esche.length < r.esche && tentativi++ < 500) {
    const n = intero(rng, r.tipo === 'somma' ? Math.max(1, Math.round(r.obiettivo * 0.05)) : 2, max);
    const c = compagno(r.tipo, r.obiettivo, n);
    const tutti = [...numeri, ...esche];
    if (c !== null && tutti.includes(c)) continue;
    if (tutti.includes(n)) continue;
    if (esche.some((e) => compagno(r.tipo, r.obiettivo, e) === n)) continue;
    esche.push(n);
  }

  const celle = mescola(rng, [...numeri, ...esche]).map((n, id) => ({ id, n }));
  return { tipo: r.tipo, obiettivo: r.obiettivo, celle, coppie: r.coppie };
}

/** Una griglia dura più di un quesito secco: tempo per coppia, che si stringe col livello. */
export function tempo(r: RoundCoppie, d: number): number {
  return Math.round(2500 + r.coppie * Math.max(1700, 3200 - 140 * d));
}
