import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameId } from '@/engine/cartuccia';
import type { Stelle } from '@/engine/regole';
import { SALVA_FIAMMA_MAX, giornoLocale, livelloDa, streakDopoPartita, xpDaPartita, type Streak } from './progressione';
import { STAT_VUOTE, medaglieNuove, type DatiMedaglie, type MedagliaNuova, type Statistiche } from './medaglie';
import { SENTIERO } from '@/content/sentiero';
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
  /** Contatori di sempre: statistiche e medaglie. */
  stat: Statistiche;
  /** Salva-fiamma in tasca (0-2). */
  salvaFiamma: number;
  /** I giorni in cui hai giocato, per il calendario (gli ultimi ~400). */
  giorniGiocati: string[];
  /** Sfide del giorno giocate: data → risultato. */
  sfide: Record<string, { punteggio: number; stelle: Stelle; gioco: GameId }>;
  vibrazione: boolean;
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
  medaglieNuove: MedagliaNuova[];
  /** Un salva-fiamma vinto con questa partita. */
  salvaVinto: boolean;
  /** Salva-fiamma consumati per tenere viva la fiamma (giorni saltati). */
  salvaUsati: number;
  /** La tappa del sentiero appena completata (tutti e 5 i livelli con almeno una stella). */
  tappaCompletata?: number;
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
    /** Risposte giuste (arcade) o rompicapo risolti (rompicapo). */
    giuste?: number;
    risolti?: number;
    /** Presente se la partita era la sfida del giorno (la data). */
    sfida?: string;
  }) => RiepilogoPartita;
  setMuto: (muto: boolean) => void;
  segnaSpiegazione: (g: GameId) => void;
  completaBenvenuto: (motivo: string, obiettivo: number) => void;
  setObiettivo: (obiettivo: number) => void;
  setVibrazione: (v: boolean) => void;
  /**
   * Test superato per saltare alla tappa `tappa`: tutti i livelli prima della
   * tappa senza stelle ne prendono una (si aprono; le storie restano da vincere).
   */
  saltaATappa: (tappa: number) => void;
  /** Cancella tutto e ricomincia dal benvenuto. */
  azzera: () => void;
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
  stat: STAT_VUOTE,
  salvaFiamma: 0,
  giorniGiocati: [],
  sfide: {},
  vibrazione: true,
};

function datiMedaglie(p: Profilo): DatiMedaglie {
  return {
    stat: p.stat,
    partite: p.partite,
    xp: p.xp,
    livello: livelloDa(p.xp).livello,
    carte: p.carte.length,
    stelleLivelli: p.stelleLivelli,
  };
}

/** La tappa di un livello appena aperto, se ora ha tutti e 5 i livelli con almeno una stella. */
function tappaFinita(livello: string, stelle: Record<string, Stelle>): number | undefined {
  const l = SENTIERO.find((x) => x.id === livello);
  if (!l) return undefined;
  const tappa = SENTIERO.filter((x) => x.tappa === l.tappa);
  return tappa.every((x) => (stelle[x.id] ?? 0) > 0) ? l.tappa : undefined;
}

export const useProfilo = create<Profilo & Azioni>()(
  persist(
    (set, get) => ({
      ...INIZIALE,
      registraPartita: ({ gioco, punteggio, stelle, bravuraDopo, livello, storia, comboMax = 0, puliti = 0, giuste = 0, risolti = 0, sfida }) => {
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
        const dopoStreak = streakDopoPartita(prima.streak, oggi, prima.salvaFiamma);
        const streak = dopoStreak.streak;
        const salvaFiamma = Math.min(
          SALVA_FIAMMA_MAX,
          prima.salvaFiamma - dopoStreak.salvaUsati + (dopoStreak.salvaVinto ? 1 : 0),
        );
        const fiammaAccesa = prima.streak.ultimoGiorno !== oggi;
        const recordPrima = prima.record[gioco] ?? 0;
        const ora = new Date().getHours();
        const stat: Statistiche = {
          giuste: prima.stat.giuste + giuste,
          rompicapoRisolti: prima.stat.rompicapoRisolti + risolti,
          puliti: prima.stat.puliti + puliti,
          comboMax: Math.max(prima.stat.comboMax, comboMax),
          streakMax: Math.max(prima.stat.streakMax, streak.giorni),
          treStelle: prima.stat.treStelle + (stelle === 3 ? 1 : 0),
          sfide: prima.stat.sfide + (sfida && !prima.sfide[sfida] ? 1 : 0),
          notturne: prima.stat.notturne + (ora < 5 ? 1 : 0),
          partitePerGioco: { ...prima.stat.partitePerGioco, [gioco]: (prima.stat.partitePerGioco[gioco] ?? 0) + 1 },
        };
        const tappaCompletata = livello && livelloNuovo ? tappaFinita(livello, stelleLivelli) : undefined;
        const carte = cartaNuova ? [...prima.carte, cartaNuova] : prima.carte;
        const giorniGiocati = prima.giorniGiocati.includes(oggi) ? prima.giorniGiocati : [...prima.giorniGiocati, oggi].slice(-400);
        const sfide =
          sfida && !prima.sfide[sfida] ? { ...prima.sfide, [sfida]: { punteggio, stelle, gioco } } : prima.sfide;
        const dopo: Profilo = {
          ...prima,
          xp: prima.xp + xpGuadagnati,
          stat,
          carte,
          stelleLivelli,
          partite: prima.partite + 1,
        };
        set({
          stat,
          salvaFiamma,
          giorniGiocati,
          sfide,
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
          carte,
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
          medaglieNuove: medaglieNuove(datiMedaglie(prima), datiMedaglie(dopo)),
          salvaVinto: dopoStreak.salvaVinto && prima.salvaFiamma < SALVA_FIAMMA_MAX,
          salvaUsati: dopoStreak.salvaUsati,
          tappaCompletata,
        };
      },
      setVibrazione: (vibrazione) => set({ vibrazione }),
      saltaATappa: (tappa) => {
        const stelle = { ...get().stelleLivelli };
        for (const l of SENTIERO) if (l.tappa < tappa && (stelle[l.id] ?? 0) === 0) stelle[l.id] = 1;
        set({ stelleLivelli: stelle });
      },
      azzera: () => set({ ...INIZIALE }),
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
      version: 4,
      // v1 → v2 (B2): sentiero, collezione, spiegazioni.
      // v2 → v3: benvenuto, giornata, missioni. Chi ha già giocato salta il benvenuto.
      // v3 → v4: statistiche, salva-fiamma, calendario, sfide del giorno, vibrazione
      //          (campi nuovi coi valori iniziali; la fiamma record riparte da quella attuale).
      migrate: (vecchio, versione) => {
        const p = (vecchio ?? {}) as Partial<Profilo>;
        const v2 = versione < 2 ? { ...p, stelleLivelli: {}, carte: [], spiegazioniViste: [] } : p;
        if (versione < 3) {
          const giaGiocato = (v2.partite ?? 0) > 0;
          return { ...INIZIALE, ...v2, benvenuto: { fatto: giaGiocato, obiettivo: 3 } };
        }
        const v3 = v2;
        if (versione < 4) {
          const giorno = v3.streak?.ultimoGiorno;
          return {
            ...INIZIALE,
            ...v3,
            stat: { ...STAT_VUOTE, streakMax: v3.streak?.giorni ?? 0 },
            giorniGiocati: giorno ? [giorno] : [],
          };
        }
        return { ...INIZIALE, ...v3 };
      },
    },
  ),
);
