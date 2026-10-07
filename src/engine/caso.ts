/** Generatore casuale iniettabile: `Math.random` in gioco, con seme nelle simulazioni. */
export type Rng = () => number;

/** mulberry32: piccolo, veloce, riproducibile. Solo per simulazioni e test. */
export function rngConSeme(seme: number): Rng {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Intero in [min, max], estremi inclusi. */
export function intero(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function scegli<T>(rng: Rng, lista: readonly T[]): T {
  const x = lista[Math.floor(rng() * lista.length)];
  if (x === undefined) throw new Error('scegli: lista vuota');
  return x;
}
