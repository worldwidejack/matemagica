/** Data model della progressione (piano §3.2). */

import type { MiniGameId } from '@/shell/types';

export type WorldId = string;
export type LoreId = string;

/** Contenuto statico e dichiarativo: vive in src/content, non nel codice. */
export type World = {
  id: WorldId;
  title: string;
  /** Quale cartuccia esegue questo mondo. */
  gameId: MiniGameId;
  /** id del mondo che lo sblocca; null = sempre aperto. */
  unlockedBy: WorldId | null;
  /** Punteggi necessari per 1 / 2 / 3 stelle. */
  starThresholds: [number, number, number];
  /** Lore sbloccata completando questo mondo. */
  loreAfter?: LoreId;
};

export type LoreEntry = {
  id: LoreId;
  title: string;
  /** Testo breve: è un fun-fact tra due partite, non una lezione. */
  body: string;
};

export type Stars = 0 | 1 | 2 | 3;

export type WorldProgress = {
  bestScore: number;
  stars: Stars;
  timesPlayed: number;
  /** ISO string, presente solo se il mondo è stato completato almeno una volta. */
  completedAt?: string;
};

export type Progress = {
  worlds: Record<WorldId, WorldProgress>;
  loreSeen: LoreId[];
  muted: boolean;
};

/**
 * Chiave versionata: permette migrazioni indolori se lo schema cambia.
 * Se cambi la forma di Progress, alza il numero e scrivi la migrazione.
 */
export const PROGRESS_STORAGE_KEY = 'mmg-progress-v1';
