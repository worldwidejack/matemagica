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
  { gioco: 'piu-grande' },
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

export const SENTIERO: Livello[] = (() => {
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
