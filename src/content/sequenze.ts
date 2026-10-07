/**
 * Sequenze scritte a mano per "Trova la regola". QUI SCRIVE PAPÀ: le sue
 * sequenze preferite hanno la precedenza su quelle generate.
 *
 * `difficolta` va da 0 (primo giorno) a 10 (sfida da matematico).
 * Le prime sono bozze di Claude, da sostituire o correggere con papà.
 */
export type SequenzaScritta = {
  termini: number[];
  risposta: number;
  regola: string;
  difficolta: number;
  autore: 'papà' | 'bozza';
};

export const SEQUENZE_PAPA: SequenzaScritta[] = [
  {
    termini: [1, 4, 9, 16, 25],
    risposta: 36,
    regola: 'Sono i quadrati: 1×1, 2×2, 3×3…',
    difficolta: 4,
    autore: 'bozza',
  },
  {
    termini: [1, 1, 2, 3, 5, 8],
    risposta: 13,
    regola: 'La sequenza di Fibonacci: ogni numero è la somma dei due precedenti.',
    difficolta: 6,
    autore: 'bozza',
  },
  {
    termini: [2, 6, 12, 20, 30],
    risposta: 42,
    regola: '1×2, 2×3, 3×4, 4×5, 5×6… e poi 6×7.',
    difficolta: 7,
    autore: 'bozza',
  },
  {
    termini: [1, 2, 4, 7, 11, 16],
    risposta: 22,
    regola: 'Si aggiunge 1, poi 2, poi 3, poi 4…',
    difficolta: 4,
    autore: 'bozza',
  },
  {
    termini: [1, 11, 21, 1211, 111221],
    risposta: 312211,
    regola: '"Guarda e racconta": ogni numero descrive il precedente. 1 → "un 1" → 11 → "due 1" → 21…',
    difficolta: 10,
    autore: 'bozza',
  },
];
