import type { GameId } from '../engine/cartuccia.ts';
import type { Limiti } from '../engine/regole.ts';

/**
 * Il sentiero: la strada principale di Matemagica. MISTO per scelta (deciso
 * con papà): i giochi e gli argomenti si alternano, così non ci si annoia su
 * un argomento che non piace. Chi vuole un gioco solo va in Palestra.
 *
 * QUI DECIDE PAPÀ l'ordine e il ritmo. Ogni riga è un livello; `storia` è la
 * storia che si sblocca completandolo. La fascia di difficoltà si calcola da
 * sola (sale con le apparizioni di quel gioco), ma si può forzare con `limiti`.
 */
type Riga = { gioco: GameId; storia?: string; limiti?: Limiti; nome?: string };

const ORDINE: Riga[] = [
  // ── Tappa 1: si comincia ──
  { gioco: 'piu-grande', nome: 'Il primo confronto' },
  { gioco: 'coppie' },
  { gioco: 'piu-grande' },
  { gioco: 'bersaglio' },
  { gioco: 'coppie', storia: 'gauss' },
  // ── Tappa 2: arrivano i rompicapo ──
  { gioco: 'stima' },
  { gioco: 'bilancia' },
  { gioco: 'piu-grande' },
  { gioco: 'catena' },
  { gioco: 'regola', storia: 'al-khwarizmi' },
  // ── Tappa 3 ──
  { gioco: 'coppie' },
  { gioco: 'bersaglio' },
  { gioco: 'stima' },
  { gioco: 'bilancia' },
  { gioco: 'catena', storia: 'lo-shu' },
  // ── Tappa 4 ──
  { gioco: 'quadrato' },
  { gioco: 'regola' },
  { gioco: 'coppie' },
  { gioco: 'bersaglio' },
  { gioco: 'stima', storia: 'eratostene' },
  // ── Tappa 5 ──
  { gioco: 'bilancia' },
  { gioco: 'catena' },
  { gioco: 'piu-grande' },
  { gioco: 'regola' },
  { gioco: 'coppie', storia: 'fibonacci' },
  // ── Tappa 6 ──
  { gioco: 'bersaglio' },
  { gioco: 'stima' },
  { gioco: 'bilancia' },
  { gioco: 'catena' },
  { gioco: 'regola', storia: 'zero' },
  // ── Tappa 7 ──
  { gioco: 'piu-grande' },
  { gioco: 'coppie' },
  { gioco: 'bersaglio' },
  { gioco: 'stima' },
  { gioco: 'bilancia', storia: 'archimede' },
  // ── Tappa 8: il gran finale ──
  { gioco: 'catena' },
  { gioco: 'regola' },
  { gioco: 'piu-grande' },
  { gioco: 'bersaglio' },
  { gioco: 'bilancia', storia: 'ramanujan', nome: 'Il gran finale' },
];

/** I nomi delle tappe: il paese sale dal porto alla torre, dal tramonto alla notte. */
export const TAPPE = [
  'Il porto',
  'I vicoli',
  'La piazza',
  'Il campanile',
  'I limoni',
  'Le mura',
  'Il castello',
  'La torre delle stelle',
] as const;

export type Livello = {
  id: string;
  numero: number;
  gioco: GameId;
  limiti: Limiti;
  storia?: string;
  nome?: string;
  /** Prima volta che questo gioco compare nel sentiero: prima si mostra la spiegazione. */
  debutto: boolean;
  tappa: number;
};

/** Fascia della k-esima apparizione di un gioco: parte facile e sale. */
function fasciaPer(k: number): Limiti {
  const min = Math.max(0, k * 1.1 - 1);
  const max = Math.min(10, 2.5 + k * 1.4);
  return [Math.round(min * 10) / 10, Math.round(max * 10) / 10];
}

/** Le 8 tappe scritte a mano (con papà): il viaggio dal porto alla torre. */
export const SENTIERO_BASE: Livello[] = (() => {
  const apparizioni = new Map<GameId, number>();
  return ORDINE.map((r, i) => {
    const k = apparizioni.get(r.gioco) ?? 0;
    apparizioni.set(r.gioco, k + 1);
    return {
      id: `L${i + 1}`,
      numero: i + 1,
      gioco: r.gioco,
      limiti: r.limiti ?? fasciaPer(k),
      storia: r.storia,
      nome: r.nome,
      debutto: k === 0,
      tappa: Math.floor(i / 5) + 1,
    };
  });
})();

// ── Oltre la torre: il sentiero infinito ────────────────────────────────

/**
 * Dopo la torre il viaggio continua tra le costellazioni, all'infinito: ogni
 * tappa è una costellazione e i livelli si generano da soli. Ogni tappa
 * contiene 5 giochi diversi (seme fisso: uguale per tutti) e la fascia di
 * difficoltà resta alta ma mai piatta: 1 livello su 5 è "di respiro".
 */
export const COSTELLAZIONI = [
  'Orsa Maggiore',
  'Cassiopea',
  'Orione',
  'Lira',
  'Cigno',
  'Andromeda',
  'Pegaso',
  'Perseo',
  'Drago',
  'Gemelli',
  'Scorpione',
  'Sagittario',
  'Aquila',
  'Corona Boreale',
  'Delfino',
  'Leone',
] as const;

/** Tappe generate da tenere pronte: ~300 livelli in più bastano per anni. */
const TAPPE_GENERATE = 60;

/** I giochi che girano nelle tappe tra le stelle. */
const ROTAZIONE: GameId[] = ['piu-grande', 'coppie', 'catena', 'stima', 'bersaglio', 'bilancia', 'regola', 'quadrato', 'misto'];

function semeLivelli(t: number): () => number {
  let a = (t * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function nomeTappa(n: number): string {
  if (n <= TAPPE.length) return TAPPE[n - 1] ?? '';
  const k = n - TAPPE.length - 1;
  const nome = COSTELLAZIONI[k % COSTELLAZIONI.length] ?? 'Le stelle';
  const giro = Math.floor(k / COSTELLAZIONI.length);
  return giro === 0 ? nome : `${nome} ${['', 'II', 'III', 'IV', 'V', 'VI'][giro] ?? giro + 1}`;
}

const SENTIERO_STELLE: Livello[] = (() => {
  const livelli: Livello[] = [];
  for (let t = 0; t < TAPPE_GENERATE; t++) {
    const tappa = TAPPE.length + t + 1;
    const rng = semeLivelli(tappa);
    // 5 giochi diversi, mescolati col seme della tappa.
    const giochi = [...ROTAZIONE].sort(() => rng() - 0.5).slice(0, 5);
    const respiro = Math.floor(rng() * 5);
    giochi.forEach((gioco, k) => {
      const numero = SENTIERO_BASE.length + t * 5 + k + 1;
      // Sale piano da 6-9 fino a 7-10; il livello "di respiro" è una fascia più bassa.
      const su = Math.min(1, t / 20);
      const limiti: Limiti = k === respiro ? [3, 6.5] : [Math.round((6 + su) * 10) / 10, Math.round((9 + su) * 10) / 10];
      livelli.push({ id: `L${numero}`, numero, gioco, limiti, debutto: false, tappa });
    });
  }
  return livelli;
})();

/** Tutto il sentiero: le 8 tappe di papà e poi le stelle. */
export const SENTIERO: Livello[] = [...SENTIERO_BASE, ...SENTIERO_STELLE];

export const TAPPE_TOTALI = SENTIERO.length / 5;
