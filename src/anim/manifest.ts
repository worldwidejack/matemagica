// GENERATO da scripts/fogli.py: non modificarlo a mano, si riscrive a ogni foglio nuovo.
// Ogni voce è un'animazione a scatti: un foglio WebP con i fotogrammi in griglia.

import foglio_giusto from './fogli/giusto.webp';
import foglio_stella_trema from './fogli/stella-trema.webp';
import foglio_tocco from './fogli/tocco.webp';

export type Foglio = {
  url: string;
  fps: number;
  fotogrammi: number;
  colonne: number;
  righe: number;
  /** misure di un fotogramma, in px del foglio */
  w: number;
  h: number;
  loop: boolean;
  /** peso del foglio */
  kb: number;
};

export const FOGLI = {
  'giusto': { url: foglio_giusto, fps: 12, fotogrammi: 8, colonne: 3, righe: 3, w: 320, h: 272, loop: false, kb: 36.0 },
  'stella-trema': { url: foglio_stella_trema, fps: 12, fotogrammi: 3, colonne: 2, righe: 2, w: 200, h: 185, loop: true, kb: 19.6 },
  'tocco': { url: foglio_tocco, fps: 12, fotogrammi: 6, colonne: 3, righe: 2, w: 256, h: 250, loop: false, kb: 25.9 },
} satisfies Record<string, Foglio>;

export type NomeFoglio = keyof typeof FOGLI;
