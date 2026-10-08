/**
 * La sfida del giorno: ogni giorno un gioco a sorpresa, uguale per tutti nello
 * stesso giorno (il seme viene dalla data, nessun server). Conta il primo
 * tentativo; il risultato si condivide come un messaggio.
 */
import type { GameId } from '../engine/cartuccia.ts';
import { giornoMeno } from './progressione.ts';

const GIOCHI_SFIDA: GameId[] = ['piu-grande', 'coppie', 'catena', 'stima', 'bersaglio', 'bilancia', 'regola', 'quadrato', 'misto'];

/** Hash stabile della data (FNV-1a): stesso giorno, stesso numero. */
function seme(giorno: string): number {
  let h = 2166136261;
  for (const c of `sfida-${giorno}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

export type Sfida = { giorno: string; gioco: GameId; seme: number };

function indiceGrezzo(giorno: string): number {
  return seme(giorno) % GIOCHI_SFIDA.length;
}

export function sfidaDel(giorno: string): Sfida {
  // Il gioco cambia ogni giorno: se il caso ripete quello di ieri, si passa al successivo.
  let indice = indiceGrezzo(giorno);
  if (indice === indiceGrezzo(giornoMeno(giorno, 1))) indice = (indice + 1) % GIOCHI_SFIDA.length;
  const gioco = GIOCHI_SFIDA[indice] ?? 'piu-grande';
  return { giorno, gioco, seme: seme(giorno) };
}

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** "8 ottobre" */
export function dataBreve(giorno: string): string {
  const [, m, g] = giorno.split('-').map(Number);
  return `${g ?? 1} ${MESI[(m ?? 1) - 1] ?? ''}`;
}
