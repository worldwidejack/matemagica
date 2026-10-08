/**
 * Le medaglie: traguardi a tre gradi (bronzo, argento, oro), come i
 * "riconoscimenti" di Duolingo. Si calcolano dal profilo: niente stato in più.
 * Funzioni pure, così le legge anche Node.
 */
import type { GameId } from '../engine/cartuccia.ts';
import type { Stelle } from '../engine/regole.ts';
import { SENTIERO_BASE } from '../content/sentiero.ts';

/** Contatori di sempre, aggiornati a ogni partita. */
export type Statistiche = {
  giuste: number;
  rompicapoRisolti: number;
  /** Rompicapo risolti senza aiuti né sbagli. */
  puliti: number;
  comboMax: number;
  streakMax: number;
  treStelle: number;
  sfide: number;
  /** Partite giocate tra mezzanotte e le 5. */
  notturne: number;
  partitePerGioco: Partial<Record<GameId, number>>;
};

export const STAT_VUOTE: Statistiche = {
  giuste: 0,
  rompicapoRisolti: 0,
  puliti: 0,
  comboMax: 0,
  streakMax: 0,
  treStelle: 0,
  sfide: 0,
  notturne: 0,
  partitePerGioco: {},
};

/** Quello che serve per calcolare le medaglie: un pezzo del profilo. */
export type DatiMedaglie = {
  stat: Statistiche;
  partite: number;
  xp: number;
  livello: number;
  carte: number;
  stelleLivelli: Record<string, Stelle>;
};

export type Medaglia = {
  id: string;
  nome: string;
  icona: string;
  /** Cosa misura, con {n} al posto della soglia. */
  descrizione: string;
  /** Tre soglie crescenti; la prima mai 1, così la frase resta al plurale. */
  soglie: readonly [number, number, number];
  valore: (d: DatiMedaglie) => number;
};

function tappeComplete(s: Record<string, Stelle>, minimo: Stelle = 1): number {
  let n = 0;
  for (let t = 0; t * 5 < SENTIERO_BASE.length; t++) {
    const livelli = SENTIERO_BASE.slice(t * 5, t * 5 + 5);
    if (livelli.length === 5 && livelli.every((l) => (s[l.id] ?? 0) >= minimo)) n++;
  }
  return n;
}

export const MEDAGLIE: Medaglia[] = [
  {
    id: 'fiamma',
    nome: 'Fiamma viva',
    icona: '🔥',
    descrizione: 'Gioca {n} giorni di fila',
    soglie: [3, 7, 30],
    valore: (d) => d.stat.streakMax,
  },
  {
    id: 'viaggiatore',
    nome: 'Viaggiatore',
    icona: '🧭',
    descrizione: 'Completa {n} tappe del sentiero',
    soglie: [2, 4, 8],
    valore: (d) => tappeComplete(d.stelleLivelli),
  },
  {
    id: 'perfezionista',
    nome: 'Perfezionista',
    icona: '💎',
    descrizione: 'Prendi 3 stelle in {n} partite',
    soglie: [3, 15, 50],
    valore: (d) => d.stat.treStelle,
  },
  {
    id: 'combo',
    nome: 'Inarrestabile',
    icona: '⚡',
    descrizione: 'Fai una combo da {n}',
    soglie: [10, 20, 40],
    valore: (d) => d.stat.comboMax,
  },
  {
    id: 'pensatore',
    nome: 'Pensatore',
    icona: '🧠',
    descrizione: 'Risolvi {n} rompicapo senza aiuti',
    soglie: [5, 25, 100],
    valore: (d) => d.stat.puliti,
  },
  {
    id: 'calcolatore',
    nome: 'Calcolatore',
    icona: '🧮',
    descrizione: 'Dai {n} risposte giuste',
    soglie: [100, 500, 2000],
    valore: (d) => d.stat.giuste + d.stat.rompicapoRisolti,
  },
  {
    id: 'esploratore',
    nome: 'Esploratore',
    icona: '🗺️',
    descrizione: 'Gioca a {n} giochi diversi',
    soglie: [3, 6, 9],
    valore: (d) => Object.keys(d.stat.partitePerGioco).length,
  },
  {
    id: 'collezionista',
    nome: 'Collezionista',
    icona: '🃏',
    descrizione: 'Vinci {n} carte della collezione',
    soglie: [2, 5, 8],
    valore: (d) => d.carte,
  },
  {
    id: 'sfidante',
    nome: 'Sfidante',
    icona: '📅',
    descrizione: 'Gioca {n} sfide del giorno',
    soglie: [3, 10, 30],
    valore: (d) => d.stat.sfide,
  },
  {
    id: 'mago',
    nome: 'Apprendista mago',
    icona: '🪄',
    descrizione: 'Arriva al livello {n}',
    soglie: [5, 10, 20],
    valore: (d) => d.livello,
  },
  {
    id: 'gufo',
    nome: 'Gufo',
    icona: '🦉',
    descrizione: 'Gioca {n} partite dopo mezzanotte',
    soglie: [3, 15, 50],
    valore: (d) => d.stat.notturne,
  },
];

export const NOMI_GRADO = ['', 'bronzo', 'argento', 'oro'] as const;

/** Grado raggiunto: 0 = niente, 1 bronzo, 2 argento, 3 oro. */
export function grado(m: Medaglia, d: DatiMedaglie): 0 | 1 | 2 | 3 {
  const v = m.valore(d);
  return v >= m.soglie[2] ? 3 : v >= m.soglie[1] ? 2 : v >= m.soglie[0] ? 1 : 0;
}

/** La prossima soglia da raggiungere (o l'ultima, se hai già l'oro). */
export function prossimaSoglia(m: Medaglia, d: DatiMedaglie): number {
  const g = grado(m, d);
  return m.soglie[Math.min(g, 2)] ?? m.soglie[2];
}

export type MedagliaNuova = { medaglia: Medaglia; grado: 1 | 2 | 3 };

/** Medaglie che salgono di grado passando da `prima` a `dopo`. */
export function medaglieNuove(prima: DatiMedaglie, dopo: DatiMedaglie): MedagliaNuova[] {
  const nuove: MedagliaNuova[] = [];
  for (const m of MEDAGLIE) {
    const g = grado(m, dopo);
    if (g > grado(m, prima) && g > 0) nuove.push({ medaglia: m, grado: g as 1 | 2 | 3 });
  }
  return nuove;
}
