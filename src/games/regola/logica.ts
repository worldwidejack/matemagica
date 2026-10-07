import type { Rng } from '../../engine/caso.ts';
import { intero, scegli } from '../../engine/caso.ts';
import { SEQUENZE_PAPA, type SequenzaScritta } from '../../content/sequenze.ts';

/**
 * "Trova la regola" — una sequenza di numeri: qual è il prossimo?
 * Il più "da matematico" dei giochi: qui papà scrive le sequenze più belle
 * (`src/content/sequenze.ts`), il generatore riempie i buchi.
 *
 * Regola di papà: il trucco da smontare è "aggiungo sempre l'ultima
 * differenza". Funziona solo per le sequenze più facili; dalla fascia 2 in
 * su le famiglie lo fanno sbagliare quasi sempre.
 */

export type RoundRegola = { termini: number[]; risposta: number; regola: string };

type Famiglia = (rng: Rng) => RoundRegola;

/** Costruisce n+1 termini da una funzione indice → valore. */
function daFormula(f: (i: number) => number, regola: string, n = 5): RoundRegola {
  const tutti = Array.from({ length: n + 1 }, (_, i) => f(i));
  return { termini: tutti.slice(0, n), risposta: tutti[n]!, regola };
}

function daRicorrenza(inizio: number[], passo: (prec: number[], i: number) => number, regola: string, n = 5): RoundRegola {
  const tutti = [...inizio];
  while (tutti.length < n + 1) tutti.push(passo(tutti, tutti.length));
  return { termini: tutti.slice(0, n), risposta: tutti[n]!, regola };
}

const FASCE: Famiglia[][] = [
  // 0 — aggiungi sempre lo stesso numero
  [
    (r) => {
      const a = intero(r, 1, 20);
      const k = intero(r, 2, 9);
      return daFormula((i) => a + k * i, `Si aggiunge sempre ${k}.`);
    },
  ],
  // 1 — togli, raddoppia, triplica
  [
    (r) => {
      const k = intero(r, 2, 9);
      const a = k * 6 + intero(r, 0, 20);
      return daFormula((i) => a - k * i, `Si toglie sempre ${k}.`);
    },
    (r) => {
      const a = intero(r, 1, 5);
      const k = scegli(r, [2, 3]);
      return daFormula((i) => a * k ** i, `Ogni numero è ${k === 2 ? 'il doppio' : 'il triplo'} del precedente.`);
    },
  ],
  // 2 — differenze che crescono, quadrati, salti alternati
  [
    (r) => {
      const a = intero(r, 1, 10);
      const k = scegli(r, [1, 2]);
      return daRicorrenza([a], (p, i) => p[i - 1]! + k * i, `Si aggiunge ${k}, poi ${2 * k}, poi ${3 * k}…: il salto cresce di ${k}.`);
    },
    (r) => {
      const s = intero(r, 1, 4);
      return daFormula((i) => (i + s) ** 2, `Sono i quadrati: ${s}×${s}, ${s + 1}×${s + 1}, …`);
    },
    (r) => {
      const a = intero(r, 1, 10);
      const x = intero(r, 2, 6);
      const y = intero(r, 7, 12);
      return daRicorrenza([a], (p, i) => p[i - 1]! + (i % 2 === 1 ? x : y), `I salti si alternano: +${x}, +${y}, +${x}, +${y}…`, 6);
    },
  ],
  // 3 — somma dei due precedenti, triangolari, doppio più uno
  [
    (r) => {
      const a = intero(r, 1, 5);
      const b = intero(r, a, a + 5);
      return daRicorrenza([a, b], (p, i) => p[i - 1]! + p[i - 2]!, 'Ogni numero è la somma dei due precedenti (come Fibonacci).', 6);
    },
    (r) => {
      const s = intero(r, 1, 4);
      return daFormula((i) => ((i + s) * (i + s + 1)) / 2, `Il salto cresce di 1 ogni volta (+${s + 1}, +${s + 2}, …): sono i numeri triangolari.`);
    },
    (r) => {
      const a = intero(r, 1, 4);
      const k = scegli(r, [1, -1]);
      return daRicorrenza([a + 1], (p, i) => p[i - 1]! * 2 + k, `Si raddoppia e si ${k > 0 ? 'aggiunge' : 'toglie'} 1.`);
    },
  ],
  // 4 — cubi, n×(n+1), alternanza di operazioni, primi
  [
    (r) => {
      const s = intero(r, 1, 3);
      return daFormula((i) => (i + s) ** 3, `Sono i cubi: ${s}×${s}×${s}, ${s + 1}×${s + 1}×${s + 1}, …`);
    },
    (r) => {
      const s = intero(r, 1, 5);
      return daFormula((i) => (i + s) * (i + s + 1), `Ogni numero è n × (n+1): ${s}×${s + 1}, ${s + 1}×${s + 2}, …`);
    },
    (r) => {
      const a = intero(r, 2, 6);
      return daRicorrenza([a], (p, i) => (i % 2 === 1 ? p[i - 1]! * 2 : p[i - 1]! - 1), 'Si alternano: ×2, poi −1, poi ×2, poi −1…', 6);
    },
    (r) => {
      const primi = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37];
      const s = intero(r, 0, 5);
      return { termini: primi.slice(s, s + 5), risposta: primi[s + 5]!, regola: 'Sono i numeri primi: divisibili solo per 1 e per sé stessi.' };
    },
  ],
];

function daScritta(s: SequenzaScritta): RoundRegola {
  return { termini: s.termini, risposta: s.risposta, regola: s.regola };
}

export function genera(d: number, rng: Rng): RoundRegola {
  const fascia = Math.min(4, Math.floor(d / 2));
  // Le sequenze di papà hanno la precedenza quando ce ne sono per questa fascia.
  const scritte = SEQUENZE_PAPA.filter((s) => Math.abs(s.difficolta - d) <= 1.5);
  if (scritte.length > 0 && rng() < 0.5) return daScritta(scegli(rng, scritte));
  return scegli(rng, FASCE[fascia] ?? FASCE[0]!)(rng);
}

/** Il trucco: "aggiungo l'ultima differenza". */
export function previsioneTrucco(termini: number[]): number {
  const n = termini.length;
  return termini[n - 1]! + (termini[n - 1]! - termini[n - 2]!);
}

export function differenze(termini: number[]): number[] {
  return termini.slice(1).map((t, i) => t - termini[i]!);
}

export function aiuti(r: RoundRegola): string[] {
  const dd = differenze(r.termini);
  return [
    'Guarda quanto cambia da un numero al successivo.',
    `I salti sono: ${dd.map((x) => (x >= 0 ? `+${x}` : `${x}`)).join('  ')}`,
    r.regola,
  ];
}

export function soluzione(r: RoundRegola): string {
  return `${r.regola} Il prossimo è ${r.risposta}.`;
}
