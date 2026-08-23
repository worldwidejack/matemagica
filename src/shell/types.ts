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

/** Un quesito generato dalla cartuccia. Ogni gioco definisce la propria forma. */
export type Round = unknown;

/** La risposta data dal giocatore. Ogni gioco definisce la propria forma. */
export type Answer = unknown;

export type MiniGameId = 'segni' | 'quadrato';

export type MiniGame<R extends Round = Round, A extends Answer = Answer> = {
  id: MiniGameId;
  /** Nome mostrato in mappa e nella schermata risultato. */
  title: string;
  /** Una riga di istruzioni. Se serve più di una riga, il gioco è troppo complesso. */
  hint: string;

  /** Produce il quesito. `difficulty` arriva da difficultyCurve(combo). */
  generateRound(difficulty: number): R;

  /** La view del round. Riceve il round, restituisce risposte al guscio. */
  RoundView: React.FC<{ round: R; onAnswer: (a: A) => void; disabled: boolean }>;

  checkAnswer(round: R, a: A): boolean;

  /** Come la difficoltà scala col combo. Puro, testabile, senza stato. */
  difficultyCurve(combo: number): number;
};
