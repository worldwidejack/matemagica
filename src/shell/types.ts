import type { FC } from 'react';

/**
 * Il contratto "cartuccia" (piano §3.3).
 *
 * Il GameShell possiede timer, vite, combo, punteggio, suoni, schermata
 * risultato e assegnazione stelle. Un minigioco NON gestisce nulla di tutto
 * questo: implementa solo l'interfaccia qui sotto. È la decisione che rende
 * il mondo 3+ un lavoro di puro contenuto.
 *
 * Regola pratica: se stai per scrivere un timer o un contatore di vite dentro
 * src/games/*, stai sbagliando file.
 */

export type MiniGameId = 'segni' | 'quadrato';

export type RoundViewProps<R, A> = {
  round: R;
  /** La cartuccia chiama questa quando il giocatore risponde. */
  onAnswer: (a: A) => void;
  /** true durante il feedback: la view deve smettere di accettare input. */
  locked: boolean;
  /** Presente solo durante il feedback, per evidenziare la risposta data. */
  given: A | null;
  /** true se la risposta data era giusta (solo durante il feedback). */
  correct: boolean | null;
};

export type MiniGame<R = unknown, A = unknown> = {
  id: MiniGameId;
  /** Nome mostrato in mappa e nella schermata risultato. */
  title: string;
  /** Una riga di istruzioni. Se serve più di una riga, il gioco è troppo complesso. */
  hint: string;

  /** Produce il quesito. `difficulty` arriva da difficultyCurve(combo). */
  generateRound(difficulty: number): R;

  RoundView: FC<RoundViewProps<R, A>>;

  checkAnswer(round: R, a: A): boolean;

  /** Come la difficoltà scala col combo. Puro, testabile, senza stato. */
  difficultyCurve(combo: number): number;
};

/** Esito di una partita, passato a chi ha montato il guscio. */
export type GameResult = {
  score: number;
  maxCombo: number;
  rounds: number;
  stars: 0 | 1 | 2 | 3;
};

/** Regole di punteggio: vivono nel guscio, uguali per tutti i minigiochi. */
export const SCORING = {
  lives: 3,
  basePoints: 100,
  /** Il moltiplicatore sale di 1 ogni N risposte giuste di fila, fino a max. */
  comboStep: 4,
  maxMultiplier: 5,
  /** Secondi per round: parte da `timeMax`, scende verso `timeMin` col crescere della difficoltà. */
  timeMax: 6,
  timeMin: 2.4,
  /** Quanto pesa la rapidità: bonus = secondi rimasti × questo. */
  speedBonus: 12,
} as const;

/** Tempo concesso per un round, in millisecondi. */
export function timeForRound(difficulty: number): number {
  const t = SCORING.timeMax - (SCORING.timeMax - SCORING.timeMin) * Math.min(difficulty / 8, 1);
  return Math.round(t * 1000);
}

export function multiplierFor(combo: number): number {
  return Math.min(1 + Math.floor(combo / SCORING.comboStep), SCORING.maxMultiplier);
}

export function pointsFor(combo: number, msLeft: number): number {
  const speed = Math.round((msLeft / 1000) * SCORING.speedBonus);
  return (SCORING.basePoints + speed) * multiplierFor(combo);
}

export function starsFor(score: number, thresholds: readonly [number, number, number]): 0 | 1 | 2 | 3 {
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  if (score >= thresholds[0]) return 1;
  return 0;
}
