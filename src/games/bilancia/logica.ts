import type { Rng } from '../../engine/caso.ts';
import { intero } from '../../engine/caso.ts';

/**
 * "La Bilancia" — bilance in equilibrio con forme misteriose e pesi: quanto
 * pesa la forma chiesta? Sono equazioni di primo grado, senza lettere.
 *
 * Papà (16/10): «difficile all'inizio. Pesi negativi OK, frazioni più avanti».
 * Quindi la salita, con la difficoltà d (0-10):
 *   d 0-1,3   una bilancia e una forma: prima 🔺🔺🔺 = 12, poi con un peso o con
 *             delle forme anche sull'altro piatto (si toglie la stessa cosa da
 *             tutti e due i piatti);
 *   d 1,3-4   due forme "a scala": una bilancia dice subito quanto pesa una forma,
 *             l'altra serve a incrociare (all'inizio l'incrocio è ovvio);
 *   d 2,6-6   due forme, bilance qualsiasi;
 *   d 5,5-7   tre forme: prima a scala, poi qualsiasi;
 *   d ≥ 7     "sotto zero": si avvisa che una forma PUÒ pesare meno di zero (tira
 *             su, come un palloncino). Succede davvero solo in pochi rompicapo
 *             (dal 12% a d 7 al 24% a d 10), e la forma chiesta è quella negativa
 *             solo una volta su tre: l'avviso non è un trucco.
 * Niente frazioni: i pesi sono sempre interi.
 *
 * Regola di papà: dalle due forme in su la forma chiesta non si legge mai da una
 * bilancia sola, bisogna incrociare. La soluzione è sempre unica, anche contando
 * negativi e zero: lo garantisce l'algebra (rango del sistema) e lo ricontrolla
 * la forza bruta su tutte le combinazioni di pesi.
 */

export const FORME = ['🔺', '🟦', '🟡'] as const;

/** Un piatto: quante volte compare ogni forma + un peso numerico (mai negativo). */
export type Piatto = { forme: number[]; peso: number };
export type Bilancia = { sinistra: Piatto; destra: Piatto };
/** uno = una forma sola · scala = una bilancia dice subito un peso · libera = bilance qualsiasi. */
export type TipoBilancia = 'uno' | 'scala' | 'libera';
export type RoundBilancia = {
  pesi: number[];
  bilance: Bilancia[];
  chiesta: number;
  tipo: TipoBilancia;
  /** Da d 7 le forme possono pesare meno di zero: la vista lo dice e offre il tasto ±. */
  sottoZero: boolean;
};

/** I numeri negativi col meno tipografico, ben visibile. */
export function scriviNumero(n: number): string {
  return n < 0 ? `−${-n}` : String(n);
}

function valore(p: Piatto, pesi: number[]): number {
  return p.forme.reduce((s, n, i) => s + n * (pesi[i] ?? 0), 0) + p.peso;
}

function vuoto(p: Piatto): boolean {
  return p.peso === 0 && p.forme.every((n) => n === 0);
}

// ── Algebra: una bilancia è un'equazione Σ coef·peso = noto ─────────────────

type Equazione = { coef: number[]; noto: number };

export function equazione(b: Bilancia): Equazione {
  return {
    coef: b.sinistra.forme.map((n, i) => n - (b.destra.forme[i] ?? 0)),
    noto: b.destra.peso - b.sinistra.peso,
  };
}

function mcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Rango di una matrice di interi, con l'eliminazione senza frazioni (esatta). */
function rango(righe: number[][]): number {
  const m = righe.map((r) => [...r]);
  const colonne = m[0]?.length ?? 0;
  let r = 0;
  for (let c = 0; c < colonne && r < m.length; c++) {
    const p = m.findIndex((riga, i) => i >= r && riga[c] !== 0);
    if (p < 0) continue;
    const pivot = m[p]!;
    m[p] = m[r]!;
    m[r] = pivot;
    for (let i = 0; i < m.length; i++) {
      const f = m[i]![c]!;
      if (i === r || f === 0) continue;
      const nuova = m[i]!.map((x, j) => x * pivot[c]! - f * pivot[j]!);
      const g = nuova.reduce(mcd, 0) || 1;
      m[i] = nuova.map((x) => x / g);
    }
    r++;
  }
  return r;
}

/**
 * Le bilance fissano il peso della forma `forma`? Vale su TUTTI i numeri
 * (negativi, zero, frazioni): la forma è fissata se il suo vettore sta nello
 * spazio delle righe del sistema, cioè se aggiungerlo non alza il rango.
 * Le bilance sono sempre coerenti (i pesi veri le soddisfano).
 */
