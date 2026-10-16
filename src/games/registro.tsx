import type { FC } from 'react';
import { ArcadeShell } from '@/engine/ArcadeShell';
import { PuzzleShell } from '@/engine/PuzzleShell';
import type { GameId } from '@/engine/cartuccia';
import type { PlayProps } from '@/engine/partita';
import { piuGrande } from './piu-grande';
import { coppieMagiche } from './coppie';
import { catena } from './catena';
import { stimaLampo } from './stima';
import { numeroBersaglio } from './bersaglio';
import { laBilancia } from './bilancia';
import { trovaLaRegola } from './regola';
import { quadratoMagico } from './quadrato';
import { lampoMisto } from './misto';

/**
 * Tutti i giochi di Matemagica. Un gioco nuovo = una cartella in src/games/
 * + una riga qui (+ le sue apparizioni in src/content/sentiero.ts).
 */
export type VoceGioco = {
  id: GameId;
  titolo: string;
  icona: string;
  tipo: 'arcade' | 'rompicapo';
  Play: FC<PlayProps>;
};

export const GIOCHI: Record<GameId, VoceGioco> = {
  'piu-grande': {
    id: 'piu-grande',
    titolo: piuGrande.title,
    icona: '🆚',
    tipo: 'arcade',
    Play: (p) => <ArcadeShell game={piuGrande} {...p} />,
  },
  coppie: {
    id: 'coppie',
    titolo: coppieMagiche.title,
    icona: '💞',
    tipo: 'arcade',
    Play: (p) => <ArcadeShell game={coppieMagiche} {...p} />,
  },
  catena: {
    id: 'catena',
    titolo: catena.title,
    icona: '⛓️',
    tipo: 'arcade',
    Play: (p) => <ArcadeShell game={catena} {...p} />,
  },
  stima: {
    id: 'stima',
    titolo: stimaLampo.title,
    icona: '🔮',
    tipo: 'arcade',
    Play: (p) => <ArcadeShell game={stimaLampo} {...p} />,
  },
  bersaglio: {
    id: 'bersaglio',
    titolo: numeroBersaglio.title,
    icona: '🎯',
    tipo: 'rompicapo',
    Play: (p) => <PuzzleShell game={numeroBersaglio} {...p} />,
  },
  bilancia: {
    id: 'bilancia',
    titolo: laBilancia.title,
    icona: '⚖️',
    tipo: 'rompicapo',
    Play: (p) => <PuzzleShell game={laBilancia} {...p} />,
  },
  regola: {
    id: 'regola',
    titolo: trovaLaRegola.title,
    icona: '🔍',
    tipo: 'rompicapo',
    Play: (p) => <PuzzleShell game={trovaLaRegola} {...p} />,
  },
  quadrato: {
    id: 'quadrato',
    titolo: quadratoMagico.title,
    icona: '🔢',
    tipo: 'rompicapo',
    Play: (p) => <PuzzleShell game={quadratoMagico} {...p} />,
  },
  misto: {
    id: 'misto',
    titolo: lampoMisto.title,
    icona: '🎲',
    tipo: 'arcade',
    Play: (p) => <ArcadeShell game={lampoMisto} {...p} />,
  },
};

/** Ordine di presentazione in Palestra. */
export const ORDINE_GIOCHI: GameId[] = ['piu-grande', 'coppie', 'catena', 'stima', 'bersaglio', 'bilancia', 'regola', 'quadrato'];

/** I giochi arcade che il Lampo misto mescola: si apre quando ne hai sbloccati almeno due. */
export const GIOCHI_DEL_MISTO: GameId[] = ['piu-grande', 'coppie', 'catena', 'stima'];
