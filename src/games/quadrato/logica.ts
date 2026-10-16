import type { Rng } from '../../engine/caso.ts';
import { intero } from '../../engine/caso.ts';

/**
 * "Il Quadrato magico" — righe, colonne e diagonali hanno tutte la stessa
 * somma. Alcune caselle sono date: riempi le altre.
 *
 * Ogni 3×3 magico è  c+a | c−a−b | c+b
 *                   c−a+b |   c   | c+a−b
 *                     c−b | c+a+b | c−a
 * (c = centro). Le caselle date sono equazioni in (c, a, b).
 *
 * Regola di papà: i trucchi ovvi sono "sommo una riga completa" e "il centro
 * è un terzo della somma". Da d≥3 nessuna linea è mai completa; da d≥5 il
 * centro e la somma sono nascosti, quindi serve un'idea in più (gli opposti
 * attorno al centro, o un angolo come media di due bordi). Ogni quesito è
 * risolto da un risolutore "umano" a regole: se lui ce la fa, la soluzione è
 * unica e c'è una strada ragionabile. A d≥9 arriva anche il 4×4, dove i
 * quattro angoli (e i quattro al centro) fanno anch'essi la somma magica.
 */

export type Lato = 3 | 4;

/** Le deduzioni del risolutore "umano". */
export type TipoPasso =
  | 'somma' // una linea completa dà la somma magica
  | 'centro' // 3×3: centro = somma : 3 (e viceversa)
  | 'riga' // a una linea manca una casella sola
  | 'media' // 3×3: due opposti attorno al centro fanno il doppio del centro
  | 'angolo' // 3×3: un angolo è la media dei due bordi che non tocca
  | 'gruppo'; // 4×4: angoli, centro e bordi di mezzo fanno anch'essi la somma

export type Passo = {
  tipo: TipoPasso;
  /** Caselle usate. */
  da: number[];
  /** Casella trovata; -1 = si è trovata la somma magica. */
  a: number;
  valore: number;
  /** La linea o il gruppo usato, a parole. */
  dove?: string;
};

export type RoundQuadrato = {
  lato: Lato;
  /** La soluzione, riga per riga. */
  soluzione: number[];
  /** true = casella data. */
  date: boolean[];
  somma: number;
  /** La somma magica è mostrata come indizio. */
  sommaData: boolean;
  /** La vista offre il tasto ± (d alte), anche se questo quadrato non ha negativi. */
  negativi: boolean;
  /** Una strada di deduzioni che lo risolve: aiuti e spiegazione nascono da qui. */
  passi: Passo[];
};

// ── Linee e gruppi ───────────────────────────────────────────────────────

export type Linea = { celle: number[]; nome: string; /** riga, colonna o diagonale */ vera: boolean };

const ORDINALI = ['prima', 'seconda', 'terza', 'quarta'];

function costruisciLinee(lato: Lato): Linea[] {
  const idx = Array.from({ length: lato }, (_, i) => i);
  const L: Linea[] = [];
  for (const r of idx) L.push({ celle: idx.map((c) => r * lato + c), nome: `la ${ORDINALI[r]} riga`, vera: true });
  for (const c of idx) L.push({ celle: idx.map((r) => r * lato + c), nome: `la ${ORDINALI[c]} colonna`, vera: true });
  L.push({ celle: idx.map((i) => i * lato + i), nome: 'la diagonale che scende', vera: true });
  L.push({ celle: idx.map((i) => i * lato + (lato - 1 - i)), nome: 'la diagonale che sale', vera: true });
  if (lato === 4) {
    // Nel 4×4 (righe + colonne + diagonali) questi gruppi fanno sempre la somma magica.
    L.push({ celle: [0, 3, 12, 15], nome: 'i quattro angoli', vera: false });
    L.push({ celle: [5, 6, 9, 10], nome: 'le quattro caselle al centro', vera: false });
    L.push({ celle: [1, 2, 13, 14], nome: 'le quattro caselle di mezzo in alto e in basso', vera: false });
    L.push({ celle: [4, 8, 7, 11], nome: 'le quattro caselle di mezzo ai lati', vera: false });
  }
  return L;
}

