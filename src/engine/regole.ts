/**
 * Le regole della partita arcade, uguali per tutti i giochi.
 *
 * Funzioni pure, senza React: le usa il motore e le usa `scripts/simula.ts`
 * per tarare i numeri su migliaia di partite simulate. Per questo qui gli
 * import sono relativi con estensione `.ts` (li legge anche Node, non solo Vite).
 */

/** Difficoltà continua: 0 = primo giorno, 10 = sfida da matematico. */
export const DIFF_MAX = 10;

export const PARTITA = {
  vite: 3,
  /** Una partita "completa" sono 20 quesiti: ~1-2 minuti, il tempo di una fila. */
  round: 20,
  /** Il moltiplicatore sale di 1 ogni N risposte giuste di fila. */
  passoCombo: 4,
  maxMoltiplicatore: 4,
} as const;

export function clampDiff(d: number): number {
  return Math.max(0, Math.min(DIFF_MAX, d));
}

export function moltiplicatore(combo: number): number {
  return Math.min(1 + Math.floor(combo / PARTITA.passoCombo), PARTITA.maxMoltiplicatore);
}

/**
 * Punti di una risposta giusta. Valgono di più i quesiti difficili e le
 * risposte rapide: chi è più bravo fa più punti, ma le stelle (sotto) no.
 * `rapidita` va da 0 (all'ultimo istante) a 1 (istantanea).
 */
export function punti(difficolta: number, rapidita: number, combo: number): number {
  const base = 50 + 10 * difficolta;
  return Math.round(base * (1 + rapidita)) * moltiplicatore(combo);
}

export type Stelle = 0 | 1 | 2 | 3;

export type EsitoPartita = {
  punteggio: number;
  giuste: number;
  errori: number;
  roundGiocati: number;
  comboMax: number;
};

/**
 * Le stelle NON dipendono dal punteggio ma da come hai giocato al TUO livello:
 * la difficoltà si adatta, quindi un principiante e un matematico possono
 * prendere 3 stelle entrambi. È la promessa "per tutti".
 */
export function stelle(e: EsitoPartita): Stelle {
  const completa = e.roundGiocati >= PARTITA.round && e.errori < PARTITA.vite;
  if (completa && e.errori <= 1) return 3;
  if (completa) return 2;
  if (e.giuste >= PARTITA.round / 2) return 1;
  return 0;
}

/**
 * Livello che si adatta mentre giochi.
 * Giusta → la difficoltà sale (di più se rapida). Sbagliata → scende di colpo.
 * L'obiettivo è tenere il giocatore dove sbaglia ogni tanto, non mai e non sempre.
 */
export type ParametriAdattivi = {
  salitaBase: number;
  salitaRapidita: number;
  discesa: number;
  /** Quanto la partita appena giocata sposta la bravura salvata (0-1). */
  peso: number;
  /** La partita parte un po' sotto la bravura: riscaldamento. */
  riscaldamento: number;
};

export const ADATTIVO: ParametriAdattivi = {
  // Tarati con `npm run simula`: errore ogni ~8 quesiti, bravura giusta in ~5 partite.
  salitaBase: 0.1,
  salitaRapidita: 0.2,
  discesa: 1.6,
  peso: 0.7,
  riscaldamento: 1,
};

export function diffIniziale(bravura: number, p: ParametriAdattivi = ADATTIVO): number {
  return clampDiff(bravura - p.riscaldamento);
}

export function diffDopoRisposta(
  d: number,
  giusta: boolean,
  rapidita: number,
  p: ParametriAdattivi = ADATTIVO,
): number {
  if (!giusta) return clampDiff(d - p.discesa);
  return clampDiff(d + p.salitaBase + p.salitaRapidita * rapidita);
}

/**
 * Bravura salvata dopo una partita: si avvicina alla difficoltà più alta a cui
 * hai risposto giusto (meno mezzo punto). Con la media, un giocatore forte
 * impiegava 15 partite di roba facile per arrivare al suo livello: noia.
 * Senza risposte giuste, scende di 1.
 */
export function bravuraDopoPartita(
  bravura: number,
  diffGiuste: readonly number[],
  p: ParametriAdattivi = ADATTIVO,
): number {
  if (diffGiuste.length === 0) return clampDiff(bravura - 1);
  const vetta = Math.max(...diffGiuste) - 0.5;
  return clampDiff(bravura + p.peso * (vetta - bravura));
}
