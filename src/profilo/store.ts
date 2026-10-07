import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameId } from '@/engine/cartuccia';
import type { Stelle } from '@/engine/regole';
import { giornoLocale, livelloDa, streakDopoPartita, xpDaPartita, type Streak } from './progressione';

/**
 * Il profilo del giocatore, salvato nel telefono (localStorage).
 * Niente account, niente server: si gioca e basta.
 */
type Profilo = {
  xp: number;
  /** Bravura per gioco, 0-10: da qui parte la difficoltà della prossima partita. */
  bravura: Partial<Record<GameId, number>>;
  record: Partial<Record<GameId, number>>;
  stelleMigliori: Partial<Record<GameId, Stelle>>;
  partite: number;
  streak: Streak;
  muto: boolean;
};

export type RiepilogoPartita = {
  xpGuadagnati: number;
  livelloPrima: number;
  livelloDopo: number;
  bravuraPrima: number;
  bravuraDopo: number;
  recordPrima: number;
  streak: number;
};

type Azioni = {
  registraPartita: (p: {
    gioco: GameId;
    punteggio: number;
    stelle: Stelle;
    bravuraDopo: number;
  }) => RiepilogoPartita;
  setMuto: (muto: boolean) => void;
};

const INIZIALE: Profilo = {
  xp: 0,
  bravura: {},
  record: {},
  stelleMigliori: {},
  partite: 0,
  streak: { giorni: 0, ultimoGiorno: null },
  muto: false,
};

export const useProfilo = create<Profilo & Azioni>()(
  persist(
    (set, get) => ({
      ...INIZIALE,
      registraPartita: ({ gioco, punteggio, stelle, bravuraDopo }) => {
        const prima = get();
        const xpGuadagnati = xpDaPartita(punteggio, stelle);
        const streak = streakDopoPartita(prima.streak, giornoLocale(new Date()));
        const recordPrima = prima.record[gioco] ?? 0;
        set({
          xp: prima.xp + xpGuadagnati,
          bravura: { ...prima.bravura, [gioco]: bravuraDopo },
          record: { ...prima.record, [gioco]: Math.max(recordPrima, punteggio) },
          stelleMigliori: {
            ...prima.stelleMigliori,
            [gioco]: Math.max(prima.stelleMigliori[gioco] ?? 0, stelle) as Stelle,
          },
          partite: prima.partite + 1,
          streak,
        });
        return {
          xpGuadagnati,
          livelloPrima: livelloDa(prima.xp).livello,
          livelloDopo: livelloDa(prima.xp + xpGuadagnati).livello,
          bravuraPrima: prima.bravura[gioco] ?? 0,
          bravuraDopo,
          recordPrima,
          streak: streak.giorni,
        };
      },
      setMuto: (muto) => set({ muto }),
    }),
    {
      // Chiave versionata: se cambia la forma del profilo, si alza il numero
      // e si scrive la migrazione in `migrate`.
      name: 'matemagica-profilo',
      version: 1,
    },
  ),
);
