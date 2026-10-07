import type { Rng } from '../../engine/caso.ts';
import { intero } from '../../engine/caso.ts';

/**
 * "Stima lampo" — un calcolo troppo lungo da fare in pochi secondi, tre
 * risposte arrotondate: scegli quella più vicina. Vince chi stima.
 *
 * Regola di papà: i trucchi da smontare sono "la risposta giusta è sempre
 * quella in mezzo" (la giusta è a caso la più bassa, la media o la più alta)
 * e "guardo l'ultima cifra" (le opzioni sono tutte arrotondate).
 */

export type RoundStima = { testo: string; valore: number; opzioni: number[]; giusta: number };

/** Arrotonda a 2 cifre significative: 798 → 800, 4 312 → 4 300. */
export function arrotonda(x: number): number {
  if (x === 0) return 0;
  const p = Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 1);
  return Math.round(x / p) * p;
}

function calcolo(d: number, rng: Rng): { testo: string; valore: number } {
  const fascia = Math.min(4, Math.floor(d / 2));
  if (fascia === 0) {
    const a = intero(rng, 12, 49);
    const b = intero(rng, 3, 9);
    return { testo: `${a} × ${b}`, valore: a * b };
  }
  if (fascia === 1) {
    const a = intero(rng, 12, 49);
    const b = intero(rng, 12, 39);
    return { testo: `${a} × ${b}`, valore: a * b };
  }
  if (fascia === 2) {
    const a = intero(rng, 41, 99);
    const b = intero(rng, 21, 89);
    return { testo: `${a} × ${b}`, valore: a * b };
  }
  if (fascia === 3 && rng() < 0.5) {
    const p = intero(rng, 11, 49);
    const n = intero(rng, 12, 98) * 10;
    return { testo: `${p}% di ${n}`, valore: (p * n) / 100 };
  }
  if (rng() < 0.5) {
    const b = intero(rng, 12, 39);
    const q = intero(rng, 21, 299);
    const resto = intero(rng, 0, b - 1);
    return { testo: `${q * b + resto} ÷ ${b}`, valore: (q * b + resto) / b };
  }
  const a = intero(rng, 120, 899);
  const b = intero(rng, 12, 79);
  return { testo: `${a} × ${b}`, valore: a * b };
}

export function genera(d: number, rng: Rng): RoundStima {
  for (let t = 0; t < 200; t++) {
    const c = calcolo(d, rng);
    const giusta = arrotonda(c.valore);
    // Le esche si avvicinano col livello: dal ±45% al ±14%.
    const passo = 0.45 - 0.031 * Math.min(10, d);
    const schema = Math.floor(rng() * 3); // 0: giusta la più bassa, 1: in mezzo, 2: la più alta
    const fattori = schema === 0 ? [1 + passo, 1 + 2 * passo] : schema === 1 ? [1 - passo, 1 + passo] : [1 - passo, 1 - 2 * passo * 0.8];
    const esche = fattori.map((f) => arrotonda(giusta * f));
    const opzioni = [giusta, ...esche];
    if (new Set(opzioni).size < 3 || esche.some((e) => e <= 0)) continue;
    // La giusta deve essere davvero la più vicina al valore vero.
    const dist = Math.abs(giusta - c.valore);
    if (esche.some((e) => Math.abs(e - c.valore) <= dist)) continue;
    const mescolate = [...opzioni].sort(() => rng() - 0.5);
    return { testo: c.testo, valore: c.valore, opzioni: mescolate, giusta: mescolate.indexOf(giusta) };
  }
  return { testo: '38 × 21', valore: 798, opzioni: [600, 800, 1100], giusta: 1 };
}

/** Poco tempo, apposta: il calcolo esatto non ci sta, la stima sì. */
export function tempo(d: number): number {
  return Math.round(Math.max(2800, 4200 - 120 * d));
}

export function formatta(n: number): string {
  return n.toLocaleString('it-IT');
}
