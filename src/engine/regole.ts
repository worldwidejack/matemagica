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
export function stelle(e: EsitoPartita, totale: number = PARTITA.round): Stelle {
  const completa = e.roundGiocati >= totale && e.errori < PARTITA.vite;
  if (completa && e.errori <= 1) return 3;
  if (completa) return 2;
  if (e.giuste >= totale / 2) return 1;
  return 0;
}

// ── Rompicapo ────────────────────────────────────────────────────────────

export const ROMPICAPO = {
  roundPredefiniti: 5,
  /** Ogni aiuto usato toglie un quarto dei punti del rompicapo. */
  costoAiuto: 0.25,
  /** Ogni tentativo sbagliato toglie il 15%, fino a un minimo del 40%. */
  costoSbaglio: 0.15,
  /** Risolto pulito (niente aiuti né sbagli): la difficoltà sale di molto. */
  salitaPulita: 0.8,
  salitaSporca: 0.3,
  /** Saltato: la difficoltà scende. */
  discesaSalto: 1.2,
} as const;

export function puntiRompicapo(difficolta: number, aiuti: number, sbagli: number): number {
  const base = 100 + 20 * difficolta;
  const fattore = Math.max(0.4, 1 - ROMPICAPO.costoAiuto * aiuti - ROMPICAPO.costoSbaglio * sbagli);
  return Math.round(base * fattore);
}

export type EsitoRompicapo = {
  punteggio: number;
  risolti: number;
  saltati: number;
  aiutiTotali: number;
  sbagliTotali: number;
  totale: number;
};

/** ★ metà risolti · ★★ tutti risolti · ★★★ tutti, senza aiuti e con al massimo 1 sbaglio. */
export function stelleRompicapo(e: EsitoRompicapo): Stelle {
  if (e.risolti >= e.totale && e.aiutiTotali === 0 && e.sbagliTotali <= 1) return 3;
  if (e.risolti >= e.totale) return 2;
  if (e.risolti >= Math.ceil(e.totale / 2)) return 1;
  return 0;
}

export function diffDopoRompicapo(d: number, risolto: boolean, pulito: boolean): number {
  if (!risolto) return clampDiff(d - ROMPICAPO.discesaSalto);
  return clampDiff(d + (pulito ? ROMPICAPO.salitaPulita : ROMPICAPO.salitaSporca));
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

/** Fascia di difficoltà di un livello del sentiero, decisa con papà. */
export type Limiti = readonly [number, number];

export function dentroLimiti(d: number, limiti?: Limiti): number {
  if (!limiti) return d;
  return Math.max(limiti[0], Math.min(limiti[1], d));
}

/**
 * Bravura dopo una partita giocata dentro una fascia: se hai toccato il tetto
 * della fascia (un livello facile per te), la partita non dice quanto sei
 * bravo davvero, quindi la bravura non scende.
 */
export function bravuraConLimiti(prima: number, calcolata: number, diffGiuste: readonly number[], limiti?: Limiti): number {
  if (!limiti) return calcolata;
  const tetto = diffGiuste.some((d) => d >= limiti[1] - 0.01);
  if (tetto || limiti[1] < prima) return Math.max(prima, calcolata);
  return calcolata;
}

/**
 * `scala` allunga i passi per i giochi con partite corte (Coppie ha 5 griglie
 * invece di 20 quesiti): così ogni gioco si adatta in un numero simile di partite.
 */
export function diffDopoRisposta(
  d: number,
  giusta: boolean,
  rapidita: number,
  p: ParametriAdattivi = ADATTIVO,
  scala = 1,
): number {
  if (!giusta) return clampDiff(d - p.discesa * Math.min(scala, 2));
  return clampDiff(d + (p.salitaBase + p.salitaRapidita * rapidita) * scala);
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