const LINEE: Record<Lato, Linea[]> = { 3: costruisciLinee(3), 4: costruisciLinee(4) };

export function linee(lato: Lato): Linea[] {
  return LINEE[lato];
}

/** 3×3: le coppie opposte attorno al centro. */
const OPPOSTI: [number, number][] = [
  [0, 8],
  [2, 6],
  [1, 7],
  [3, 5],
];
/** 3×3: ogni angolo e i due bordi che non tocca (l'angolo ne è la media). */
const ANGOLI: [number, number, number][] = [
  [0, 5, 7],
  [2, 3, 7],
  [6, 1, 5],
  [8, 1, 3],
];

const NOMI3 = [
  'in alto a sinistra',
  'in alto al centro',
  'in alto a destra',
  'a sinistra',
  'al centro',
  'a destra',
  'in basso a sinistra',
  'in basso al centro',
  'in basso a destra',
];

/** Dove sta una casella, a parole. */
export function nomeCasella(lato: Lato, i: number): string {
  if (lato === 3) return NOMI3[i] ?? '';
  return `in riga ${Math.floor(i / 4) + 1}, colonna ${(i % 4) + 1}`;
}

export function sommaMagica(griglia: readonly number[], lato: Lato): number {
  return griglia.slice(0, lato).reduce((s, x) => s + x, 0);
}

/** true se tutte le linee vere hanno la stessa somma. */
export function eMagico(griglia: readonly number[], lato: Lato): boolean {
  const s = sommaMagica(griglia, lato);
  return LINEE[lato].every((l) => !l.vera || l.celle.reduce((t, i) => t + (griglia[i] ?? NaN), 0) === s);
}

// ── Il risolutore "umano" ────────────────────────────────────────────────

export const TUTTE: ReadonlySet<TipoPasso> = new Set(['somma', 'centro', 'riga', 'media', 'angolo', 'gruppo']);
/** La cassetta dei trucchi ovvi: righe complete, centro = somma : 3, linee con un buco. */
export const OVVIE: ReadonlySet<TipoPasso> = new Set(['somma', 'centro', 'riga']);

/**
 * Deduce come farebbe una persona, un passo alla volta, partendo solo dalle
 * caselle note (e dalla somma, se nota). null = bloccato con queste regole.
 */
export function deduci(
  lato: Lato,
  noti: readonly (number | null)[],
  somma: number | null,
  regole: ReadonlySet<TipoPasso> = TUTTE,
): { passi: Passo[]; griglia: number[] } | null {
  const L = LINEE[lato];
  const v: (number | null)[] = [...noti];
  let S: number | null = somma;
  const noto = (i: number) => v[i] !== null && v[i] !== undefined;
  const val = (i: number) => v[i] ?? 0;
  const tot = (celle: number[]) => celle.reduce((s, i) => s + val(i), 0);

  const prossimo = (): Passo | null => {
    if (lato === 3 && regole.has('centro')) {
      if (S !== null && !noto(4)) return { tipo: 'centro', da: [], a: 4, valore: S / 3 };
      if (S === null && noto(4)) return { tipo: 'centro', da: [4], a: -1, valore: 3 * val(4) };
    }
    if (S === null && regole.has('somma')) {
      for (const l of L) if (l.vera && l.celle.every(noto)) return { tipo: 'somma', da: l.celle, a: -1, valore: tot(l.celle), dove: l.nome };
    }
    if (S !== null && regole.has('riga')) {
      for (const l of L) {
        if (!l.vera) continue;
        const vuote = l.celle.filter((i) => !noto(i));
        const unica = vuote[0];
        if (vuote.length === 1 && unica !== undefined) {
          const da = l.celle.filter(noto);
          return { tipo: 'riga', da, a: unica, valore: S - tot(da), dove: l.nome };
        }
      }
    }
    if (lato === 3 && regole.has('media') && !noto(4)) {
      for (const [x, y] of OPPOSTI) if (noto(x) && noto(y)) return { tipo: 'media', da: [x, y], a: 4, valore: (val(x) + val(y)) / 2 };
    }
    if (lato === 3 && regole.has('angolo')) {
      for (const [k, e1, e2] of ANGOLI) {
        if (!noto(k) && noto(e1) && noto(e2)) return { tipo: 'angolo', da: [e1, e2], a: k, valore: (val(e1) + val(e2)) / 2 };
        if (noto(k) && noto(e1) && !noto(e2)) return { tipo: 'angolo', da: [k, e1], a: e2, valore: 2 * val(k) - val(e1) };
        if (noto(k) && !noto(e1) && noto(e2)) return { tipo: 'angolo', da: [k, e2], a: e1, valore: 2 * val(k) - val(e2) };
      }
    }
    if (lato === 4 && regole.has('gruppo')) {
      for (const l of L) {
        if (l.vera) continue;
        if (S === null && l.celle.every(noto)) return { tipo: 'gruppo', da: l.celle, a: -1, valore: tot(l.celle), dove: l.nome };
        const vuote = l.celle.filter((i) => !noto(i));
        const unica = vuote[0];
        if (S !== null && vuote.length === 1 && unica !== undefined) {
          const da = l.celle.filter(noto);
          return { tipo: 'gruppo', da, a: unica, valore: S - tot(da), dove: l.nome };
        }
      }
    }
    return null;
  };

  const passi: Passo[] = [];
  while (v.some((x) => x === null)) {
    const p = prossimo();
    if (!p) return null;
    passi.push(p);
    if (p.a < 0) S = p.valore;
    else v[p.a] = p.valore;
  }
  return { passi, griglia: v.map((x) => x ?? 0) };
}

