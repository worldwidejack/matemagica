import type { GameId } from '@/engine/cartuccia';
import type { Stelle } from '@/engine/regole';
import { SENTIERO, type Livello } from '@/content/sentiero';

/**
 * Regole di sblocco, calcolate dal profilo (niente stato in più da salvare):
 * un livello si apre quando il precedente ha almeno una stella; un gioco
 * entra in Palestra quando lo incontri in un livello aperto.
 */
export function livelloAperto(i: number, stelle: Record<string, Stelle>): boolean {
  if (i === 0) return true;
  const prec = SENTIERO[i - 1];
  return prec !== undefined && (stelle[prec.id] ?? 0) > 0;
}

/** Indice del primo livello aperto e senza stelle: è "dove sei arrivato". */
export function livelloCorrente(stelle: Record<string, Stelle>): number {
  const i = SENTIERO.findIndex((l) => (stelle[l.id] ?? 0) === 0);
  return i < 0 ? SENTIERO.length - 1 : i;
}

export function primoLivelloDi(g: GameId): Livello | undefined {
  return SENTIERO.find((l) => l.gioco === g);
}

export function giocoSbloccato(g: GameId, stelle: Record<string, Stelle>): boolean {
  const l = primoLivelloDi(g);
  return l !== undefined && livelloAperto(l.numero - 1, stelle);
}

export function livelloDiStoria(id: string): Livello | undefined {
  return SENTIERO.find((l) => l.storia === id);
}