function determina(bilance: Bilancia[], forma: number, nForme: number, note: number[] = []): boolean {
  const unita = (k: number) => Array.from({ length: nForme }, (_, i) => (i === k ? 1 : 0));
  const righe = [...bilance.map((b) => equazione(b).coef), ...note.map(unita)];
  return rango([...righe, unita(forma)]) === rango(righe);
}

/**
 * Forza bruta: tutti i valori possibili della forma chiesta, provando ogni
 * combinazione di pesi interi tra `da` e `a` (lo zero no: niente forme che non pesano).
 */
export function valoriPossibili(bilance: Bilancia[], nForme: number, chiesta: number, da: number, a: number): Set<number> {
  const eq = bilance.map(equazione);
  const trovati = new Set<number>();
  const pesi = new Array<number>(nForme).fill(da);
  const regge = (e: Equazione) => {
    let s = 0;
    for (let i = 0; i < nForme; i++) s += e.coef[i]! * pesi[i]!;
    return s === e.noto;
  };
  const prova = (k: number) => {
    if (k === nForme) {
      if (eq.every(regge)) trovati.add(pesi[chiesta]!);
      return;
    }
    for (let v = da; v <= a; v++) {
      if (v === 0) continue;
      pesi[k] = v;
      prova(k + 1);
    }
  };
  prova(0);
  return trovati;
}

// ── Il piano: che rompicapo fare a questa difficoltà ───────────────────────

type VarianteUno = 'sola' | 'peso' | 'lati';

type Piano = {
  tipo: TipoBilancia;
  nForme: number;
  maxPeso: number;
  maxPezzi: number;
  sottoZero: boolean;
  /** Indice della forma che pesa meno di zero, se c'è. */
  negativa: number | null;
  /** Scala: i ruoli [diretta, di mezzo, ultima] (ultima solo con 3 forme). */
  ruoli: number[];
  chiesta: number;
  varianteUno: VarianteUno;
};

const tra = (x: number, da: number, a: number) => Math.max(0, Math.min(1, (x - da) / (a - da)));

function mescola(rng: Rng, n: number): number[] {
  const v = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = intero(rng, 0, i);
    [v[i], v[j]] = [v[j]!, v[i]!];
  }
  return v;
}

/** Quota di rompicapo con una forma davvero negativa, da d 7 (prima mai). */
export function quotaNegativi(d: number): number {
  return d < 7 ? 0 : 0.12 + 0.04 * (Math.min(10, d) - 7);
}

/**
 * Tutte le scelte "di struttura" si fanno qui, PRIMA dei tentativi: così le
 * proporzioni delle famiglie (e la forma negativa chiesta una volta su tre)
 * restano esatte, senza che gli scarti le storcano.
 */
function piano(d: number, rng: Rng): Piano {
  const base = { sottoZero: false, negativa: null, ruoli: [] as number[], chiesta: 0, varianteUno: 'sola' as VarianteUno };
  // Una forma sola fino a d 1,3, poi si passa alle due forme entro d 2.
  if (rng() >= tra(d, 1.3, 2)) {
    const x = rng();
    const varianteUno: VarianteUno =
      d < 0.5 ? 'sola' : d < 1 ? (x < 0.65 ? 'sola' : 'peso') : x < 0.25 ? 'sola' : x < 0.6 ? 'peso' : 'lati';
    return { ...base, tipo: 'uno', nForme: 1, maxPeso: 9, maxPezzi: 5, varianteUno };
  }
  const tre = rng() < tra(d, 5.5, 6.5);
  const nForme = tre ? 3 : 2;
  const scala = tre ? rng() < 0.7 * (1 - tra(d, 5.5, 7)) : rng() >= tra(d, 2.6, 4.2);
  const sottoZero = d >= 7;
  // I negativi solo nelle bilance "libere" (da d 7 sono tutte libere): nella
  // scala la forma diretta negativa lascerebbe un piatto vuoto.
  const negativa = sottoZero && !scala && rng() < quotaNegativi(d) ? intero(rng, 0, nForme - 1) : null;
  const ruoli = mescola(rng, nForme);
  // Nella scala la forma "diretta" si legge da sola: si chiede una delle altre.
  const chiesta = scala ? ruoli[nForme === 2 ? 1 : rng() < 0.65 ? 2 : 1]! : intero(rng, 0, nForme - 1);
  const [maxPeso, maxPezzi] = tre ? (d < 8 ? [12, 4] : [15, 5]) : d < 4.5 ? [9, 3] : [12, 4];
  return { ...base, tipo: scala ? 'scala' : 'libera', nForme, maxPeso, maxPezzi, sottoZero, negativa, ruoli, chiesta };
}

