import type { FC } from 'react';
import { ArcadeShell, type PlayProps } from '@/engine/ArcadeShell';
import type { GameId } from '@/engine/cartuccia';
import { piuGrande } from './piu-grande';

/**
 * Tutti i giochi di Matemagica. Un gioco nuovo = una cartella in src/games/
 * + una riga qui. Quelli senza `Play` sono annunciati ma non ancora costruiti.
 */
export type VoceGioco = {
  id: GameId;
  titolo: string;
  tipo: 'arcade' | 'rompicapo';
  Play?: FC<PlayProps>;
};

const PlayPiuGrande: FC<PlayProps> = (p) => <ArcadeShell game={piuGrande} {...p} />;

export const GIOCHI: VoceGioco[] = [
  { id: 'piu-grande', titolo: piuGrande.title, tipo: 'arcade', Play: PlayPiuGrande },
  { id: 'coppie', titolo: 'Coppie magiche', tipo: 'arcade' },
  { id: 'bersaglio', titolo: 'Il Numero bersaglio', tipo: 'rompicapo' },
  { id: 'bilancia', titolo: 'La Bilancia', tipo: 'rompicapo' },
  { id: 'catena', titolo: 'Catena', tipo: 'arcade' },
  { id: 'stima', titolo: 'Stima lampo', tipo: 'arcade' },
  { id: 'regola', titolo: 'Trova la regola', tipo: 'rompicapo' },
];
