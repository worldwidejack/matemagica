import type { Rng } from '../../engine/caso.ts';
import { intero } from '../../engine/caso.ts';

/**
 * «Mini sudoku» (chiesto da papà): una griglia 4 × 4 (riquadri 2 × 2), dalla difficoltà 6
 * una 6 × 6 (riquadri di 2 righe × 3 colonne). In ogni riga, colonna e riquadro ci vanno
 * tutti i numeri da 1 a n, una volta sola. In cima, a volte, al posto di qualche indizio ci
 * sono dei segni < > fra due caselle vicine: la punta indica la più piccola.
 *
 * Regola di papà: un gioco non deve svuotarsi con un solo trucco. Due trucchi da smontare:
 * 1. «Guardo solo righe e colonne». Da d ≥ 3 righe e colonne NON bastano: senza il vincolo
 *    dei riquadri la griglia ha almeno due soluzioni (contato a forza bruta).
 * 2. «Riempio una dopo l'altra le caselle con un solo candidato» (naked single). A d5 e da
 *    d7 così ci si blocca sempre: serve almeno un «questo numero, in questa riga o riquadro,
 *    può stare solo qui» (hidden single). Più in alto ci si blocca più volte (d8 ≥ 2, d9 ≥ 3,
 *    d10 ≥ 4) e a volte serve un incastro riquadro-riga o una coppia. Nel 4 × 4 senza segni
 *    i candidati soli bastano sempre (misurato): lì il trucco si smonta coi segni < >.
 * La soluzione è sempre unica (forza bruta che conta fino a 2) e si trova sempre ragionando,
 * senza tirare a indovinare: il risolutore «umano» qui sotto ci arriva.
 */

export type Lato = 4 | 6;
/** valore[a] < valore[b]; a e b sono caselle vicine (stessa riga o stessa colonna). */
export type Segno = { a: number; b: number };
/** Le tecniche del risolutore umano, dalla più facile. */
export type Tecnica = 'sola' | 'nascosta' | 'incastro' | 'coppia';
export const LIVELLO: Record<Tecnica, 0 | 1 | 2> = { sola: 0, nascosta: 1, incastro: 2, coppia: 2 };

export type Forma = { n: Lato; /** righe del riquadro */ rh: number; /** colonne del riquadro */ rw: number };

export type RoundSudoku = Forma & {
  soluzione: number[];
  date: boolean[];
  segni: Segno[];
  /** La tecnica più difficile che serve (dal risolutore umano). */
  tecnica: Tecnica;
};

export const FORMA: Record<Lato, Forma> = { 4: { n: 4, rh: 2, rw: 2 }, 6: { n: 6, rh: 2, rw: 3 } };

// ── Geometria ────────────────────────────────────────────────────────────

export type TipoUnita = 'riga' | 'colonna' | 'riquadro';
export type Unita = { tipo: TipoUnita; k: number; celle: number[] };

export const riga = (f: Forma, i: number) => Math.floor(i / f.n);
export const colonna = (f: Forma, i: number) => i % f.n;
export const riquadro = (f: Forma, i: number) =>
  Math.floor(riga(f, i) / f.rh) * (f.n / f.rw) + Math.floor(colonna(f, i) / f.rw);

type Geo = { unita: Unita[]; unitaSenza: Unita[]; vicini: number[][]; viciniSenza: number[][] };
const geoCache = new Map<number, Geo>();

function geo(f: Forma): Geo {
  const g = geoCache.get(f.n);
  if (g) return g;
  const n = f.n;
  const celle = Array.from({ length: n * n }, (_, i) => i);
  const righe: Unita[] = Array.from({ length: n }, (_, k) => ({ tipo: 'riga', k, celle: celle.filter((i) => riga(f, i) === k) }));
  const colonne: Unita[] = Array.from({ length: n }, (_, k) => ({ tipo: 'colonna', k, celle: celle.filter((i) => colonna(f, i) === k) }));
  const riquadri: Unita[] = Array.from({ length: n }, (_, k) => ({ tipo: 'riquadro', k, celle: celle.filter((i) => riquadro(f, i) === k) }));
  const unita = [...righe, ...colonne, ...riquadri];
  const unitaSenza = [...righe, ...colonne];
  const viciniDi = (us: Unita[]) =>
    celle.map((i) => [...new Set(us.filter((u) => u.celle.includes(i)).flatMap((u) => u.celle))].filter((j) => j !== i));
  const nuova = { unita, unitaSenza, vicini: viciniDi(unita), viciniSenza: viciniDi(unitaSenza) };
  geoCache.set(f.n, nuova);
  return nuova;
}