// ── I pezzi ─────────────────────────────────────────────────────────────────

/** Mette le forme sui piatti e il peso numerico sul piatto più leggero, per pareggiare. */
function pareggia(sin: number[], des: number[], pesi: number[]): Bilancia {
  const vs = sin.reduce((s, n, i) => s + n * pesi[i]!, 0);
  const vd = des.reduce((s, n, i) => s + n * pesi[i]!, 0);
  return vs >= vd
    ? { sinistra: { forme: sin, peso: 0 }, destra: { forme: des, peso: vs - vd } }
    : { sinistra: { forme: sin, peso: vd - vs }, destra: { forme: des, peso: 0 } };
}

function scambia(b: Bilancia): Bilancia {
  return { sinistra: b.destra, destra: b.sinistra };
}

function forme(nForme: number, pezzi: [number, number][]): number[] {
  const v = new Array<number>(nForme).fill(0);
  for (const [i, n] of pezzi) v[i]! += n;
  return v;
}

/** Bilancia a caso (famiglia "libera"): forme sparse sui due piatti. */
function bilanciaCasuale(pesi: number[], f: Piano, rng: Rng): Bilancia | null {
  const sin = new Array<number>(f.nForme).fill(0);
  const des = new Array<number>(f.nForme).fill(0);
  const pezziSin = intero(rng, 1, f.maxPezzi);
  const pezziDes = intero(rng, 0, f.maxPezzi - 1);
  for (let i = 0; i < pezziSin; i++) sin[intero(rng, 0, f.nForme - 1)]!++;
  for (let i = 0; i < pezziDes; i++) des[intero(rng, 0, f.nForme - 1)]!++;
  // Una forma su entrambi i piatti si semplifica: la togliamo, è più leggibile.
  for (let i = 0; i < f.nForme; i++) {
    const m = Math.min(sin[i]!, des[i]!);
    sin[i]! -= m;
    des[i]! -= m;
  }
  if (sin.every((n) => n === 0)) return null;
  return pareggia(sin, des, pesi);
}

/** Una forma sola: 🔺🔺 = 8 · 🔺🔺 + 3 = 11 · 🔺🔺🔺 = 🔺 + 8 (+ un peso). */
function unaForma(p: Piano, d: number, rng: Rng): { pesi: number[]; bilance: Bilancia[] } {
  const w = d < 0.5 ? intero(rng, 1, 5) : d < 1.5 ? intero(rng, 2, 7) : intero(rng, 2, 9);
  let b: Bilancia;
  if (p.varianteUno === 'sola') {
    const n = intero(rng, 2, d < 0.5 ? 3 : 4);
    b = { sinistra: { forme: [n], peso: 0 }, destra: { forme: [0], peso: n * w } };
  } else if (p.varianteUno === 'peso') {
    const n = intero(rng, 2, d < 1 ? 3 : 4);
    const a = intero(rng, 1, d < 1 ? 5 : 9);
    b = { sinistra: { forme: [n], peso: a }, destra: { forme: [0], peso: n * w + a } };
  } else {
    const n = intero(rng, 2, 5);
    const m = intero(rng, 1, Math.min(n - 1, 6 - n));
    const a = d >= 1.2 && rng() < 0.4 ? intero(rng, 1, 9) : 0;
    b = { sinistra: { forme: [n], peso: a }, destra: { forme: [m], peso: (n - m) * w + a } };
  }
  // All'inizio si legge da sinistra come la spiegazione; poi i piatti si scambiano.
  if (d >= 1 && rng() < 0.5) b = scambia(b);
  return { pesi: [w], bilance: [b] };
}

function pesoCasuale(p: Piano, i: number, max: number, rng: Rng): number {
  return p.negativa === i ? -intero(rng, 1, 9) : intero(rng, 1, max);
}

/**
 * Scala: la prima bilancia ha una forma sola (k·🟦 = c), le altre la legano alle
 * altre forme. Con due forme a d basso l'incrocio è ovvio (la bilancia diretta
 * sta sopra, poche forme); poi i piatti si mescolano.
 */
