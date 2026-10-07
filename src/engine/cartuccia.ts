import type { FC } from 'react';
import type { Rng } from './caso.ts';

/**
 * Il contratto "cartuccia".
 *
 * Il motore possiede timer, vite, combo, punteggio, suoni, stelle e livello
 * adattivo. Un gioco fornisce SOLO: genera il quesito a una difficoltà,
 * lo disegna, controlla la risposta.
 *
 * Regola pratica: se stai per scrivere un timer o un contatore di vite dentro
 * src/games/*, stai sbagliando file.
 */

export type GameId =
  | 'piu-grande'
  | 'coppie'
  | 'catena'
  | 'stima'
  | 'bersaglio'
  | 'bilancia'
  | 'regola';

// ── Arcade: a tempo, vite, combo ─────────────────────────────────────────

export type ArcadeViewProps<R, A> = {
  round: R;
  /** Il gioco la chiama quando il giocatore dà la risposta finale del quesito. */
  onAnswer: (a: A) => void;
  /**
   * Risposta parziale giusta: punti e combo, ma il quesito continua
   * (es. una coppia trovata nella griglia di Coppie magiche).
   */
  onHit: () => void;
  /** Risposta parziale sbagliata: costa una vita e il combo, ma il quesito continua. */
  onMiss: () => void;
  /** true durante la rivelazione e il feedback: niente input. */
  locked: boolean;
  /** Fase di rivelazione in corso (es. Catena mostra le operazioni). */
  revealing: boolean;
  /** Presenti solo durante il feedback. */
  given: A | null;
  correct: boolean | null;
};

export type ArcadeGame<R, A> = {
  id: GameId;
  mode: 'arcade';
  title: string;
  /** Una riga. Se ne serve più di una, il gioco è troppo complicato. */
  hint: string;
  generate(difficulty: number, rng: Rng): R;
  View: FC<ArcadeViewProps<R, A>>;
  check(round: R, a: A): boolean;
  /** Millisecondi concessi per rispondere. */
  timeFor(round: R, difficulty: number): number;
  /** Millisecondi di rivelazione prima che parta il timer. Default 0. */
  revealFor?(round: R): number;
  /** Quesiti per partita. Default 20; meno per i quesiti lunghi (una griglia intera). */
  roundPerPartita?: number;
};

// ── Rompicapo: niente timer né vite, si ragiona ──────────────────────────

export type PuzzleViewProps<R, A> = {
  round: R;
  /** Il giocatore propone una soluzione: il motore la controlla. */
  onTry: (a: A) => void;
  /** true dopo la soluzione o durante il feedback. */
  locked: boolean;
  /** Cresce a ogni tentativo sbagliato: la vista può reagire (scossa, reset). */
  sbagli: number;
  /** true quando il rompicapo è risolto (o saltato): la vista può mostrare la soluzione. */
  risolto: boolean;
};

export type PuzzleGame<R, A> = {
  id: GameId;
  mode: 'puzzle';
  title: string;
  hint: string;
  generate(difficulty: number, rng: Rng): R;
  View: FC<PuzzleViewProps<R, A>>;
  check(round: R, a: A): boolean;
  /** Aiuti progressivi: `aiuti(round)[i]` è l'i-esimo aiuto. */
  aiuti(round: R): string[];
  /** La spiegazione mostrata a rompicapo risolto o saltato: il momento "aha". */
  soluzione(round: R): string;
  /** Rompicapi per partita. Default 5. */
  roundPerPartita?: number;
};