export const unitaDi = (f: Forma, conRiquadri = true): Unita[] => (conRiquadri ? geo(f).unita : geo(f).unitaSenza);

const bit = (v: number) => 1 << (v - 1);
const tutti = (n: number) => (1 << n) - 1;
function conta(m: number): number {
  let c = 0;
  for (; m; m &= m - 1) c++;
  return c;
}
/** Il valore (1..n) del bit più basso. */
const minimo = (m: number) => 31 - Math.clz32(m & -m) + 1;
/** Il valore (1..n) del bit più alto. */
const massimo = (m: number) => 32 - Math.clz32(m);
function valori(m: number): number[] {
  const out: number[] = [];
  for (let v = 1; m >> (v - 1); v++) if (m & bit(v)) out.push(v);
  return out;
}

// ── Forza bruta: conta le soluzioni (si ferma a `limite`) ─────────────────

/**
 * Backtracking con la casella più vincolata per prima. `conRiquadri = false` è il trucco
 * «guardo solo righe e colonne»: se così la soluzione è una sola, i riquadri non servono.
 */
export function contaSoluzioni(f: Forma, griglia: readonly number[], segni: readonly Segno[], conRiquadri = true, limite = 2): number {
  const n = f.n;
  const pieno = tutti(n);
  const R = new Array<number>(n).fill(0);
  const C = new Array<number>(n).fill(0);
  const Q = new Array<number>(n).fill(0);
  const v = [...griglia];
  const ri = v.map((_, i) => riga(f, i));
  const co = v.map((_, i) => colonna(f, i));
  const qu = v.map((_, i) => riquadro(f, i));
  for (let i = 0; i < v.length; i++) {
    const x = v[i]!;
    if (!x) continue;
    const b = bit(x);
    if (R[ri[i]!]! & b || C[co[i]!]! & b || (conRiquadri && Q[qu[i]!]! & b)) return 0;
    R[ri[i]!]! |= b;
    C[co[i]!]! |= b;
    Q[qu[i]!]! |= b;
  }
  const lati: { altro: number; piccola: boolean }[][] = v.map(() => []);
  for (const s of segni) {
    lati[s.a]!.push({ altro: s.b, piccola: true });
    lati[s.b]!.push({ altro: s.a, piccola: false });
    if (v[s.a] && v[s.b] && !(v[s.a]! < v[s.b]!)) return 0;
  }
  const vuote = v.flatMap((x, i) => (x ? [] : [i]));
  let trovate = 0;

  const regge = (i: number, x: number) =>
    lati[i]!.every(({ altro, piccola }) => {
      const w = v[altro]!;
      if (!w) return piccola ? x < n : x > 1;
      return piccola ? x < w : x > w;
    });

  const giu = (): void => {
    let migliore = -1;
    let mMigliore = 0;
    let quanti = 99;
    for (const i of vuote) {
      if (v[i]) continue;
      const m = pieno & ~(R[ri[i]!]! | C[co[i]!]! | (conRiquadri ? Q[qu[i]!]! : 0));
      const c = conta(m);
      if (c === 0) return;
      if (c < quanti) {
        quanti = c;
        migliore = i;
        mMigliore = m;
        if (c === 1) break;
      }
    }
    if (migliore < 0) {
      trovate++;
      return;
    }
    const i = migliore;
    for (const x of valori(mMigliore)) {
      if (!regge(i, x)) continue;
      const b = bit(x);
      v[i] = x;
      R[ri[i]!]! |= b;
      C[co[i]!]! |= b;
      Q[qu[i]!]! |= b;
      giu();
      v[i] = 0;
      R[ri[i]!]! &= ~b;
      C[co[i]!]! &= ~b;
      Q[qu[i]!]! &= ~b;
      if (trovate >= limite) return;
    }
  };
  giu();
  return trovate;
}