function scala(p: Piano, d: number, rng: Rng): { pesi: number[]; bilance: Bilancia[] } {
  const [A, B, C] = p.ruoli as [number, number, number?];
  const facile = p.nForme === 2 && d < 2.6;
  const pesi = new Array<number>(p.nForme).fill(0);
  pesi[A] = pesoCasuale(p, A, facile ? 7 : 9, rng);
  pesi[B] = pesoCasuale(p, B, facile ? 7 : p.nForme === 2 ? 9 : 12, rng);
  if (C !== undefined) pesi[C] = pesoCasuale(p, C, 12, rng);

  const k = intero(rng, 1, facile && d < 2.3 ? 2 : 3);
  const diretta = pareggia(forme(p.nForme, [[A, k]]), forme(p.nForme, []), pesi);
  const bilance = [diretta];

  // La seconda lega la forma di mezzo alla diretta: insieme sullo stesso piatto, o contro.
  const pB = intero(rng, 1, 2);
  const qA = intero(rng, 1, 2);
  const insieme = facile || rng() < 0.4;
  bilance.push(
    insieme
      ? pareggia(forme(p.nForme, [[B, pB], [A, qA]]), forme(p.nForme, []), pesi)
      : pareggia(forme(p.nForme, [[B, pB]]), forme(p.nForme, [[A, qA]]), pesi),
  );
  if (C !== undefined) {
    // La terza lega l'ultima forma a quella di mezzo (e a volte anche alla diretta).
    const pC = intero(rng, 1, 2);
    const qB = intero(rng, 1, 2);
    const conA: [number, number][] = rng() < 0.3 ? [[A, 1]] : [];
    bilance.push(
      rng() < 0.5
        ? pareggia(forme(p.nForme, [[C, pC], [B, qB], ...conA]), forme(p.nForme, []), pesi)
        : pareggia(forme(p.nForme, [[C, pC], ...conA]), forme(p.nForme, [[B, qB]]), pesi),
    );
  }
  if (facile) return { pesi, bilance };
  const mescolate = mescola(rng, bilance.length).map((i) => bilance[i]!);
  return { pesi, bilance: mescolate.map((b) => (rng() < 0.5 ? scambia(b) : b)) };
}

function libera(p: Piano, rng: Rng): { pesi: number[]; bilance: Bilancia[] } | null {
  const pesi = Array.from({ length: p.nForme }, (_, i) => pesoCasuale(p, i, p.maxPeso, rng));
  const bilance: Bilancia[] = [];
  for (let k = 0; k < p.nForme; k++) {
    const b = bilanciaCasuale(pesi, p, rng);
    if (!b) return null;
    bilance.push(b);
  }
  return { pesi, bilance };
}

// ── I controlli ─────────────────────────────────────────────────────────────

/** Il limite della forza bruta: largo abbastanza da contenere tutti i pesi veri. */
function limite(p: Piano): number {
  return p.maxPeso + 6;
}

/**
 * Una bilancia da sola basta a trovare la forma chiesta? Sì se la fissa
 * algebricamente, o se chi pensa "i pesi sono tutti positivi" la ricava giusta
 * con quella bilancia sola (forza bruta sui positivi).
 */
function bastaUna(bilance: Bilancia[], nForme: number, chiesta: number, giusta: number, max: number): boolean {
  return bilance.some((b) => {
    if (determina([b], chiesta, nForme)) return true;
    const positivi = valoriPossibili([b], nForme, chiesta, 1, max);
    return positivi.size === 1 && positivi.has(giusta);
  });
}

function valido(p: Piano, pesi: number[], bilance: Bilancia[]): boolean {
  const { nForme, chiesta } = p;
  // Ogni piatto ha qualcosa sopra (con i negativi un piatto può pesare zero, ma non essere vuoto).
  if (bilance.some((b) => vuoto(b.sinistra) || vuoto(b.destra))) return false;
  if (bilance.some((b) => valore(b.sinistra, pesi) !== valore(b.destra, pesi))) return false;
  // Soluzione unica su tutti i numeri.
  if (!determina(bilance, chiesta, nForme)) return false;
  // Regola di papà: dalle due forme in su bisogna incrociare.
  if (nForme >= 2 && bastaUna(bilance, nForme, chiesta, pesi[chiesta]!, limite(p))) return false;
  if (p.negativa !== null) {
    const neg = p.negativa;
    // La forma negativa conta davvero: è fissata anche lei, e senza le sue
    // bilance la forma chiesta non si trova.
    if (!determina(bilance, neg, nForme)) return false;
    const senza = bilance.filter((b) => equazione(b).coef[neg] === 0);
    if (determina(senza, chiesta, nForme)) return false;
  }
  // Ricontrollo con la forza bruta: sui positivi, o anche sui negativi se l'avviso è acceso.
  const max = limite(p);
  const possibili = valoriPossibili(bilance, nForme, chiesta, p.sottoZero ? -max : 1, max);
  return possibili.size === 1 && possibili.has(pesi[chiesta]!);
}

