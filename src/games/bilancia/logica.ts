import type { Rng } from '../../engine/caso.ts';
import { intero } from '../../engine/caso.ts';

/**
 * "La Bilancia" — bilance in equilibrio con forme misteriose e pesi:
 * quanto pesa la forma chiesta? È algebra senza lettere.
 *
 * Regola di papà: la forma chiesta non si legge mai da una bilancia sola
 * (dalla fascia 1 in su): bisogna incrociare le bilance. Il generatore lo
 * verifica provando tutte le combinazioni di pesi.
 */

export const FORME = ['🔺', '🟦', '🟡'] as const;

/** Un piatto: quante volte compare ogni forma + un peso numerico. */
export type Piatto = { forme: number[]; peso: number };
export type Bilancia = { sinistra: Piatto; destra: Piatto };
export type RoundBilancia = { pesi: number[]; bilance: Bilancia[]; chiesta: number };

function valore(p: Piatto, pesi: number[]): number {
  return p.forme.reduce((s, n, i) => s + n * (pesi[i] ?? 0), 0) + p.peso;
}

function equilibrata(b: Bilancia, pesi: number[]): boolean {
  return valore(b.sinistra, pesi) === valore(b.destra, pesi);
}

/** Tutti i valori possibili della forma chiesta, provando ogni combinazione di pesi 1..max. */
function valoriPossibili(bilance: Bilancia[], nForme: number, chiesta: number, max: number): Set<number> {
  const trovati = new Set<number>();
  const pesi = new Array<number>(nForme).fill(1);
  const prova = (k: number) => {
    if (k === nForme) {
      if (bilance.every((b) => equilibrata(b, pesi))) trovati.add(pesi[chiesta]!);
      return;
    }
    for (let v = 1; v <= max; v++) {
      pesi[k] = v;
      prova(k + 1);
    }
  };
  prova(0);
  return trovati;
}

type Fascia = { nForme: number; maxPeso: number; maxPezzi: number; incrocio: boolean };

function fascia(d: number): Fascia {
  const f = Math.min(4, Math.floor(d / 2));
  return [
    { nForme: 1, maxPeso: 9, maxPezzi: 4, incrocio: false },
    { nForme: 2, maxPeso: 9, maxPezzi: 3, incrocio: true },
    { nForme: 2, maxPeso: 12, maxPezzi: 4, incrocio: true },
    { nForme: 3, maxPeso: 12, maxPezzi: 4, incrocio: true },
    { nForme: 3, maxPeso: 15, maxPezzi: 5, incrocio: true },
  ][f]!;
}

function bilanciaCasuale(pesi: number[], f: Fascia, rng: Rng): Bilancia | null {
  const sin = new Array<number>(f.nForme).fill(0);
  const des = new Array<number>(f.nForme).fill(0);
  const pezziSin = intero(rng, 1, f.maxPezzi);
  const pezziDes = f.nForme === 1 ? 0 : intero(rng, 0, f.maxPezzi - 1);
  for (let i = 0; i < pezziSin; i++) sin[intero(rng, 0, f.nForme - 1)]!++;
  for (let i = 0; i < pezziDes; i++) des[intero(rng, 0, f.nForme - 1)]!++;
  // Una forma su entrambi i piatti si semplifica: la togliamo, è più leggibile.
  for (let i = 0; i < f.nForme; i++) {
    const m = Math.min(sin[i]!, des[i]!);
    sin[i]! -= m;
    des[i]! -= m;
  }
  if (sin.every((n) => n === 0)) return null;
  const vs = sin.reduce((s, n, i) => s + n * pesi[i]!, 0);
  const vd = des.reduce((s, n, i) => s + n * pesi[i]!, 0);
  // Il peso numerico va sul piatto più leggero, per pareggiare.
  return vs >= vd
    ? { sinistra: { forme: sin, peso: 0 }, destra: { forme: des, peso: vs - vd } }
    : { sinistra: { forme: sin, peso: vd - vs }, destra: { forme: des, peso: 0 } };
}

export function genera(d: number, rng: Rng): RoundBilancia {
  const f = fascia(d);
  for (let t = 0; t < 600; t++) {
    const pesi = Array.from({ length: f.nForme }, () => intero(rng, 1, f.maxPeso));
    const bilance: Bilancia[] = [];
    for (let k = 0; k < f.nForme; k++) {
      const b = bilanciaCasuale(pesi, f, rng);
      if (b) bilance.push(b);
    }
    if (bilance.length !== f.nForme) continue;
    // Bilance vuote da un lato (forme senza peso contro niente) non hanno senso.
    if (bilance.some((b) => valore(b.destra, pesi) === 0)) continue;
    const chiesta = intero(rng, 0, f.nForme - 1);
    const possibili = valoriPossibili(bilance, f.nForme, chiesta, f.maxPeso + 6);
    if (possibili.size !== 1) continue;
    if (f.incrocio) {
      // Nessuna bilancia da sola deve bastare.
      const basta = bilance.some((b) => valoriPossibili([b], f.nForme, chiesta, f.maxPeso + 6).size === 1);
      if (basta) continue;
    }
    return { pesi, bilance, chiesta };
  }
  return {
    pesi: [4],
    bilance: [{ sinistra: { forme: [3], peso: 0 }, destra: { forme: [0], peso: 12 } }],
    chiesta: 0,
  };
}

export function aiuti(r: RoundBilancia): string[] {
  const nForme = r.pesi.length;
  if (nForme === 1) {
    const b = r.bilance[0]!;
    const n = b.sinistra.forme[0] ?? 1;
    return [
      `Il peso si divide in parti uguali tra le ${FORME[0]}.`,
      `${n} ${FORME[0]} pesano ${valore(b.destra, r.pesi) - b.sinistra.peso}: dividi per ${n}.`,
    ];
  }
  const altra = r.pesi.findIndex((_, i) => i !== r.chiesta);
  return [
    'Cerca la bilancia più semplice e parti da lì. Se una forma compare da entrambe le parti, toglila da tutte e due.',
    `${FORME[altra]} pesa ${r.pesi[altra]}.`,
  ];
}

export function soluzione(r: RoundBilancia): string {
  return r.pesi.map((p, i) => `${FORME[i]} = ${p}`).join(' · ');
}