/** Una griglia piena a caso (backtracking con l'ordine dei numeri mescolato). */
export function riempi(f: Forma, rng: Rng): number[] {
  const n = f.n;
  const v = new Array<number>(n * n).fill(0);
  const libero = (i: number, x: number) => geo(f).vicini[i]!.every((j) => v[j] !== x);
  const giu = (i: number): boolean => {
    if (i === v.length) return true;
    const ordine = Array.from({ length: n }, (_, k) => k + 1);
    for (let k = n - 1; k > 0; k--) {
      const j = Math.floor(rng() * (k + 1));
      [ordine[k], ordine[j]] = [ordine[j]!, ordine[k]!];
    }
    for (const x of ordine) {
      if (!libero(i, x)) continue;
      v[i] = x;
      if (giu(i + 1)) return true;
      v[i] = 0;
    }
    return false;
  };
  giu(0);
  return v;
}

// ── Il risolutore «umano» ───────────────────────────────────────────────

export type Passo =
  | { tipo: 'sola'; cella: number; valore: number; segno: boolean }
  | { tipo: 'nascosta'; cella: number; valore: number; unita: Unita; segno: boolean }
  | { tipo: 'incastro'; valore: number; da: Unita; verso: Unita; tolte: number[] }
  | { tipo: 'coppia'; celle: [number, number]; valori: [number, number]; unita: Unita; tolte: number[] };

export type Strada = { griglia: number[]; passi: Passo[]; tecnica: Tecnica };

/**
 * Risolve come una persona: candidati da riga, colonna e riquadro (e dai segni < >), poi
 * a ogni giro la tecnica più facile che fa un passo. `livello` 0 = solo caselle con un
 * candidato (naked single); 1 = anche «può stare solo qui» (hidden single); 2 = anche
 * incastri riquadro-riga e coppie. null se ci si blocca.
 */