export function genera(d: number, rng: Rng): RoundBilancia {
  const p = piano(d, rng);
  for (let t = 0; t < 800; t++) {
    const c = p.tipo === 'uno' ? unaForma(p, d, rng) : p.tipo === 'scala' ? scala(p, d, rng) : libera(p, rng);
    if (!c || !valido(p, c.pesi, c.bilance)) continue;
    return { ...c, chiesta: p.chiesta, tipo: p.tipo, sottoZero: p.sottoZero };
  }
  return {
    pesi: [4],
    bilance: [{ sinistra: { forme: [3], peso: 0 }, destra: { forme: [0], peso: 12 } }],
    chiesta: 0,
    tipo: 'uno',
    sottoZero: false,
  };
}

// ── Aiuti e soluzione ───────────────────────────────────────────────────────

/** Con una forma sola: k forme contro un numero, dopo aver tolto tutto il togliibile. */
function ridotta(r: RoundBilancia): { k: number; resto: number; semplice: boolean } {
  const b = r.bilance[0]!;
  const { coef, noto } = equazione(b);
  const conForme = (b.sinistra.forme[0] ?? 0) > 0 ? b.sinistra : b.destra;
  const semplice = conForme.peso === 0 && ((b.sinistra.forme[0] ?? 0) === 0 || (b.destra.forme[0] ?? 0) === 0);
  return { k: Math.abs(coef[0] ?? 1), resto: Math.abs(noto), semplice };
}

/** La forma da svelare nel secondo aiuto: quella che sblocca di più, senza regalare la risposta. */
function formaDaSvelare(r: RoundBilancia): number {
  const n = r.pesi.length;
  const altre = r.pesi.map((_, i) => i).filter((i) => i !== r.chiesta);
  const neg = altre.find((i) => r.pesi[i]! < 0);
  if (neg !== undefined) return neg;
  const leggibile = (s: number) => r.bilance.some((b) => determina([b], s, n));
  const sblocca = (s: number) => r.bilance.some((b) => determina([b], r.chiesta, n, [s]));
  return altre.find((s) => sblocca(s) && !leggibile(s)) ?? altre.find(sblocca) ?? altre[0]!;
}

export function aiuti(r: RoundBilancia): string[] {
  const F = FORME[r.chiesta]!;
  if (r.pesi.length === 1) {
    const { k, resto, semplice } = ridotta(r);
    if (semplice) return [`Il peso si divide in parti uguali tra le ${F}.`, `${k} ${F} pesano ${resto}: dividi per ${k}.`];
    return [
      'Puoi togliere la stessa cosa da tutti e due i piatti: la bilancia resta in equilibrio.',
      `Togli tutto quello che puoi: restano ${k} ${F} contro ${resto}. Ora dividi per ${k}.`,
    ];
  }
  const primo =
    r.tipo === 'scala'
      ? 'Parti dalla bilancia con una forma sola: ti dice subito quanto pesa. Poi usalo nelle altre.'
      : 'Cerca la bilancia più semplice e parti da lì. Se una forma compare da entrambe le parti, toglila da tutte e due.';
  const negativa = r.pesi.some((p) => p < 0);
  const s = formaDaSvelare(r);
  const peso = r.pesi[s]!;
  return [
    negativa ? `${primo} Se i conti non tornano, una forma pesa meno di zero 🎈.` : primo,
    peso < 0 ? `${FORME[s]} pesa ${scriviNumero(peso)}: tira su 🎈.` : `${FORME[s]} pesa ${peso}.`,
  ];
}

export function soluzione(r: RoundBilancia): string {
  const pesi = r.pesi.map((p, i) => `${FORME[i]} = ${scriviNumero(p)}${p < 0 ? ' 🎈' : ''}`).join(' · ');
  if (r.pesi.length > 1) return pesi;
  const { k, resto, semplice } = ridotta(r);
  const F = FORME[0];
  // Il momento "aha" quando c'era qualcosa da togliere da tutti e due i piatti.
  if (semplice) return pesi;
  const togli = 'Togli lo stesso da tutti e due i piatti';
  return k === 1 ? `${togli}: resta ${pesi}` : `${togli}: ${F.repeat(k)} = ${resto}, quindi ${pesi}`;
}
