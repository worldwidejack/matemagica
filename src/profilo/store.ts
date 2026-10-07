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
  /** Stelle migliori per livello del sentiero (id "L1", "L2", …). */
  stelleLivelli: Record<string, Stelle>;
  /** Storie sbloccate = carte della collezione. */
  carte: string[];
  /** Giochi di cui il giocatore ha già visto la spiegazione. */
  spiegazioniViste: GameId[];
};

export type RiepilogoPartita = {
  xpGuadagnati: number;
  livelloPrima: number;
  livelloDopo: number;
  bravuraPrima: number;
  bravuraDopo: number;
  recordPrima: number;
  streak: number;
  /** La storia sbloccata da questa partita, se è la prima volta. */
  cartaNuova?: string;
};

type Azioni = {
  registraPartita: (p: {
    gioco: GameId;
    punteggio: number;
    stelle: Stelle;
    bravuraDopo: number;
    /** Presenti solo se la partita era un livello del sentiero. */
    livello?: string;
    storia?: string;
  }) => RiepilogoPartita;
  setMuto: (muto: boolean) => void;
  segnaSpiegazione: (g: GameId) => void;
};

const INIZIALE: Profilo = {
  xp: 0,
  bravura: {},
  record: {},
  stelleMigliori: {},
  partite: 0,
  streak: { giorni: 0, ultimoGiorno: null },
  muto: false,
  stelleLivelli: {},
  carte: [],
  spiegazioniViste: [],
};

export const useProfilo = create<Profilo & Azioni>()(
  persist(
    (set, get) => ({
      ...INIZIALE,
      registraPartita: ({ gioco, punteggio, stelle, bravuraDopo, livello, storia }) => {
        const prima = get();
        // Una storia si sblocca la prima volta che il suo livello prende almeno una stella.
        const cartaNuova = storia && stelle > 0 && !prima.carte.includes(storia) ? storia : undefined;
        const stelleLivelli =
          livello && stelle > (prima.stelleLivelli[livello] ?? 0)
            ? { ...prima.stelleLivelli, [livello]: stelle }
            : prima.stelleLivelli;
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
          stelleLivelli,
          carte: cartaNuova ? [...prima.carte, cartaNuova] : prima.carte,
        });
        return {
          xpGuadagnati,
          livelloPrima: livelloDa(prima.xp).livello,
          livelloDopo: livelloDa(prima.xp + xpGuadagnati).livello,
          bravuraPrima: prima.bravura[gioco] ?? 0,
          bravuraDopo,
          recordPrima,
          streak: streak.giorni,
          cartaNuova,
        };
      },
      setMuto: (muto) => set({ muto }),
      segnaSpiegazione: (g) => {
        const viste = get().spiegazioniViste;
        if (!viste.includes(g)) set({ spiegazioniViste: [...viste, g] });
      },
    }),
    {
      // Chiave versionata: se cambia la forma del profilo, si alza il numero
      // e si scrive la migrazione in `migrate`.
      name: 'matemagica-profilo',
      version: 2,
      // v1 → v2 (B2): arrivano sentiero, collezione e spiegazioni.
      migrate: (vecchio, versione) => {
        const p = (vecchio ?? {}) as Partial<Profilo>;
        if (versione < 2) return { ...INIZIALE, ...p, stelleLivelli: {}, carte: [], spiegazioniViste: [] };
        return { ...INIZIALE, ...p };
      },
    },
  ),
);
