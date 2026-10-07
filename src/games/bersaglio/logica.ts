import type { Rng } from '../../engine/caso.ts';
import { intero, scegli } from '../../engine/caso.ts';

/**
 * "Il Numero bersaglio" — hai qualche numero e un bersaglio: combinali con
 * + − × ÷ (due alla volta) per arrivarci. Non serve usarli tutti.
 *
 * Regola di papà: niente bersagli raggiungibili con un'operazione sola o
 * sommando tutto ("il trucco della somma"). Il generatore lo verifica con un
 * risolutore esaustivo.
 */

export type Op = '+' | '−' | '×' | '÷';
export type Passo = { a: number; op: Op; b: number; r: number };
export type RoundBersaglio = { numeri: number[]; bersaglio: number; soluzione: Passo[] };

/** Il risultato di a op b, o null se non è un intero positivo. */
export function opera(a: number, op: Op, b: number): number | null {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b > 0 ? a - b : null;
    case '×':
      return a * b;
    case '÷':
      return b > 1 && a % b === 0 ? a / b : null;
  }
}

/** Rigioca i passi del giocatore sui numeri di partenza: validi e arrivano al bersaglio? */
export function verifica(r: RoundBersaglio, passi: Passo[]): boolean {
  const pool = [...r.numeri];
  for (const p of passi) {
    const ia = pool.indexOf(p.a);
    if (ia < 0) return false;
    pool.splice(ia, 1);
    const ib = pool.indexOf(p.b);
    if (ib < 0) return false;
    pool.splice(ib, 1);
    if (opera(p.a, p.op, p.b) !== p.r) return false;
    pool.push(p.r);
  }
  return pool.includes(r.bersaglio) && !r.numeri.includes(r.bersaglio);
}

const OPS: Op[] = ['+', '−', '×', '÷'];

/** Minimo numero di passi per arrivare al bersaglio (Infinity se impossibile), con limite. */
export function passiMinimi(numeri: number[], bersaglio: number, limite = 4): number {
  let migliore = Infinity;
  const cerca = (pool: number[], fatti: number) => {
    if (fatti >= migliore || fatti >= limite) return;
    for (let i = 0; i < pool.length; i++) {
      for (let j = 0; j < pool.length; j++) {
        if (i === j) continue;
        for (const op of OPS) {
          if ((op === '+' || op === '×') && j < i) continue; // commutative: una volta sola
          const r = opera(pool[i]!, op, pool[j]!);
          if (r === null) continue;
          if (r === bersaglio) {
            migliore = Math.min(migliore, fatti + 1);
            return;
          }
          const resto = pool.filter((_, k) => k !== i && k !== j);
          cerca([...resto, r], fatti + 1);
        }
      }
    }
  };
  if (numeri.includes(bersaglio)) return 0;
  cerca(numeri, 0);
  return migliore;
}

type Fascia = { quanti: number; pool: () => number; ops: Op[]; min: number; max: number; passiMin: number };

function fascia(d: number, rng: Rng): Fascia {
  const f = Math.min(4, Math.floor(d / 2));
  const piccolo = (max: number) => () => intero(rng, 1, max);
  switch (f) {
    case 0:
      return { quanti: 3, pool: piccolo(9), ops: ['+', '−'], min: 5, max: 25, passiMin: 2 };
    case 1:
      return { quanti: 4, pool: piccolo(9), ops: ['+', '−', '×'], min: 10, max: 40, passiMin: 2 };
    case 2:
      return { quanti: 4, pool: piccolo(10), ops: ['+', '−', '×'], min: 20, max: 80, passiMin: 2 };
    case 3:
      return { quanti: 4, pool: piccolo(12), ops: OPS, min: 24, max: 120, passiMin: 3 };
    default:
      return {
        quanti: 5,
        pool: () => (rng() < 0.3 ? scegli(rng, [25, 50, 75, 100]) : intero(rng, 1, 10)),
        ops: OPS,
        min: 100,
        max: 999,
        passiMin: 3,
      };
  }
}

export function genera(d: number, rng: Rng): RoundBersaglio {
  const f = fascia(d, rng);
  for (let t = 0; t < 400; t++) {
    const numeri = Array.from({ length: f.quanti }, f.pool);
    // Costruzione in avanti: combina a caso fino a usarli quasi tutti.
    let pool = [...numeri];
    const soluzione: Passo[] = [];
    const passi = Math.min(f.quanti - 1, f.passiMin + (rng() < 0.5 ? 0 : 1));
    for (let k = 0; k < passi && pool.length >= 2; k++) {
      const i = Math.floor(rng() * pool.length);
      let j = Math.floor(rng() * (pool.length - 1));
      if (j >= i) j++;
      const op = scegli(rng, f.ops);
      const a = pool[i]!;
      const b = pool[j]!;
      const r = opera(a, op, b);
      if (r === null) break;
      soluzione.push({ a, op, b, r });
      pool = [...pool.filter((_, x) => x !== i && x !== j), r];
    }
    const ultimo = soluzione[soluzione.length - 1];
    if (!ultimo || soluzione.length < f.passiMin) continue;
    const bersaglio = ultimo.r;
    if (bersaglio < f.min || bersaglio > f.max || numeri.includes(bersaglio)) continue;
    // Il trucco della somma: se sommare tutto basta, non è un rompicapo.
    if (numeri.reduce((s, n) => s + n, 0) === bersaglio && d >= 2) continue;
    if (passiMinimi(numeri, bersaglio, f.passiMin) < f.passiMin) continue;
    return { numeri, bersaglio, soluzione };
  }
  return {
    numeri: [3, 4, 6],
    bersaglio: 18,
    soluzione: [
      { a: 3, op: '×', b: 4, r: 12 },
      { a: 12, op: '+', b: 6, r: 18 },
    ],
  };
}

export function testoPasso(p: Passo): string {
  return `${p.a} ${p.op} ${p.b} = ${p.r}`;
}

export function aiuti(r: RoundBersaglio): string[] {
  const [p1, p2] = r.soluzione;
  const lista: string[] = [];
  if (p1) lista.push(`Un buon primo passo porta a ${p1.r}.`);
  if (p1) lista.push(`Primo passo: ${testoPasso(p1)}.`);
  if (p2) lista.push(`Secondo passo: ${testoPasso(p2)}.`);
  return lista;
}

export function soluzione(r: RoundBersaglio): string {
  return `Una strada: ${r.soluzione.map(testoPasso).join(' → ')}. Ce ne sono spesso altre!`;
}
