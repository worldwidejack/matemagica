import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameId } from '@/engine/cartuccia';
import type { Stelle } from '@/engine/regole';
import { giornoLocale, livelloDa, streakDopoPartita, xpDaPartita, type Streak } from './progressione';
import { completata, giornataDopoPartita, giornataVuota, missioniDel, type Giornata, type Missione } from './giornata';

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
  /** Il benvenuto della prima apertura: fatto, perché sei qui, partite al giorno. */
  benvenuto: { fatto: boolean; motivo?: string; obiettivo: number };
  /** Cosa hai fatto oggi: serve a obiettivo e missioni del giorno. */
  giornata: Giornata;
  /** Missioni già premiate (id con la data dentro: si azzerano da sole). */
  missioniPremiate: string[];
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
  /** Prima partita di oggi: la fiamma si accende (schermata a tutto schermo). */
  fiammaAccesa: boolean;
  /** Missioni completate con questa partita (già premiate con XP). */
  missioniNuove: Missione[];
  /** L'obiettivo del giorno è stato raggiunto proprio con questa partita. */
  obiettivoRaggiunto: boolean;
  partiteOggi: number;
  obiettivo: number;
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
    comboMax?: number;
    /** Rompicapo risolti senza aiuti né sbagli in questa partita. */
    puliti?: number;
  }) => RiepilogoPartita;
  setMuto: (muto: boolean) => void;
  segnaSpiegazione: (g: GameId) => void;
  completaBenvenuto: (motivo: string, obiettivo: number) => void;
  setObiettivo: (obiettivo: number) => void;
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
  benvenuto: { fatto: false, obiettivo: 3 },
  giornata: giornataVuota(''),
  missioniPremiate: [],
};

export const useProfilo = create<Profilo & Azioni>()(
  persist(
    (set, get) => ({
      ...INIZIALE,
      registraPartita: ({ gioco, punteggio, stelle, bravuraDopo, livello, storia, comboMax = 0, puliti = 0 }) => {
        const prima = get();
        const oggi = giornoLocale(new Date());
        // Una storia si sblocca la prima volta che il suo livello prende almeno una stella.
        const cartaNuova = storia && stelle > 0 && !prima.carte.includes(storia) ? storia : undefined;
        const stelleLivelli =
          livello && stelle > (prima.stelleLivelli[livello] ?? 0)
            ? { ...prima.stelleLivelli, [livello]: stelle }
            : prima.stelleLivelli;
        const livelloNuovo = Boolean(livello && stelle > 0 && (prima.stelleLivelli[livello] ?? 0) === 0);
        const giornataPrima = prima.giornata.giorno === oggi ? prima.giornata : giornataVuota(oggi);
        const giornata = giornataDopoPartita(prima.giornata, oggi, { gioco, stelle, comboMax, puliti, livelloNuovo });
        // Missioni completate adesso: premiate subito, una volta sola.
        const missioniNuove = missioniDel(oggi).filter(
          (m) => completata(m, giornata) && !prima.missioniPremiate.includes(m.id),
        );
        const xpMissioni = missioniNuove.reduce((s, m) => s + m.premioXp, 0);
        const obiettivo = prima.benvenuto.obiettivo;
        const obiettivoRaggiunto = giornataPrima.partite < obiettivo && giornata.partite >= obiettivo;
        const xpGuadagnati = xpDaPartita(punteggio, stelle) + xpMissioni;
        const streak = streakDopoPartita(prima.streak, oggi);
        const fiammaAccesa = prima.streak.ultimoGiorno !== oggi;
        const recordPrima = prima.record[gioco] ?? 0;
        set({
          giornata,
          missioniPremiate: [...prima.missioniPremiate.filter((id) => id.startsWith(oggi)), ...missioniNuove.map((m) => m.id)],
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
          fiammaAccesa,
          missioniNuove,
          obiettivoRaggiunto,
          partiteOggi: giornata.partite,
          obiettivo,
        };
      },
      setMuto: (muto) => set({ muto }),
      completaBenvenuto: (motivo, obiettivo) => set({ benvenuto: { fatto: true, motivo, obiettivo } }),
      setObiettivo: (obiettivo) => set({ benvenuto: { ...get().benvenuto, obiettivo } }),
      segnaSpiegazione: (g) => {
        const viste = get().spiegazioniViste;
        if (!viste.includes(g)) set({ spiegazioniViste: [...viste, g] });
      },
    }),
    {
      // Chiave versionata: se cambia la forma del profilo, si alza il numero
      // e si scrive la migrazione in `migrate`.
      name: 'matemagica-profilo',
      version: 3,
      // v1 → v2 (B2): sentiero, collezione, spiegazioni.
      // v2 → v3: benvenuto, giornata, missioni. Chi ha già giocato salta il benvenuto.
      migrate: (vecchio, versione) => {
        const p = (vecchio ?? {}) as Partial<Profilo>;
        const v2 = versione < 2 ? { ...p, stelleLivelli: {}, carte: [], spiegazioniViste: [] } : p;
        if (versione < 3) {
          const giaGiocato = (v2.partite ?? 0) > 0;
          return { ...INIZIALE, ...v2, benvenuto: { fatto: giaGiocato, obiettivo: 3 } };
        }
        return { ...INIZIALE, ...v2 };
      },
    },
  ),
);
