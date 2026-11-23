// GENERATO da scripts/fogli.py: non modificarlo a mano, si riscrive a ogni foglio nuovo.
// Ogni voce è un'animazione a scatti: un foglio WebP con i fotogrammi in griglia.

import foglio_gatto_aspetta from './fogli/gatto-aspetta.webp';
import foglio_gatto_fine_1 from './fogli/gatto-fine-1.webp';
import foglio_gatto_fine_2 from './fogli/gatto-fine-2.webp';
import foglio_gatto_fine_3 from './fogli/gatto-fine-3.webp';
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
  /** il copione, se i disegni durano tempi diversi: [disegno nel foglio, fotogrammi che dura] */
  passi?: readonly (readonly number[])[];
  /** dove sta il personaggio nel primo fotogramma: [x, y, larghezza, altezza] in px del foglio */
  corpo?: readonly number[];
};

export const FOGLI = {
  'gatto-aspetta': { url: foglio_gatto_aspetta, fps: 24, fotogrammi: 14, colonne: 5, righe: 3, w: 254, h: 320, loop: true, kb: 117.8, corpo: [16.9, 2.0, 235.5, 316.0], passi: [[0,6],[1,2],[2,3],[1,2],[0,9],[3,2],[4,2],[3,2],[0,8],[5,2],[6,12],[5,2],[0,8],[7,2],[8,4],[7,2],[0,3],[7,2],[8,4],[7,2],[0,8],[9,2],[10,2],[11,8],[12,3],[13,3],[0,6]] },
  'gatto-fine-1': { url: foglio_gatto_fine_1, fps: 24, fotogrammi: 73, colonne: 10, righe: 8, w: 287, h: 360, loop: false, kb: 555.3, corpo: [55.4, 108.4, 184.8, 247.8], passi: [[0,6],[1,1],[2,1],[3,2],[2,1],[1,1],[0,6],[4,4],[0,3],[5,2],[6,1],[7,2],[8,2],[9,3],[10,3],[11,1],[12,1],[13,2],[12,1],[11,1],[9,3],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,3],[23,2],[24,2],[25,2],[26,3],[27,2],[28,2],[29,7],[27,3],[30,2],[31,2],[32,3],[33,2],[34,1],[35,1],[36,1],[37,2],[38,3],[39,2],[40,2],[41,1],[42,2],[43,2],[44,2],[45,2],[46,2],[47,2],[48,2],[49,2],[50,2],[51,2],[52,2],[50,2],[52,1],[51,1],[53,1],[54,2],[55,1],[56,3],[55,1],[57,2],[58,2],[59,2],[60,2],[61,2],[62,2],[63,2],[64,2],[65,2],[66,2],[67,2],[68,2],[69,3],[70,4],[71,3],[70,3],[72,4],[70,3]] },
  'gatto-fine-2': { url: foglio_gatto_fine_2, fps: 24, fotogrammi: 39, colonne: 7, righe: 6, w: 287, h: 360, loop: false, kb: 333.8, corpo: [55.4, 108.4, 184.8, 247.8], passi: [[0,6],[1,1],[2,1],[3,2],[2,1],[1,1],[0,6],[4,2],[5,2],[6,2],[7,2],[8,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,4],[20,2],[21,5],[22,2],[23,5],[24,2],[25,1],[26,1],[27,1],[28,1],[29,2],[30,4],[31,2],[32,2],[33,4],[34,3],[33,3],[34,3],[33,1],[35,2],[36,2],[37,10],[38,4],[37,8],[38,3],[37,7]] },
  'gatto-fine-3': { url: foglio_gatto_fine_3, fps: 24, fotogrammi: 35, colonne: 7, righe: 5, w: 287, h: 360, loop: false, kb: 343.1, corpo: [55.4, 108.4, 184.8, 247.8], passi: [[0,6],[1,2],[2,2],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[6,1],[7,1],[10,2],[11,2],[12,3],[13,2],[14,2],[15,3],[16,1],[17,1],[18,1],[19,2],[20,1],[21,1],[22,4],[23,3],[24,3],[25,1],[26,1],[27,3],[28,2],[29,2],[30,12],[31,2],[32,3],[33,2],[32,3],[33,2],[32,3],[31,2],[30,12],[34,4],[30,13]] },
  'giusto': { url: foglio_giusto, fps: 12, fotogrammi: 8, colonne: 3, righe: 3, w: 320, h: 272, loop: false, kb: 36.0 },
  'stella-trema': { url: foglio_stella_trema, fps: 12, fotogrammi: 3, colonne: 2, righe: 2, w: 200, h: 185, loop: true, kb: 19.6 },
  'tocco': { url: foglio_tocco, fps: 12, fotogrammi: 6, colonne: 3, righe: 2, w: 256, h: 250, loop: false, kb: 25.9 },
} satisfies Record<string, Foglio>;

export type NomeFoglio = keyof typeof FOGLI;
