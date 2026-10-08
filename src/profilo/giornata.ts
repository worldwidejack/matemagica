/**
 * La giornata del giocatore: obiettivo del giorno e missioni del giorno
 * (ispirazione Duolingo, approvata da Jack l'8/10). Funzioni pure.
 *
 * Le missioni cambiano ogni giorno ma sono uguali per tutti nello stesso
 * giorno: si scelgono con un seme ricavato dalla data. Nessun server.
 */
import type { GameId } from '../engine/cartuccia.ts';

export type Giornata = {
  giorno: string;
  partite: number;
  stelle: number;
  comboMax: number;
  /** Rompicapo risolti senza aiuti né sbagli. */
  puliti: number;
  giochi: GameId[];
  /** Livelli del sentiero che hanno preso la prima stella oggi. */
  livelliNuovi: number;
};

export function giornataVuota(giorno: string): Giornata {
  return { giorno, partite: 0, stelle: 0, comboMax: 0, puliti: 0, giochi: [], livelliNuovi: 0 };
}

export type EventoPartita = {
  gioco: GameId;
  stelle: number;
  comboMax: number;
  puliti: number;
  livelloNuovo: boolean;
};

export function giornataDopoPartita(g: Giornata, oggi: string, e: EventoPartita): Giornata {
  const base = g.giorno === oggi ? g : giornataVuota(oggi);
  return {
    giorno: oggi,
    partite: base.partite + 1,
    stelle: base.stelle + e.stelle,
    comboMax: Math.max(base.comboMax, e.comboMax),
    puliti: base.puliti + e.puliti,
    giochi: base.giochi.includes(e.gioco) ? base.giochi : [...base.giochi, e.gioco],
    livelliNuovi: base.livelliNuovi + (e.livelloNuovo ? 1 : 0),
  };
}

// ── Obiettivo del giorno ────────────────────────────────────────────────

/** Le scelte del benvenuto: quante partite al giorno. */
export const OBIETTIVI = [
  { partite: 1, nome: 'Tranquillo', durata: '2 minuti al giorno' },
  { partite: 3, nome: 'Costante', durata: '5 minuti al giorno' },
  { partite: 5, nome: 'Determinato', durata: '10 minuti al giorno' },
] as const;

export const MOTIVI = [
  { id: 'mente', testo: 'Allenare la mente', icona: '🧠' },
  { id: 'gioco', testo: 'Divertirmi', icona: '🎲' },
  { id: 'numeri', testo: 'Riprendere confidenza coi numeri', icona: '🔢' },
  { id: 'curiosita', testo: 'Pura curiosità', icona: '✨' },
] as const;

// ── Missioni del giorno ─────────────────────────────────────────────────

type Tipo = 'partite' | 'stelle' | 'combo' | 'puliti' | 'giochi' | 'livelli';

export type Missione = {
  id: string;
  tipo: Tipo;
  obiettivo: number;
  testo: string;
  premioXp: number;
};

const CATALOGO: Omit<Missione, 'id'>[] = [
  { tipo: 'partite', obiettivo: 2, testo: 'Gioca 2 partite', premioXp: 20 },
  { tipo: 'partite', obiettivo: 4, testo: 'Gioca 4 partite', premioXp: 40 },
  { tipo: 'stelle', obiettivo: 4, testo: 'Prendi 4 stelle', premioXp: 30 },
  { tipo: 'stelle', obiettivo: 7, testo: 'Prendi 7 stelle', premioXp: 50 },
  { tipo: 'combo', obiettivo: 8, testo: 'Fai una combo da 8', premioXp: 30 },
  { tipo: 'combo', obiettivo: 15, testo: 'Fai una combo da 15', premioXp: 50 },
  { tipo: 'puliti', obiettivo: 2, testo: 'Risolvi 2 rompicapo senza aiuti', premioXp: 40 },
  { tipo: 'giochi', obiettivo: 2, testo: 'Gioca a 2 giochi diversi', premioXp: 20 },
  { tipo: 'giochi', obiettivo: 3, testo: 'Gioca a 3 giochi diversi', premioXp: 40 },
  { tipo: 'livelli', obiettivo: 1, testo: 'Completa un livello nuovo del sentiero', premioXp: 30 },
];

/** Hash semplice e stabile della data: stesso giorno, stesse missioni. */
function seme(giorno: string): number {
  let h = 2166136261;
  for (const c of giorno) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Tre missioni di tipo diverso, scelte col seme del giorno. */
export function missioniDel(giorno: string): Missione[] {
  let s = seme(giorno);
  const prossimo = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const scelte: Missione[] = [];
  const tipi = new Set<Tipo>();
  for (let t = 0; t < 50 && scelte.length < 3; t++) {
    const m = CATALOGO[Math.floor(prossimo() * CATALOGO.length)];
    if (!m || tipi.has(m.tipo)) continue;
    tipi.add(m.tipo);
    scelte.push({ ...m, id: `${giorno}-${m.tipo}-${m.obiettivo}` });
  }
  return scelte;
}

export function avanzamento(m: Missione, g: Giornata): number {
  const valore = {
    partite: g.partite,
    stelle: g.stelle,
    combo: g.comboMax,
    puliti: g.puliti,
    giochi: g.giochi.length,
    livelli: g.livelliNuovi,
  }[m.tipo];
  return Math.min(valore, m.obiettivo);
}

export function completata(m: Missione, g: Giornata): boolean {
  return avanzamento(m, g) >= m.obiettivo;
}