/** La strada di deduzioni per un quesito: solo le caselle date (e la somma, se data). */
export function risolviUmano(
  lato: Lato,
  date: readonly boolean[],
  soluzione: readonly number[],
  sommaData: boolean,
  regole: ReadonlySet<TipoPasso> = TUTTE,
): Passo[] | null {
  const noti = soluzione.map((x, i) => (date[i] ? x : null));
  return deduci(lato, noti, sommaData ? sommaMagica(soluzione, lato) : null, regole)?.passi ?? null;
}

// ── Quali caselle mostrare (conta solo la posizione) ─────────────────────

/** Quadrati di riferimento: le regole guardano solo quali caselle sono note, non i valori. */
const RIFERIMENTO: Record<Lato, number[]> = {
  3: [8, 1, 6, 3, 5, 7, 4, 9, 2],
  4: [16, 3, 2, 13, 5, 10, 11, 8, 9, 6, 7, 12, 4, 15, 14, 1],
};

type Schema = { date: boolean[]; rigaCompleta: boolean; centroDato: boolean; ovvioBasta: boolean };

function descrivi(lato: Lato, date: boolean[], sommaData: boolean): Schema | null {
  const rif = RIFERIMENTO[lato];
  if (!risolviUmano(lato, date, rif, sommaData)) return null;
  return {
    date,
    rigaCompleta: LINEE[lato].some((l) => l.vera && l.celle.every((i) => date[i])),
    centroDato: lato === 3 && date[4] === true,
    ovvioBasta: risolviUmano(lato, date, rif, sommaData, OVVIE) !== null,
  };
}

/** k caselle su n, a caso. */
function caselleACaso(n: number, k: number, rng: Rng): boolean[] {
  const ordine = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < k; i++) {
    const j = intero(rng, i, n - 1);
    [ordine[i], ordine[j]] = [ordine[j]!, ordine[i]!];
  }
  const date = new Array<boolean>(n).fill(false);
  for (const i of ordine.slice(0, k)) date[i] = true;
  return date;
}

// ── Difficoltà ───────────────────────────────────────────────────────────

type Fascia = {
  lato: Lato;
  nDate: number;
  sommaData: boolean;
  rigaCompleta: 'si' | 'no' | 'libera';
  centroNascosto: boolean;
  ovvioFallisce: boolean;
  min: number;
  max: number;
  /** Il quadrato deve contenere almeno un negativo. */
  conNegativo: boolean;
  negativi: boolean;
};

