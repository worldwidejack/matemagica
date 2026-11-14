import type { GameId } from '../engine/cartuccia.ts';
import { nomeTappa } from './sentiero.ts';

/**
 * «Un giorno intero col gatto»: otto luoghi fatti di matematica, uno per tappa, dall'alba
 * alla notte. Ogni luogo è un'immagine a tutto schermo (public/luoghi/luogo-N.webp, 2:3)
 * con cinque livelli sul sentiero chiaro e un monumento in cima. Cinque livelli nuovi
 * costano un'immagine e una riga qui.
 *
 * I nodi sono in frazioni dell'immagine (0-1): il 1° in basso, il 5° alla porta del
 * monumento. Misurati sui disegni con scripts/nodi-luoghi.py (li disegna sopra per controllo).
 */
export type Punto = { x: number; y: number };

export type Luogo = {
  n: number;
  nome: string;
  /** L'ora del giorno, scritta piccola sotto il nome. */
  ora: string;
  /** Il colore della tappa: ci si gioca dentro. */
  tinta: string;
  /** Il colore del «no» dentro quella tinta: il rosso sparisce sui colori caldi. */
  errore: string;
  file: string;
  nodi: [Punto, Punto, Punto, Punto, Punto];
};

const ROSSO = 'var(--color-pericolo-400)';
const INCHIOSTRO = 'var(--color-inchiostro)';

export const LUOGHI: Luogo[] = [
  {
    n: 1,
    nome: 'La torre',
    ora: 'alba',
    tinta: 'var(--color-luogo-1)',
    errore: INCHIOSTRO,
    file: '/luoghi/luogo-1.webp',
    nodi: [
      { x: 0.52, y: 0.835 },
      { x: 0.522, y: 0.727 },
      { x: 0.356, y: 0.619 },
      { x: 0.655, y: 0.51 },
      { x: 0.653, y: 0.402 },
    ],
  },
  {
    n: 2,
    nome: "L'arco",
    ora: 'mattina',
    tinta: 'var(--color-luogo-2)',
    errore: ROSSO,
    file: '/luoghi/luogo-2.webp',
    nodi: [
      { x: 0.523, y: 0.835 },
      { x: 0.496, y: 0.726 },
      { x: 0.363, y: 0.617 },
      { x: 0.645, y: 0.508 },
      { x: 0.613, y: 0.399 },
    ],
  },
  {
    n: 3,
    nome: 'La tartaruga',
    ora: 'mezzogiorno',
    tinta: 'var(--color-luogo-3)',
    errore: ROSSO,
    file: '/luoghi/luogo-3.webp',
    nodi: [
      { x: 0.581, y: 0.835 },
      { x: 0.441, y: 0.731 },
      { x: 0.449, y: 0.626 },
      { x: 0.621, y: 0.522 },
      { x: 0.592, y: 0.418 },
    ],
  },
  {
    n: 4,
    nome: "L'obelisco",
    ora: 'primo pomeriggio',
    tinta: 'var(--color-luogo-4)',
    errore: INCHIOSTRO,
    file: '/luoghi/luogo-4.webp',
    nodi: [
      { x: 0.515, y: 0.835 },
      { x: 0.488, y: 0.735 },
      { x: 0.365, y: 0.635 },
      { x: 0.623, y: 0.535 },
      { x: 0.583, y: 0.435 },
    ],
  },
  {
    n: 5,
    nome: "L'albero",
    ora: 'pomeriggio',
    tinta: 'var(--color-luogo-5)',
    errore: ROSSO,
    file: '/luoghi/luogo-5.webp',
    nodi: [
      { x: 0.539, y: 0.835 },
      { x: 0.507, y: 0.735 },
      { x: 0.337, y: 0.634 },
      { x: 0.669, y: 0.534 },
      { x: 0.598, y: 0.433 },
    ],
  },
  {
    n: 6,
    nome: "L'anello",
    ora: 'tramonto',
    tinta: 'var(--color-luogo-6)',
    errore: INCHIOSTRO,
    file: '/luoghi/luogo-6.webp',
    nodi: [
      { x: 0.525, y: 0.835 },
      { x: 0.554, y: 0.739 },
      { x: 0.319, y: 0.642 },
      { x: 0.667, y: 0.546 },
      { x: 0.553, y: 0.45 },
    ],
  },
  {
    n: 7,
    nome: 'La leva',
    ora: 'crepuscolo',
    tinta: 'var(--color-luogo-7)',
    errore: ROSSO,
    file: '/luoghi/luogo-7.webp',
    nodi: [
      { x: 0.571, y: 0.835 },
      { x: 0.449, y: 0.739 },
      { x: 0.367, y: 0.643 },
      { x: 0.659, y: 0.547 },
      { x: 0.576, y: 0.451 },
    ],
  },
  {
    n: 8,
    nome: "L'osservatorio",
    ora: 'notte',
    tinta: 'var(--color-luogo-8)',
    errore: ROSSO,
    file: '/luoghi/luogo-8.webp',
    nodi: [
      { x: 0.52, y: 0.835 },
      { x: 0.538, y: 0.732 },
      { x: 0.329, y: 0.63 },
      { x: 0.675, y: 0.527 },
      { x: 0.593, y: 0.425 },
    ],
  },
];

/**
 * Il luogo della tappa `n` (1, 2, …). Oltre l'ottava il viaggio continua fra le
 * costellazioni: si guardano dall'osservatorio, quindi resta la sua notte.
 */
export function luogoDellaTappa(n: number): Luogo {
  const ultimo = LUOGHI[LUOGHI.length - 1] as Luogo;
  return LUOGHI[n - 1] ?? ultimo;
}

/** Il nome della tappa: quello del luogo, o della costellazione oltre l'ottava. */
export function nomeDellaTappa(n: number): string {
  return LUOGHI[n - 1]?.nome ?? nomeTappa(n);
}

/** L'ora del luogo, o «tra le stelle» oltre l'ottava tappa. */
export function oraDellaTappa(n: number): string {
  return LUOGHI[n - 1]?.ora ?? 'tra le stelle';
}

/** Come si chiama la tappa `n` nelle etichette corte. */
export function titoloTappa(n: number): string {
  return `Luogo ${n}`;
}

/** «al luogo 3», per le frasi. */
export function versoTappa(n: number): string {
  return `al luogo ${n}`;
}

/**
 * Il colore in cui si gioca e il luogo che ci sta dietro, tono su tono (index.css, .tinta):
 * il monumento resta in alto, dove le schermate di gioco sono vuote.
 */
export type Colore = { tinta: string; errore: string; fondo: string };

/** Il colore in cui si gioca un livello della tappa `n`. */
export function tintaDellaTappa(n: number): Colore {
  const l = luogoDellaTappa(n);
  return { tinta: l.tinta, errore: l.errore, fondo: l.file };
}

/**
 * In Palestra ogni gioco ha il suo colore, lo stesso della sua tessera
 * (public/giochi/<id>.webp).
 */
const LUOGO_DEL_GIOCO: Record<GameId, number> = {
  bersaglio: 1,
  bilancia: 2,
  catena: 3,
  coppie: 4,
  misto: 5,
  'piu-grande': 6,
  quadrato: 7,
  regola: 8,
  stima: 2,
};

export function tintaDelGioco(g: GameId): Colore {
  return tintaDellaTappa(LUOGO_DEL_GIOCO[g]);
}
