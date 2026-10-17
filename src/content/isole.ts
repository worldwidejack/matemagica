import { SENTIERO, nomeTappa } from './sentiero.ts';

/**
 * Le isole del sentiero (stile S5, struttura «Sassi e isole»): una tappa = un'isola
 * dipinta con 5 sassi (i 5 livelli) e il monumento della sua storia in cima.
 *
 * Ogni isola è legata all'id della STORIA del 5° livello della tappa, non al numero
 * della tappa: se papà cambia l'ordine del sentiero, l'isola segue la sua storia.
 * Una tappa senza isola dipinta (per ora dalla 5 in poi) si mostra come costellazione.
 *
 * Coordinate: frazioni 0-1 dentro il riquadro dell'immagine (0,0 = angolo in alto a
 * sinistra). `sassi` va dal basso verso l'alto (livello 1 → 5 della tappa), a zig-zag
 * sulla parte piatta dell'isola. `monumento` è la PUNTA del monumento: lì si pianta la
 * bandierina d'oro (15 stelle) e parte lo scoppio della scoperta.
 *
 * Punti misurati il 17/10 sui disegni veri (public/isole/isola-N.webp, griglia al 10%):
 * se un disegno cambia, rimisurali. `rapporto` è altezza / larghezza del WebP.
 */
export type Punto = { x: number; y: number };

export type Isola = {
  storia: string;
  /** Il nome nell'etichetta: «Isola 2 · L'arco». */
  nome: string;
  file: string;
  /** Altezza / larghezza dell'immagine. */
  rapporto: number;
  /** 5 punti, dal basso verso l'alto. */
  sassi: Punto[];
  monumento: Punto;
};

export const ISOLE: Isola[] = [
  {
    // Gauss: la torre dell'orologio.
    storia: 'gauss',
    nome: 'La torre',
    file: '/isole/isola-1.webp',
    rapporto: 1.1806, // misurato sul WebP (altezza / larghezza)
    sassi: [
      { x: 0.5, y: 0.56 }, // L1
      { x: 0.28, y: 0.49 }, // L2
      { x: 0.62, y: 0.45 }, // L3
      { x: 0.36, y: 0.38 }, // L4
      { x: 0.58, y: 0.33 }, // L5
    ],
    monumento: { x: 0.62, y: 0.03 },
  },
  {
    // al-Khwarizmi: l'arco giallo.
    storia: 'al-khwarizmi',
    nome: "L'arco",
    file: '/isole/isola-2.webp',
    rapporto: 1.065, // misurato sul WebP (altezza / larghezza)
    sassi: [
      { x: 0.52, y: 0.56 }, // L6
      { x: 0.72, y: 0.48 }, // L7
      { x: 0.4, y: 0.45 }, // L8
      { x: 0.64, y: 0.39 }, // L9
      { x: 0.47, y: 0.33 }, // L10
    ],
    monumento: { x: 0.62, y: 0.04 },
  },
  {
    // Lo Shu: l'isola-tartaruga, col quadrato di puntini sul guscio.
    storia: 'lo-shu',
    nome: 'La tartaruga',
    file: '/isole/isola-3.webp',
    rapporto: 0.95, // misurato sul WebP (altezza / larghezza)
    sassi: [
      { x: 0.5, y: 0.53 }, // L11
      { x: 0.25, y: 0.45 }, // L12
      { x: 0.74, y: 0.42 }, // L13
      { x: 0.28, y: 0.31 }, // L14
      { x: 0.7, y: 0.24 }, // L15
    ],
    monumento: { x: 0.5, y: 0.03 },
  },
  {
    // Eratostene: l'obelisco.
    storia: 'eratostene',
    nome: "L'obelisco",
    file: '/isole/isola-4.webp',
    rapporto: 1.0341, // misurato sul WebP (altezza / larghezza)
    sassi: [
      { x: 0.48, y: 0.58 }, // L16
      { x: 0.3, y: 0.5 }, // L17
      { x: 0.62, y: 0.46 }, // L18
      { x: 0.4, y: 0.39 }, // L19
      { x: 0.58, y: 0.34 }, // L20
    ],
    monumento: { x: 0.6, y: 0.02 },
  },
];

/** L'isola dipinta della tappa `n` (1, 2, …), o undefined se non c'è ancora. */
export function isolaDellaTappa(n: number): Isola | undefined {
  const quinto = SENTIERO[n * 5 - 1];
  const storia = quinto?.storia;
  return storia ? ISOLE.find((i) => i.storia === storia) : undefined;
}

/**
 * I nomi delle tappe 5-8, legati alla storia come le isole dipinte: quando un disegno
 * arriva, la voce passa in ISOLE (col suo `nome`) e si toglie da qui.
 */
const NOMI_PER_STORIA: Record<string, string> = {
  fibonacci: "L'albero",
  zero: "L'anello",
  archimede: 'La leva',
  ramanujan: "L'osservatorio",
};

/** Il nome della tappa `n`: quello dell'isola (o della storia) del suo 5° livello, se no quello del sentiero. */
export function nomeDellaTappa(n: number): string {
  const storia = SENTIERO[n * 5 - 1]?.storia;
  return isolaDellaTappa(n)?.nome ?? (storia ? NOMI_PER_STORIA[storia] : undefined) ?? nomeTappa(n);
}

/**
 * Come si chiama la tappa `n` sullo schermo: «Isola 3» se ha la sua isola dipinta,
 * «Tappa 5» se per ora è una costellazione. Un'unica regola per mappa, menu, risultati.
 */
export function titoloTappa(n: number): string {
  return `${isolaDellaTappa(n) ? 'Isola' : 'Tappa'} ${n}`;
}

/** «sull'isola 3» / «alla tappa 5», per le frasi. */
export function doveTappa(n: number): string {
  return isolaDellaTappa(n) ? `sull'isola ${n}` : `alla tappa ${n}`;
}

/** «all'isola 3» / «alla tappa 5». */
export function versoTappa(n: number): string {
  return isolaDellaTappa(n) ? `all'isola ${n}` : `alla tappa ${n}`;
}
