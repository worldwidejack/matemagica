import type { World } from '@/state/types';

/**
 * I mondi dell'MVP. Dati, non codice: aggiungere un mondo qui + una cartuccia
 * in src/games/ deve bastare. Le soglie stelle sono da tarare giocando (M2/M3),
 * non a tavolino.
 */
export const WORLDS: World[] = [
  {
    id: 'w1-segni',
    title: 'La Regola dei Segni',
    gameId: 'segni',
    unlockedBy: null,
    starThresholds: [0, 0, 0], // TODO M2: tarare sui punteggi reali
    loreAfter: 'algebra-algoritmo',
  },
  {
    id: 'w2-quadrato',
    title: 'Il Quadrato Magico',
    gameId: 'quadrato',
    unlockedBy: 'w1-segni',
    starThresholds: [0, 0, 0], // TODO M3: tarare sui punteggi reali
  },
];