function fascia(d: number, rng: Rng): Fascia {
  // Da qui in su: nessuna linea completa, centro e somma nascosti, i trucchi ovvi non bastano.
  const base: Fascia = {
    lato: 3,
    nDate: 3,
    sommaData: false,
    rigaCompleta: 'no',
    centroNascosto: true,
    ovvioFallisce: true,
    min: 1,
    max: 99,
    conNegativo: false,
    negativi: false,
  };
  const facile = { centroNascosto: false, ovvioFallisce: false };
  if (d < 2) return { ...base, ...facile, nDate: 5, sommaData: true, rigaCompleta: 'si', max: d < 1 ? 15 : 20 };
  if (d < 3) return { ...base, ...facile, nDate: 5, sommaData: rng() < 0.5, rigaCompleta: 'libera', max: 30 };
  if (d < 5) return { ...base, ...facile, nDate: 4, sommaData: rng() < (d < 4 ? 0.5 : 0.3), max: d < 4 ? 40 : 50 };
  if (d < 6) return { ...base, nDate: 4, max: 60 };
  if (d < 8) return { ...base, max: d < 7 ? 80 : 99 };
  // d≥9: a volte il 4×4. Con la somma data bastano 7 caselle; senza, 8 e un gruppo completo.
  if (d >= 9 && rng() < (d >= 10 ? 0.6 : 0.4)) {
    const conSomma = d < 10 || rng() < 0.5;
    const neg = d >= 10 && rng() < 0.3;
    return {
      ...base,
      lato: 4,
      nDate: conSomma ? 7 : 8,
      sommaData: conSomma,
      min: neg ? -25 : 1,
      max: neg ? 45 : 60,
      conNegativo: neg,
      negativi: d >= 10,
    };
  }
  const neg = rng() < 0.5;
  return { ...base, min: neg ? -30 : 1, max: neg ? 70 : 99, conNegativo: neg, negativi: true };
}

function adatto(s: Schema, f: Fascia): boolean {
  return (
    (f.rigaCompleta === 'libera' || s.rigaCompleta === (f.rigaCompleta === 'si')) &&
    (!f.centroNascosto || !s.centroDato) &&
    (!f.ovvioFallisce || !s.ovvioBasta)
  );
}

function scegliSchema(f: Fascia, rng: Rng): Schema | null {
  for (let t = 0; t < 400; t++) {
    const s = descrivi(f.lato, caselleACaso(f.lato * f.lato, f.nDate, rng), f.sommaData);
    if (s && adatto(s, f)) return s;
  }
  return null;
}

// ── Il quadrato pieno ────────────────────────────────────────────────────

function valido(q: number[], f: Fascia): boolean {
  if (new Set(q).size !== q.length) return false;
  if (q.some((x) => !Number.isInteger(x) || x < f.min || x > f.max)) return false;
  return !f.conNegativo || q.some((x) => x < 0);
}

/** 3×3: centro c e due scarti a, b (la formula in cima al file). */
function quadrato3(f: Fascia, rng: Rng): number[] | null {
  const raggio = Math.max(4, Math.floor((f.max - f.min) / 3));
  for (let t = 0; t < 2000; t++) {
    const c = intero(rng, f.min, f.max);
    const a = intero(rng, -raggio, raggio);
    const b = intero(rng, -raggio, raggio);
    const q = [c + a, c - a - b, c + b, c - a + b, c, c + a - b, c - b, c + a + b, c - a];
    if (valido(q, f)) return q;
  }
  return null;
}

/**
 * 4×4: da queste 7 caselle e dalla somma si deduce tutto il resto, e ogni
 * casella dedotta dipende al massimo da 5 numeri (cercato una volta per
 * tutte tra gli schemi possibili): i valori restano "normali".
 */
const GENERATORE4 = [0, 1, 3, 5, 6, 7, 10];
let coefficienti4: number[][] | null = null;

/** Quanto pesano la somma e ognuna delle 7 caselle su ogni casella (le deduzioni sono lineari). */
function coefficienti(): number[][] {
  if (!coefficienti4) {
    const con = (k: number) => Array.from({ length: 16 }, (_, i) => (GENERATORE4.includes(i) ? (i === k ? 1 : 0) : null));
    coefficienti4 = [-1, ...GENERATORE4].map((k) => deduci(4, con(k), k < 0 ? 1 : 0)?.griglia ?? []);
  }
  return coefficienti4;
}