export function risolvi(
  f: Forma,
  griglia: readonly number[],
  segni: readonly Segno[],
  livello: 0 | 1 | 2,
  conRiquadri = true,
): Strada | null {
  const n = f.n;
  const g = geo(f);
  const vicini = conRiquadri ? g.vicini : g.viciniSenza;
  const unita = conRiquadri ? g.unita : g.unitaSenza;
  const v = [...griglia];
  const cand = v.map((x, i) => (x ? bit(x) : tutti(n) & ~vicini[i]!.reduce((m, j) => (v[j] ? m | bit(v[j]!) : m), 0)));
  /** Le caselle a cui un segno ha tolto dei candidati: serve a spiegare i passi. */
  const toccate = new Set<number>();
  const passi: Passo[] = [];
  let vuote = v.filter((x) => !x).length;

  const metti = (i: number, x: number) => {
    v[i] = x;
    cand[i] = bit(x);
    vuote--;
    for (const j of vicini[i]!) cand[j]! &= ~bit(x);
  };

  /** I segni tolgono candidati: a < b → a sotto il massimo di b, b sopra il minimo di a. */
  const propagaSegni = (): boolean => {
    let cambiato = true;
    while (cambiato) {
      cambiato = false;
      for (const { a, b } of segni) {
        const ca = cand[a]!;
        const cb = cand[b]!;
        if (!ca || !cb) return false;
        const na = ca & (bit(massimo(cb)) - 1);
        const nb = cb & ~((bit(minimo(ca)) << 1) - 1);
        if (na !== ca) {
          cand[a] = na;
          toccate.add(a);
          cambiato = true;
        }
        if (nb !== cb) {
          cand[b] = nb;
          toccate.add(b);
          cambiato = true;
        }
      }
    }
    return true;
  };

  while (vuote > 0) {
    if (!propagaSegni()) return null;
    if (v.some((x, i) => !x && !cand[i])) return null;

    // 1. Una casella con un candidato solo.
    const sola = v.findIndex((x, i) => !x && conta(cand[i]!) === 1);
    if (sola >= 0) {
      const x = minimo(cand[sola]!);
      passi.push({ tipo: 'sola', cella: sola, valore: x, segno: toccate.has(sola) });
      metti(sola, x);
      continue;
    }
    if (livello < 1) return null;

    // 2. Un numero che in una riga, colonna o riquadro può stare in un posto solo.
    let fatto = false;
    for (const u of unita) {
      for (let x = 1; x <= n && !fatto; x++) {
        if (u.celle.some((i) => v[i] === x)) continue;
        const posti = u.celle.filter((i) => !v[i] && cand[i]! & bit(x));
        if (posti.length !== 1) continue;
        const i = posti[0]!;
        passi.push({ tipo: 'nascosta', cella: i, valore: x, unita: u, segno: u.celle.some((j) => j !== i && !v[j] && toccate.has(j)) });
        metti(i, x);
        fatto = true;
      }
      if (fatto) break;
    }
    if (fatto) continue;
    if (livello < 2) return null;

    // 3a. Incastro: in un riquadro il numero sta tutto in una riga (o colonna), o viceversa.
    const righeColonne = unita.filter((u) => u.tipo !== 'riquadro');
    const riquadri = unita.filter((u) => u.tipo === 'riquadro');
    const coppie: [Unita[], Unita[]][] = [
      [riquadri, righeColonne],
      [righeColonne, riquadri],
    ];
    for (const [da, verso] of coppie) {
      for (const u of da) {
        for (let x = 1; x <= n && !fatto; x++) {
          const posti = u.celle.filter((i) => !v[i] && cand[i]! & bit(x));
          if (posti.length < 2) continue;
          const w = verso.find((w) => posti.every((i) => w.celle.includes(i)));
          if (!w) continue;
          const tolte = w.celle.filter((i) => !u.celle.includes(i) && !v[i] && cand[i]! & bit(x));
          if (!tolte.length) continue;
          for (const i of tolte) cand[i]! &= ~bit(x);
          passi.push({ tipo: 'incastro', valore: x, da: u, verso: w, tolte });
          fatto = true;
        }
        if (fatto) break;
      }
      if (fatto) break;
    }
    if (fatto) continue;

    // 3b. Coppia: due caselle di un'unità con gli stessi due candidati se li tengono loro.
    for (const u of unita) {
      const due = u.celle.filter((i) => !v[i] && conta(cand[i]!) === 2);
      for (let p = 0; p < due.length && !fatto; p++) {
        for (let q = p + 1; q < due.length && !fatto; q++) {
          const a = due[p]!;
          const b = due[q]!;
          const m = cand[a]!;
          if (cand[b] !== m) continue;
          const tolte = u.celle.filter((i) => i !== a && i !== b && !v[i] && cand[i]! & m);
          if (!tolte.length) continue;
          for (const i of tolte) cand[i]! &= ~m;
          const [x, y] = valori(m);
          passi.push({ tipo: 'coppia', celle: [a, b], valori: [x!, y!], unita: u, tolte });
          fatto = true;
        }
      }
      if (fatto) break;
    }
    if (fatto) continue;
    return null;
  }
  const tecnica = passi.reduce<Tecnica>((t, p) => (LIVELLO[p.tipo] > LIVELLO[t] ? p.tipo : t), 'sola');
  return { griglia: v, passi, tecnica };
}

/** Il livello minimo di tecnica che basta (0, 1, 2), o null se non basta niente. */
export function livelloRichiesto(f: Forma, griglia: readonly number[], segni: readonly Segno[], conRiquadri = true): 0 | 1 | 2 | null {
  for (const l of [0, 1, 2] as const) if (risolvi(f, griglia, segni, l, conRiquadri)) return l;
  return null;
}

// ── Le fasce ─────────────────────────────────────────────────────────────

type Fascia = {
  n: Lato;
  /** Indizi a cui mirare (si può scendere fino a 3 sotto per centrare la tecnica). */
  indizi: number;
  /** Livello di tecnica che DEVE servire e che basta. */
  min: 0 | 1 | 2;
  max: 0 | 1 | 2;
  /**
   * Quante volte, riempiendo solo le caselle con un candidato, ci si blocca e serve un
   * «può stare solo qui». Se serve un incastro o una coppia conta come blocco duro (∞).
   */
  blocchi: number;
  /** Da qui righe e colonne non bastano: senza riquadri le soluzioni sono ≥ 2. */
  riquadri: boolean;
  /** Probabilità della variante coi segni < >. */
  segni: number;
};

