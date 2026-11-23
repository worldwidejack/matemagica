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
import { dueDivisori } from './divisori';

/**
 * Tutti i giochi di Matemagica. Un gioco nuovo = una cartella in src/games/
 * + una riga qui (+ le sue apparizioni in src/content/sentiero.ts).
 */
export type VoceGioco = {
  id: GameId;
  titolo: string;
  icona: string;
  tipo: 'arcade' | 'rompicapo';
  /** «Oltre la porta»: si gioca col gesto e senza fermate; niente scheda di spiegazione prima. */
  fluido?: boolean;
  Play: FC<PlayProps>;
};

export const GIOCHI: Record<GameId, VoceGioco> = {
  'piu-grande': {
    id: 'piu-grande',
    titolo: piuGrande.title,
    fluido: piuGrande.fluido,
    icona: '🆚',
    tipo: 'arcade',
    Play: (p) => <ArcadeShell game={piuGrande} {...p} />,
  },
  coppie: {
    id: 'coppie',
    titolo: coppieMagiche.title,
    fluido: coppieMagiche.fluido,
    icona: '💞',
    tipo: 'arcade',
    Play: (p) => <ArcadeShell game={coppieMagiche} {...p} />,
  },
  catena: {
    id: 'catena',
    titolo: catena.title,
    fluido: catena.fluido,
    icona: '⛓️',
    tipo: 'arcade',
    Play: (p) => <ArcadeShell game={catena} {...p} />,
  },
  stima: {
    id: 'stima',
    titolo: stimaLampo.title,
    fluido: stimaLampo.fluido,
    icona: '🔮',
    tipo: 'arcade',
    Play: (p) => <ArcadeShell game={stimaLampo} {...p} />,
  },
  bersaglio: {
    id: 'bersaglio',
    titolo: numeroBersaglio.title,
    fluido: numeroBersaglio.fluido,
    icona: '🎯',
    tipo: 'rompicapo',
    Play: (p) => <PuzzleShell game={numeroBersaglio} {...p} />,
  },
  bilancia: {
    id: 'bilancia',
    titolo: laBilancia.title,
    fluido: laBilancia.fluido,
    icona: '⚖️',
    tipo: 'rompicapo',
    Play: (p) => <PuzzleShell game={laBilancia} {...p} />,
  },
  regola: {
    id: 'regola',
    titolo: trovaLaRegola.title,
    fluido: trovaLaRegola.fluido,
    icona: '🔍',
    tipo: 'rompicapo',
    Play: (p) => <PuzzleShell game={trovaLaRegola} {...p} />,
  },
  quadrato: {
    id: 'quadrato',
    titolo: quadratoMagico.title,
    fluido: quadratoMagico.fluido,
    icona: '🔢',
    tipo: 'rompicapo',
    Play: (p) => <PuzzleShell game={quadratoMagico} {...p} />,
  },
  divisori: {
    id: 'divisori',
    titolo: dueDivisori.title,
    fluido: dueDivisori.fluido,
    icona: '💎',
    tipo: 'arcade',
    Play: (p) => <ArcadeShell game={dueDivisori} {...p} />,
  },
  misto: {
    id: 'misto',
    titolo: lampoMisto.title,
    fluido: lampoMisto.fluido,
    icona: '🎲',
    tipo: 'arcade',
    Play: (p) => <ArcadeShell game={lampoMisto} {...p} />,
  },
};

/** Ordine di presentazione in Palestra. */
export const ORDINE_GIOCHI: GameId[] = ['piu-grande', 'coppie', 'catena', 'stima', 'bersaglio', 'bilancia', 'regola', 'quadrato', 'divisori'];

/** I giochi arcade che il Lampo misto mescola: si apre quando ne hai sbloccati almeno due. */
export const GIOCHI_DEL_MISTO: GameId[] = ['piu-grande', 'coppie', 'catena', 'stima'];