function quadrato4(f: Fascia, rng: Rng): number[] | null {
  const C = coefficienti();
  const medio = (f.min + f.max) / 2;
  const ampiezza = f.max - f.min;
  for (let t = 0; t < 20000; t++) {
    const x = [intero(rng, Math.round(4 * medio - ampiezza / 2), Math.round(4 * medio + ampiezza / 2))];
    for (let k = 0; k < GENERATORE4.length; k++) x.push(intero(rng, f.min, f.max));
    const q = Array.from({ length: 16 }, (_, i) => C.reduce((s, riga, k) => s + (riga[i] ?? 0) * (x[k] ?? 0), 0));
    if (valido(q, f) && eMagico(q, 4)) return q;
  }
  return null;
}

// ── Il quesito ───────────────────────────────────────────────────────────

export function genera(d: number, rng: Rng): RoundQuadrato {
  for (let t = 0; t < 50; t++) {
    const f = fascia(d, rng);
    const s = scegliSchema(f, rng);
    if (!s) continue;
    const q = f.lato === 3 ? quadrato3(f, rng) : quadrato4(f, rng);
    if (!q) continue;
    const passi = risolviUmano(f.lato, s.date, q, f.sommaData);
    if (!passi) continue;
    return {
      lato: f.lato,
      soluzione: q,
      date: s.date,
      somma: sommaMagica(q, f.lato),
      sommaData: f.sommaData,
      negativi: f.negativi,
      passi,
    };
  }
  // Il quadrato della tartaruga, con la prima riga data.
  const q = RIFERIMENTO[3];
  const date = [true, true, true, false, true, false, true, false, false];
  return { lato: 3, soluzione: q, date, somma: 15, sommaData: true, negativi: false, passi: risolviUmano(3, date, q, true) ?? [] };
}

// ── Aiuti e spiegazione ──────────────────────────────────────────────────

/** Un numero da mostrare: col meno tipografico. */
export function testoNumero(x: number): string {
  return x < 0 ? `−${-x}` : String(x);
}

/** Un numero dentro un'espressione: i negativi tra parentesi. */
function inConto(x: number): string {
  return x < 0 ? `(−${-x})` : String(x);
}