const FASCE: Fascia[] = [
  { n: 4, indizi: 10, min: 0, max: 0, blocchi: 0, riquadri: false, segni: 0 },
  { n: 4, indizi: 8, min: 0, max: 0, blocchi: 0, riquadri: false, segni: 0 },
  { n: 4, indizi: 7, min: 0, max: 1, blocchi: 0, riquadri: false, segni: 0 },
  { n: 4, indizi: 6, min: 0, max: 1, blocchi: 0, riquadri: true, segni: 0 },
  { n: 4, indizi: 5, min: 0, max: 1, blocchi: 0, riquadri: true, segni: 0.4 },
  // Nel 4 × 4 senza segni bastano sempre i candidati soli (misurato): il trucco 2 si
  // smonta coi segni < >, che qui ci sono sempre.
  { n: 4, indizi: 5, min: 1, max: 2, blocchi: 1, riquadri: true, segni: 1 },
  { n: 6, indizi: 17, min: 0, max: 1, blocchi: 0, riquadri: true, segni: 0 },
  { n: 6, indizi: 14, min: 1, max: 1, blocchi: 1, riquadri: true, segni: 0 },
  { n: 6, indizi: 12, min: 1, max: 2, blocchi: 2, riquadri: true, segni: 0.25 },
  { n: 6, indizi: 11, min: 1, max: 2, blocchi: 3, riquadri: true, segni: 0.4 },
  { n: 6, indizi: 10, min: 1, max: 2, blocchi: 4, riquadri: true, segni: 0.5 },
];

/** Quante volte ci si blocca coi soli candidati (∞ se non basta nemmeno il «solo qui»). */
export function blocchi(f: Forma, griglia: readonly number[], segni: readonly Segno[]): number {
  const s = risolvi(f, griglia, segni, 1);
  return s ? s.passi.filter((p) => p.tipo === 'nascosta').length : Infinity;
}

export function fascia(d: number): Fascia {
  return FASCE[Math.max(0, Math.min(10, Math.round(d)))]!;
}

function mescola<T>(rng: Rng, xs: readonly T[]): T[] {
  const a = [...xs];
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(rng() * (k + 1));
    [a[k], a[j]] = [a[j]!, a[k]!];
  }
  return a;
}

/** Le coppie di caselle vicine (destra e sotto). */
function accanto(f: Forma): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < f.n * f.n; i++) {
    if (colonna(f, i) < f.n - 1) out.push([i, i + 1]);
    if (riga(f, i) < f.n - 1) out.push([i, i + f.n]);
  }
  return out;
}

function prova(F: Fascia, conSegni: boolean, rng: Rng, minimoTecnica: 0 | 1 | 2): RoundSudoku | null {
  const f = FORMA[F.n];
  const sol = riempi(f, rng);
  let segni: Segno[] = conSegni
    ? mescola(rng, accanto(f))
        .slice(0, F.n === 6 ? intero(rng, 5, 7) : intero(rng, 5, 6))
        .map(([p, q]) => (sol[p]! < sol[q]! ? { a: p, b: q } : { a: q, b: p }))
    : [];
  const g = [...sol];
  // Coi segni si toglie qualche indizio in più: i segni ne prendono il posto.
  const obiettivo = F.indizi - (conSegni ? 2 : 0);
  const fondo = obiettivo - 3;
  let indizi = g.length;
  const basta = () => {
    const l = livelloRichiesto(f, g, segni);
    if (l === null || l < minimoTecnica || l > F.max) return false;
    if (minimoTecnica > 0 && F.blocchi > 1 && blocchi(f, g, segni) < F.blocchi) return false;
    if (F.riquadri && contaSoluzioni(f, g, segni, false) < 2) return false;
    return true;
  };
  for (const i of mescola(rng, g.map((_, i) => i))) {
    if (indizi <= fondo) break;
    if (indizi <= obiettivo && basta()) break;
    const x = g[i]!;
    g[i] = 0;
    if (risolvi(f, g, segni, F.max)) indizi--;
    else g[i] = x;
  }
  if (conSegni) {
    // Via i segni che non servono: ognuno di quelli rimasti toglie qualcosa.
    for (const s of mescola(rng, segni)) {
      const senza = segni.filter((t) => t !== s);
      if (risolvi(f, g, senza, F.max)) segni = senza;
    }
    if (segni.length < 2 || contaSoluzioni(f, g, [], true) < 2) return null;
  }
  if (!basta()) return null;
  // Controllo finale a forza bruta: una soluzione sola.
  if (contaSoluzioni(f, g, segni) !== 1) return null;
  const strada = risolvi(f, g, segni, F.max);
  if (!strada) return null;
  return { ...f, soluzione: sol, date: g.map((x) => x > 0), segni, tecnica: strada.tecnica };
}

