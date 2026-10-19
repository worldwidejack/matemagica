/**
 * Sequenze scritte a mano per "Trova la regola". QUI SCRIVE PAPÀ: le sue
 * sequenze preferite hanno la precedenza su quelle generate.
 *
 * `difficolta` va da 0 (primo giorno) a 10 (sfida da matematico).
 * Le prime due sono di papà (risposte del 16/10/2026, a mano); le altre sono
 * bozze di Claude, da sostituire o correggere con lui.
 */
export type SequenzaScritta = {
  termini: number[];
  risposta: number;
  regola: string;
  difficolta: number;
  autore: 'papà' | 'bozza';
};

export const SEQUENZE_PAPA: SequenzaScritta[] = [
  // ── Di papà (16/10/2026) ──
  {
    termini: [3, 6, 7, 14, 15, 30],
    risposta: 31,
    regola: 'A turno: si raddoppia e poi si aggiunge 1 (×2, +1, ×2, +1…).',
    // Due operazioni che si alternano, come la famiglia generata "×2, −1" (fascia alta).
    // La regola compare come terzo aiuto: non deve contenere la risposta.
    difficolta: 7,
    autore: 'papà',
  },
  {
    termini: [2, 3, 5, 9, 17, 33],
    risposta: 65,
    regola: 'Ogni numero diventa il doppio meno 1: 2 → 3 → 5 → 9… (e i salti raddoppiano: +1, +2, +4…).',
    // Una regola sola, e i salti che raddoppiano la tradiscono: come "si raddoppia e si toglie 1".
    difficolta: 6,
    autore: 'papà',
  },
  // ── Bozze di Claude ──
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