function maiuscola(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const REGOLA: Record<TipoPasso, string> = {
  somma: 'C’è una linea già completa: la sua somma vale per tutte le altre.',
  centro: 'In un 3 × 3 magico il centro è sempre un terzo della somma magica.',
  riga: 'Cerca una linea a cui manca una casella sola.',
  media: 'Due caselle opposte attorno al centro fanno sempre il doppio del centro.',
  angolo: 'Ogni angolo è la media delle due caselle di bordo che non tocca.',
  gruppo: 'Nel 4 × 4 non ci sono solo righe, colonne e diagonali: anche alcuni gruppi di quattro caselle (per esempio i quattro angoli) fanno la somma magica.',
};

function testoPasso(r: RoundQuadrato, p: Passo): string {
  const n = (i: number | undefined) => r.soluzione[i ?? 0] ?? 0;
  const somma = (celle: number[]) => celle.map((i, k) => (k === 0 ? testoNumero(n(i)) : inConto(n(i)))).join(' + ');
  const togli = (celle: number[]) => [r.somma, ...celle.map(n)].map(inConto).join(' − ');
  const v = testoNumero(p.valore);
  switch (p.tipo) {
    case 'somma':
      return `${maiuscola(p.dove ?? 'una linea')} è completa: ${somma(p.da)} = ${v}. È la somma magica.`;
    case 'centro':
      return p.a >= 0
        ? `La somma magica è ${testoNumero(r.somma)}: il centro è ${inConto(r.somma)} : 3 = ${v}.`
        : `Il centro è ${testoNumero(n(4))}: la somma magica è 3 × ${inConto(n(4))} = ${v}.`;
    case 'riga':
      return `${maiuscola(p.dove ?? 'una linea')} ha un buco solo: ${togli(p.da)} = ${v}.`;
    case 'media':
      return `${testoNumero(n(p.da[0]))} e ${testoNumero(n(p.da[1]))} sono opposti: il centro è (${somma(p.da)}) : 2 = ${v}.`;
    case 'angolo': {
      const [x, y] = p.da;
      if (ANGOLI.some(([k]) => k === p.a)) {
        return `L’angolo ${nomeCasella(3, p.a)} è la media di ${testoNumero(n(x))} e ${testoNumero(n(y))}: (${somma(p.da)}) : 2 = ${v}.`;
      }
      return `L’angolo ${testoNumero(n(x))} è la media di ${testoNumero(n(y))} e della casella ${nomeCasella(3, p.a)}: quella vale 2 × ${inConto(n(x))} − ${inConto(n(y))} = ${v}.`;
    }
    case 'gruppo':
      return p.a < 0
        ? `${maiuscola(p.dove ?? 'un gruppo')}: ${somma(p.da)} = ${v}. È la somma magica.`
        : `Tra ${p.dove ?? 'un gruppo'} manca un numero solo: ${togli(p.da)} = ${v}.`;
  }
}

/** Il primo passo "furbo" (non una semplice linea da chiudere), se c'è. */
function passoChiave(r: RoundQuadrato): Passo | undefined {
  return r.passi.find((p) => p.tipo !== 'riga') ?? r.passi[0];
}

/** Tre aiuti: l'idea, poi il primo passo coi numeri, poi il passo dopo. */
export function aiuti(r: RoundQuadrato): string[] {
  const chiave = passoChiave(r);
  if (!chiave) return [REGOLA.riga];
  const i = r.passi.indexOf(chiave);
  const dopo = r.passi.slice(i + 1).find((p) => p.tipo !== 'riga');
  const terzo = dopo
    ? testoPasso(r, dopo)
    : !r.sommaData && chiave.a >= 0
      ? `La somma magica è ${testoNumero(r.somma)}: ora chiudi le linee a cui manca una casella.`
      : 'Ora chiudi, una dopo l’altra, le linee a cui manca una casella sola.';
  // Se prima servono delle linee da chiudere, il passo furbo usa numeri ancora da trovare: lo diciamo.
  const passo = testoPasso(r, chiave);
  const secondo = i > 0 ? `Prima chiudi le linee con un buco solo. Poi: ${passo.charAt(0).toLowerCase()}${passo.slice(1)}` : passo;
  return [REGOLA[chiave.tipo], secondo, terzo];
}

/** Il momento "aha": l'idea che sblocca, coi numeri di questo quadrato. */
export function soluzione(r: RoundQuadrato): string {
  const chiave = passoChiave(r);
  const finale = `Poi ogni linea con un buco solo si chiude da sé (somma magica ${testoNumero(r.somma)}).`;
  if (!chiave) return finale;
  switch (chiave.tipo) {
    case 'media':
    case 'angolo':
      return `${REGOLA[chiave.tipo]} ${testoPasso(r, chiave)} ${finale}`;
    case 'gruppo':
      return chiave.a < 0
        ? `Nel 4 × 4 anche ${chiave.dove ?? 'i quattro angoli'} fanno la somma magica: ${chiave.da.map((i, k) => (k === 0 ? testoNumero : inConto)(r.soluzione[i] ?? 0)).join(' + ')} = ${testoNumero(chiave.valore)}. ${finale}`
        : `Nel 4 × 4 anche ${chiave.dove ?? 'i quattro angoli'} fanno la somma magica. ${testoPasso(r, chiave)} ${finale}`;
    default:
      return `${testoPasso(r, chiave)} ${finale}`;
  }
}

/** Controllo della risposta: le date rispettate e tutte le linee con la stessa somma. */
export function corretta(r: RoundQuadrato, griglia: readonly number[]): boolean {
  if (griglia.length !== r.soluzione.length) return false;
  if (griglia.some((x) => !Number.isInteger(x))) return false;
  if (r.date.some((data, i) => data && griglia[i] !== r.soluzione[i])) return false;
  if (r.sommaData && sommaMagica(griglia, r.lato) !== r.somma) return false;
  return eMagico(griglia, r.lato);
}