/** Per la verifica: quanti tentativi e quante volte è servita la rete di sicurezza. */
export const contatori = { tentativi: 0, ripieghi: 0 };

export function genera(d: number, rng: Rng): RoundSudoku {
  const F = fascia(d);
  const conSegni = F.segni > 0 && rng() < F.segni;
  for (let t = 0; t < 300; t++) {
    contatori.tentativi++;
    const r = prova(F, conSegni && t < 150, rng, F.min);
    if (r) return r;
  }
  // Rete di sicurezza (non dovrebbe servire: la verifica la conta e la vuole a zero).
  contatori.ripieghi++;
  for (;;) {
    const r = prova(F, false, rng, 0);
    if (r) return r;
  }
}

// ── Controllo e conflitti ───────────────────────────────────────────────

export function corretta(r: RoundSudoku, a: readonly number[]): boolean {
  if (a.length !== r.n * r.n) return false;
  if (a.some((x, i) => !Number.isInteger(x) || x < 1 || x > r.n || (r.date[i] && x !== r.soluzione[i]))) return false;
  if (!unitaDi(r).every((u) => new Set(u.celle.map((i) => a[i])).size === r.n)) return false;
  return r.segni.every((s) => a[s.a]! < a[s.b]!);
}

/** Dove la griglia piena non torna: unità con un doppione e segni non rispettati. */
export function conflitti(r: RoundSudoku, a: readonly number[]): { unita: Unita[]; doppie: Set<number>; segni: number[] } {
  const unita: Unita[] = [];
  const doppie = new Set<number>();
  for (const u of unitaDi(r)) {
    const visti = new Map<number, number[]>();
    for (const i of u.celle) {
      const x = a[i] ?? 0;
      if (!x) continue;
      visti.set(x, [...(visti.get(x) ?? []), i]);
    }
    const doppi = [...visti.values()].filter((c) => c.length > 1);
    if (!doppi.length) continue;
    unita.push(u);
    for (const c of doppi) for (const i of c) if (!r.date[i]) doppie.add(i);
  }
  const segni = r.segni.flatMap((s, k) => (a[s.a] && a[s.b] && !(a[s.a]! < a[s.b]!) ? [k] : []));
  return { unita, doppie, segni };
}

// ── Aiuti e spiegazione ─────────────────────────────────────────────────

const strade = new WeakMap<RoundSudoku, Strada | null>();
export function strada(r: RoundSudoku): Strada | null {
  if (!strade.has(r)) strade.set(r, risolvi(r, r.soluzione.map((x, i) => (r.date[i] ? x : 0)), r.segni, 2));
  return strade.get(r) ?? null;
}

/** «il 2», ma «l'1». */
const ilNumero = (x: number) => (x === 1 ? "l'1" : `il ${x}`);

export const testoCella = (f: Forma, i: number) => `riga ${riga(f, i) + 1}, colonna ${colonna(f, i) + 1}`;

function nomeRiquadro(f: Forma, k: number): string {
  const fasce = f.n / f.rh;
  const banda = Math.floor(k / (f.n / f.rw));
  const lato = k % (f.n / f.rw) === 0 ? 'a sinistra' : 'a destra';
  const alto = banda === 0 ? 'in alto' : banda === fasce - 1 ? 'in basso' : 'al centro';
  return `${alto} ${lato}`;
}

export function nomeUnita(f: Forma, u: Unita): string {
  if (u.tipo === 'riga') return `nella riga ${u.k + 1}`;
  if (u.tipo === 'colonna') return `nella colonna ${u.k + 1}`;
  return `nel riquadro ${nomeRiquadro(f, u.k)}`;
}

function elenco(xs: number[]): string {
  if (xs.length <= 1) return xs.join('');
  return `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`;
}

/** Il perché di un passo, coi numeri di questa griglia. */
function spiega(r: RoundSudoku, p: Passo, prima: readonly number[]): string {
  const segno = r.segni.length ? ' (o un segno lo vieta)' : '';
  switch (p.tipo) {
    case 'sola': {
      const visti = [...new Set(geo(r).vicini[p.cella]!.map((j) => prima[j]!).filter((x) => x > 0))].sort((a, b) => a - b);
      const altri = visti.filter((x) => x !== p.valore);
      const coiSegni = p.segno || altri.length < r.n - 1;
      return `In ${testoCella(r, p.cella)} va ${ilNumero(p.valore)}: riga, colonna e riquadro hanno già ${elenco(altri)}${coiSegni ? ', e il segno accanto toglie il resto' : ''}.`;
    }
    case 'nascosta':
      return `${maiuscola(nomeUnita(r, p.unita))} ${ilNumero(p.valore)} può stare solo in ${testoCella(r, p.cella)}: le altre caselle vedono già un ${p.valore}${p.segno ? segno : ''}.`;
    case 'incastro': {
      const resto = p.verso.tipo === 'riquadro' ? 'nel resto del riquadro' : `nel resto della ${p.verso.tipo}`;
      return `${maiuscola(nomeUnita(r, p.da))} ${ilNumero(p.valore)} può stare solo ${nomeUnita(r, p.verso)}: quindi ${resto} ${ilNumero(p.valore)} non c'è.`;
    }
    case 'coppia':
      return `${maiuscola(nomeUnita(r, p.unita))} due caselle (${testoCella(r, p.celle[0])} e ${testoCella(r, p.celle[1])}) possono avere solo ${p.valori[0]} o ${p.valori[1]}: se li prendono loro, nel resto non ci sono.`;
  }
}

const maiuscola = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** La griglia com'è prima del passo k (indizi più i passi precedenti). */
function primaDel(r: RoundSudoku, s: Strada, k: number): number[] {
  const g = r.soluzione.map((x, i) => (r.date[i] ? x : 0));
  for (const p of s.passi.slice(0, k)) if (p.tipo === 'sola' || p.tipo === 'nascosta') g[p.cella] = p.valore;
  return g;
}

/** Il passo che serve davvero: il primo con la tecnica più difficile (null se bastano i candidati soli). */
export function passoChiave(r: RoundSudoku): { passo: Passo; k: number } | null {
  const s = strada(r);
  if (!s || s.tecnica === 'sola') return null;
  const k = s.passi.findIndex((p) => LIVELLO[p.tipo] === LIVELLO[s.tecnica]);
  const passo = s.passi[k];
  return passo ? { passo, k } : null;
}

export function aiuti(r: RoundSudoku): string[] {
  const s = strada(r);
  const primo = s?.passi[0];
  if (!s || !primo) return [REGOLA(r)];
  const out =
    primo.tipo === 'sola' || primo.tipo === 'nascosta'
      ? [`Comincia da qui: ${testoCella(r, primo.cella)}.`, spiega(r, primo, primaDel(r, s, 0))]
      : [REGOLA(r), spiega(r, primo, primaDel(r, s, 0))];
  const chiave = passoChiave(r);
  if (chiave && chiave.k > 0) out.push(`Quando ti blocchi: ${minuscola(spiega(r, chiave.passo, primaDel(r, s, chiave.k)))}`);
  else {
    const secondo = s.passi[1];
    if (secondo) out.push(`Poi: ${minuscola(spiega(r, secondo, primaDel(r, s, 1)))}`);
  }
  return out;
}

const minuscola = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const REGOLA = (r: RoundSudoku) => `In ogni riga, colonna e riquadro ci vanno i numeri da 1 a ${r.n}, una volta sola.`;

/** Il momento «aha»: il passo che sblocca, coi numeri di questa griglia. */
export function soluzione(r: RoundSudoku): string {
  const s = strada(r);
  const chiave = passoChiave(r);
  const segni = r.segni.length ? ' I segni < > aiutano: la punta indica il più piccolo.' : '';
  if (!s || !chiave) return `Ogni casella aveva un numero solo possibile: bastava incrociare riga, colonna e riquadro.${segni}`;
  return `Il passo furbo: ${minuscola(spiega(r, chiave.passo, primaDel(r, s, chiave.k)))}${segni}`;
}
