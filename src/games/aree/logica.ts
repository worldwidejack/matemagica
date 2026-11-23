import type { Rng } from '../../engine/caso.ts';
import { intero, scegli } from '../../engine/caso.ts';

/**
 * «Quanto è grande?»: una figura disegnata sulla carta a quadretti, coi lati anche in
 * diagonale; se ne trova l'area in quadretti costruendo sotto un rettangolo grande uguale.
 *
 * Regola di papà: il trucco ovvio è «conto i quadretti interi» (e la variante «conto i
 * quadretti toccati»). Da d = 2 ogni figura ha almeno un lato in diagonale, quindi i due
 * conteggi sbagliano sempre: l'area va ricomposta. Ogni figura nasce come un rettangolo a
 * cui si tolgono pezzi semplici (triangoli d'angolo, tacche, morsi a V, un buco): la via
 * a mente è sempre «il rettangolo che la contiene, meno quello che avanza», ogni triangolo
 * metà del suo rettangolo. Niente formula di Pick.
 *
 * Il secondo trucco è «la metà del rettangolo che la contiene» (vale per tanti triangoli e
 * rombi): da d = 4 riesce sempre meno. Il terzo, più sottile, è «interi + metà dei
 * tagliati»: per un lato solo è esatto (ogni quadretto tagliato ha il suo gemello
 * rovesciato), quindi in alto entrano figure dove due lati storti passano nello stesso
 * quadretto: vertici acuti, parallelogrammi sottili, triangoli con un vertice nell'angolo.
 *
 * La scala non è «figure più grandi»: sale la pendenza dei lati (1:1, poi 1:2, poi 1:3 e
 * 2:3), il numero dei pezzi da togliere, i mezzi quadretti (da d ≈ 5) e il buco (da d ≈ 6).
 */

export type Punto = readonly [x: number, y: number];

/** Un angolo del rettangolo: intatto, tagliato in diagonale, o con una tacca rettangolare. */
export type Angolo = { k: 'no' } | { k: 'tri' | 'tacca'; a: number; b: number };

/** Un morso a V nel lato di sotto: base da x1 a x1 + L, punta in (ax, D). */
export type Morso = { x1: number; L: number; ax: number; D: number };

export type TipoPezzo = 'rettangolo' | 'triangolo' | 'rombo' | 'storto';

/** Un pezzo da togliere: `w × h` è il rettangolo che lo contiene. */
export type Pezzo = { tipo: TipoPezzo; w: number; h: number; area: number; poligono: Punto[]; buco?: boolean };

export type Famiglia =
  | 'rettangolo'
  | 'elle'
  | 'mezzo'
  | 'parallelogramma'
  | 'trapezio'
  | 'rombo'
  | 'angoli'
  | 'ottuso'
  | 'storto'
  | 'quadrato-storto'
  | 'sottile'
  | 'casetta'
  | 'buco';

export type RoundAree = {
  famiglia: Famiglia;
  /** Il rettangolo che contiene la figura, in quadretti (la figura parte da 0, 0; y in su). */
  W: number;
  H: number;
  /** Il contorno, in senso antiorario, vertici sui nodi della quadrettatura. */
  contorno: Punto[];
  buco: Punto[] | null;
  /** I pezzi che si tolgono dal rettangolo W × H (il buco compreso). */
  togli: Pezzo[];
  area: number;
  /** Il rettangolo-misura va anche a mezzi quadretti. Dipende solo dalla difficoltà. */
  mezzi: boolean;
};

/** La risposta: il rettangolo-misura costruito dal giocatore. */
export type Misura = { w: number; h: number };

/** Il rettangolo-misura: fino a 12 quadretti di base e 4 di altezza. */
export const MISURA_W = 12;
export const MISURA_H = 4;
/** Il riquadro della figura sulla carta. */
export const FIGURA_W = 10;
export const FIGURA_H = 6;
export const AREA_MAX = 36;

// ── Geometria ──

export function areaGauss(p: readonly Punto[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i]!;
    const [x2, y2] = p[(i + 1) % p.length]!;
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

const croce = (o: Punto, a: Punto, b: Punto) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Toglie i doppioni consecutivi e i vertici allineati (anche le punte che tornano indietro). */
export function pulisci(p: readonly Punto[]): Punto[] {
  let v = [...p];
  let cambiato = true;
  while (cambiato && v.length >= 3) {
    cambiato = false;
    for (let i = 0; i < v.length; i++) {
      const a = v[(i - 1 + v.length) % v.length]!;
      const b = v[i]!;
      const c = v[(i + 1) % v.length]!;
      if ((a[0] === b[0] && a[1] === b[1]) || croce(a, b, c) === 0) {
        v = v.filter((_, j) => j !== i);
        cambiato = true;
        break;
      }
    }
  }
  return v;
}

function sullaRetta(a: Punto, b: Punto, p: Punto): boolean {
  return croce(a, b, p) === 0 && Math.min(a[0], b[0]) <= p[0] && p[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= p[1] && p[1] <= Math.max(a[1], b[1]);
}

/** Due segmenti si toccano (anche solo in un punto). */
export function siToccano(a: Punto, b: Punto, c: Punto, d: Punto): boolean {
  const d1 = croce(c, d, a);
  const d2 = croce(c, d, b);
  const d3 = croce(a, b, c);
  const d4 = croce(a, b, d);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  return sullaRetta(c, d, a) || sullaRetta(c, d, b) || sullaRetta(a, b, c) || sullaRetta(a, b, d);
}

/** Poligono semplice: i lati non consecutivi non si toccano mai. */
export function semplice(p: readonly Punto[]): boolean {
  const n = p.length;
  if (n < 3) return false;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (siToccano(p[i]!, p[(i + 1) % n]!, p[j]!, p[(j + 1) % n]!)) return false;
    }
  }
  return true;
}

/** Punto dentro (pari-dispari), per punti che non stanno sul contorno. */
export function dentro(p: readonly Punto[], x: number, y: number): boolean {
  let s = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i]!;
    const [xj, yj] = p[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) s = !s;
  }
  return s;
}

// ── Il contorno: rettangolo meno angoli e morsi ──

const NO: Angolo = { k: 'no' };

/** Gli angoli in ordine: in basso a sinistra, in basso a destra, in alto a destra, in alto a sinistra. */
type Quattro = readonly [Angolo, Angolo, Angolo, Angolo];

function cammina(W: number, H: number, ang: Quattro, morsi: readonly Morso[]): Punto[] {
  const [bl, br, tr, tl] = ang;
  const p: Punto[] = [];
  if (bl.k === 'no') p.push([0, 0]);
  else if (bl.k === 'tri') p.push([0, bl.b], [bl.a, 0]);
  else p.push([0, bl.b], [bl.a, bl.b], [bl.a, 0]);
  for (const m of [...morsi].sort((x, y) => x.x1 - y.x1)) p.push([m.x1, 0], [m.ax, m.D], [m.x1 + m.L, 0]);
  if (br.k === 'no') p.push([W, 0]);
  else if (br.k === 'tri') p.push([W - br.a, 0], [W, br.b]);
  else p.push([W - br.a, 0], [W - br.a, br.b], [W, br.b]);
  if (tr.k === 'no') p.push([W, H]);
  else if (tr.k === 'tri') p.push([W, H - tr.b], [W - tr.a, H]);
  else p.push([W, H - tr.b], [W - tr.a, H - tr.b], [W - tr.a, H]);
  if (tl.k === 'no') p.push([0, H]);
  else if (tl.k === 'tri') p.push([tl.a, H], [0, H - tl.b]);
  else p.push([tl.a, H], [tl.a, H - tl.b], [0, H - tl.b]);
  return pulisci(p);
}

function pezziDi(W: number, H: number, ang: Quattro, morsi: readonly Morso[]): Pezzo[] {
  const out: Pezzo[] = [];
  const angoli: [Angolo, Punto, number, number][] = [
    [ang[0], [0, 0], 1, 1],
    [ang[1], [W, 0], -1, 1],
    [ang[2], [W, H], -1, -1],
    [ang[3], [0, H], 1, -1],
  ];
  for (const [g, [x, y], sx, sy] of angoli) {
    if (g.k === 'no') continue;
    if (g.k === 'tri') {
      out.push({ tipo: 'triangolo', w: g.a, h: g.b, area: (g.a * g.b) / 2, poligono: [[x, y], [x + sx * g.a, y], [x, y + sy * g.b]] });
    } else {
      out.push({
        tipo: 'rettangolo',
        w: g.a,
        h: g.b,
        area: g.a * g.b,
        poligono: [[x, y], [x + sx * g.a, y], [x + sx * g.a, y + sy * g.b], [x, y + sy * g.b]],
      });
    }
  }
  for (const m of morsi) {
    out.push({ tipo: 'triangolo', w: m.L, h: m.D, area: (m.L * m.D) / 2, poligono: [[m.x1, 0], [m.x1 + m.L, 0], [m.ax, m.D]] });
  }
  return out;
}

// ── I buchi ──

function bucoDi(tipo: TipoPezzo, x: number, y: number, w: number, h: number): Pezzo {
  let poligono: Punto[];
  let area: number;
  if (tipo === 'rettangolo') {
    poligono = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    area = w * h;
  } else if (tipo === 'rombo') {
    poligono = [[x + w / 2, y], [x + w, y + h / 2], [x + w / 2, y + h], [x, y + h / 2]];
    area = (w * h) / 2;
  } else if (tipo === 'storto') {
    // Quadrato storto 3 × 3: vertici a un quadretto dagli angoli.
    poligono = [[x + 1, y], [x + 3, y + 1], [x + 2, y + 3], [x, y + 2]];
    area = 5;
  } else {
    poligono = [[x, y], [x + w, y], [x, y + h]];
    area = (w * h) / 2;
  }
  return { tipo, w, h, area, poligono, buco: true };
}

// ── Trasformazioni: specchi, così la figura non sta sempre nello stesso verso ──

function specchia(r: RoundAree, sx: boolean, sy: boolean): RoundAree {
  if (!sx && !sy) return r;
  const f = (p: Punto): Punto => [sx ? r.W - p[0] : p[0], sy ? r.H - p[1] : p[1]];
  const gira = sx !== sy;
  const poli = (v: readonly Punto[]) => {
    const m = v.map(f);
    return gira ? m.reverse() : m;
  };
  return {
    ...r,
    contorno: poli(r.contorno),
    buco: r.buco ? poli(r.buco) : null,
    togli: r.togli.map((t) => ({ ...t, poligono: poli(t.poligono) })),
  };
}

/** Le pendenze dei triangoli, come gambe (orizzontale, verticale). */
const P1: readonly (readonly [number, number])[] = [
  [1, 1],
  [2, 2],
  [3, 3],
];
const P2: readonly (readonly [number, number])[] = [
  [1, 2],
  [2, 1],
  [2, 4],
  [4, 2],
];
const P3: readonly (readonly [number, number])[] = [
  [1, 3],
  [3, 1],
  [2, 6],
  [6, 2],
];
const PG: readonly (readonly [number, number])[] = [
  [2, 3],
  [3, 2],
  [3, 4],
  [4, 3],
  [1, 4],
  [4, 1],
];

type Gambe = readonly (readonly [number, number])[];

type Bozza = { famiglia: Famiglia; W: number; H: number; ang: Quattro; morsi?: Morso[]; buco?: Pezzo };

// ── Le famiglie ──

type Generatore = (rng: Rng) => Bozza | null;

const rettangolo: Generatore = (rng) => ({ famiglia: 'rettangolo', W: intero(rng, 2, 6), H: intero(rng, 2, 4), ang: [NO, NO, NO, NO] });

const elle: Generatore = (rng) => {
  const W = intero(rng, 3, 6);
  const H = intero(rng, 3, 5);
  const ang: Angolo[] = [NO, NO, NO, NO];
  const tacche = rng() < 0.6 ? 1 : 2;
  const quali = mescola(rng, [0, 1, 2, 3]).slice(0, tacche);
  for (const q of quali) ang[q] = { k: 'tacca', a: intero(rng, 1, W - 2), b: intero(rng, 1, H - 2) };
  return { famiglia: 'elle', W, H, ang: ang as unknown as Quattro };
};

/** Il triangolo rettangolo: metà del suo rettangolo. */
const mezzo =
  (g: Gambe): Generatore =>
  (rng) => {
    const [a, b] = scegli(rng, g);
    const k = a <= 2 && b <= 2 ? intero(rng, 2, 3) : 1;
    const W = a * k;
    const H = b * k;
    return { famiglia: 'mezzo', W, H, ang: [NO, NO, { k: 'tri', a: W, b: H }, NO] };
  };

/** Parallelogramma: due triangoli uguali tolti ai due angoli opposti. */
const parallelogramma =
  (g: Gambe, sottile = false): Generatore =>
  (rng) => {
    const [s, h] = scegli(rng, g);
    const base = sottile ? intero(rng, 1, Math.max(1, s - 1)) : intero(rng, Math.max(2, s), 6);
    const tri: Angolo = { k: 'tri', a: s, b: h };
    // In piedi o sdraiato.
    if (rng() < 0.5 || h > FIGURA_H) return { famiglia: sottile ? 'sottile' : 'parallelogramma', W: base + s, H: h, ang: [tri, NO, tri, NO] };
    const triV: Angolo = { k: 'tri', a: h, b: s };
    return { famiglia: sottile ? 'sottile' : 'parallelogramma', W: h, H: base + s, ang: [triV, NO, triV, NO] };
  };

/** Trapezio: due triangoli (anche diversi) agli angoli di uno stesso lato, alti quanto la figura. */
const trapezio =
  (g: Gambe): Generatore =>
  (rng) => {
    const [a1, h] = scegli(rng, g);
    const pari = g.filter((x) => x[1] === h);
    const a2 = rng() < 0.4 ? 0 : scegli(rng, pari.length ? pari : [[a1, h] as const])[0];
    const top = intero(rng, 1, 4);
    const W = a1 + a2 + top;
    const ang: Angolo[] = [NO, NO, { k: 'tri', a: a1, b: h }, a2 > 0 ? { k: 'tri', a: a2, b: h } : NO];
    return { famiglia: 'trapezio', W, H: h, ang: ang as unknown as Quattro };
  };

/** Rombo o quadrilatero coi vertici sui quattro lati: il rettangolo meno quattro triangoli. */
const rombo =
  (storto: boolean): Generatore =>
  (rng) => {
    const W = 2 * intero(rng, 2, 4);
    const H = 2 * intero(rng, 1, 3);
    if (!storto) {
      const t: Angolo = { k: 'tri', a: W / 2, b: H / 2 };
      return { famiglia: 'rombo', W, H, ang: [t, t, t, t] };
    }
    const Wq = intero(rng, 4, 8);
    const Hq = intero(rng, 3, FIGURA_H);
    const p = intero(rng, 1, Wq - 1);
    const q = intero(rng, 1, Hq - 1);
    const r = intero(rng, 1, Wq - 1);
    const s = intero(rng, 1, Hq - 1);
    return {
      famiglia: 'rombo',
      W: Wq,
      H: Hq,
      ang: [
        { k: 'tri', a: p, b: s },
        { k: 'tri', a: Wq - p, b: q },
        { k: 'tri', a: Wq - r, b: Hq - q },
        { k: 'tri', a: r, b: Hq - s },
      ],
    };
  };

/** Quadrato storto: lato in diagonale, il rettangolo meno quattro triangoli uguali. */
const quadratoStorto: Generatore = (rng) => {
  const L = intero(rng, 3, FIGURA_H);
  const a = intero(rng, 1, L - 1);
  if (a * 2 === L && rng() < 0.7) return null; // il rombo a metà è il caso facile
  return {
    famiglia: 'quadrato-storto',
    W: L,
    H: L,
    ang: [
      { k: 'tri', a, b: L - a },
      { k: 'tri', a: L - a, b: a },
      { k: 'tri', a, b: L - a },
      { k: 'tri', a: L - a, b: a },
    ],
  };
};

/** Rettangolo con 2-4 angoli tagliati (in diagonale o a tacca) e qualche morso a V. */
const angoli =
  (g: Gambe, minTagli: number, maxTagli: number, pTacca: number, pMorso: number): Generatore =>
  (rng) => {
    const W = intero(rng, 4, 8);
    const H = intero(rng, 3, Math.min(FIGURA_H, Math.floor(48 / W)));
    const n = intero(rng, minTagli, maxTagli);
    const ang: Angolo[] = [NO, NO, NO, NO];
    // Lato in basso: angoli 0 e 1; in alto: 2 e 3 (gamba a, in x). Sinistra: 0 e 3; destra: 1 e 2 (gamba b, in y).
    const vicinoX = [1, 0, 3, 2] as const;
    const vicinoY = [3, 2, 1, 0] as const;
    const gx = (q: number) => (ang[q]!.k === 'no' ? 0 : (ang[q] as { a: number }).a);
    const gy = (q: number) => (ang[q]!.k === 'no' ? 0 : (ang[q] as { b: number }).b);
    for (const q of mescola(rng, [0, 1, 2, 3]).slice(0, n)) {
      const spazioX = W - 1 - gx(vicinoX[q]!);
      const spazioY = H - 1 - gy(vicinoY[q]!);
      if (rng() < pTacca && spazioX >= 1 && spazioY >= 1) {
        ang[q] = { k: 'tacca', a: intero(rng, 1, Math.min(2, spazioX)), b: intero(rng, 1, Math.min(2, spazioY)) };
        continue;
      }
      const stanno = g.filter(([a, b]) => a <= spazioX && b <= spazioY);
      if (stanno.length === 0) continue;
      const [a, b] = scegli(rng, stanno);
      ang[q] = { k: 'tri', a, b };
    }
    if (ang.filter((x) => x.k === 'tri').length < Math.min(2, minTagli)) return null;
    const morsi: Morso[] = [];
    if (rng() < pMorso) {
      const L = intero(rng, 2, 3);
      const sinistra = gx(0);
      const destra = W - gx(1);
      const altezza = H - Math.max(gy(2), gy(3)) - 1;
      if (destra - sinistra >= L + 1 && altezza >= 1) {
        const x1 = intero(rng, sinistra, destra - L);
        morsi.push({ x1, L, ax: x1 + intero(rng, 0, L), D: intero(rng, 1, Math.min(altezza, Math.max(1, H - 2))) });
      }
    }
    return { famiglia: 'angoli', W, H, ang: ang as unknown as Quattro, morsi };
  };

/** Casetta: un rettangolo col tetto, cioè il rettangolo meno i due triangoli di sopra. */
const casetta =
  (g: Gambe): Generatore =>
  (rng) => {
    const [a1, h] = scegli(rng, g);
    const a2s = g.filter((x) => x[1] === h);
    const [a2] = scegli(rng, a2s.length ? a2s : [[a1, h] as const]);
    const muro = intero(rng, 1, 3);
    return { famiglia: 'casetta', W: a1 + a2, H: h + muro, ang: [NO, NO, { k: 'tri', a: a2, b: h }, { k: 'tri', a: a1, b: h }] };
  };

/** Triangolo ottuso: la punta oltre la base. Il rettangolo meno due triangoli. */
const ottuso =
  (maxW: number): Generatore =>
  (rng) => {
    const b = intero(rng, 2, 5);
    const p = intero(rng, 1, Math.max(1, maxW - b));
    const H = intero(rng, 2, FIGURA_H);
    const W = b + p;
    return { famiglia: 'ottuso', W, H, ang: [NO, { k: 'tri', a: p, b: H }, NO, { k: 'tri', a: W, b: H }] };
  };

/** Triangolo con un vertice nell'angolo e gli altri due sui lati lontani: meno tre triangoli. */
const storto: Generatore = (rng) => {
  const W = intero(rng, 3, 8);
  const H = intero(rng, 3, FIGURA_H);
  const a = intero(rng, 1, H - 1);
  const b = intero(rng, 1, W - 1);
  return {
    famiglia: 'storto',
    W,
    H,
    ang: [NO, { k: 'tri', a: W, b: a }, { k: 'tri', a: W - b, b: H - a }, { k: 'tri', a: b, b: H }],
  };
};

/** Il buco dentro una figura: il rettangolo (o una figura ad angoli) meno il buco. */
const conBuco =
  (fuori: Generatore, tipi: readonly TipoPezzo[]): Generatore =>
  (rng) => {
    const f = fuori(rng);
    if (!f) return null;
    const contorno = cammina(f.W, f.H, f.ang, f.morsi ?? []);
    for (let k = 0; k < 12; k++) {
      const tipo = scegli(rng, tipi);
      let w: number;
      let h: number;
      if (tipo === 'storto') [w, h] = [3, 3];
      else if (tipo === 'rombo') [w, h] = [2 * intero(rng, 1, 2), 2 * intero(rng, 1, 2)];
      else if (tipo === 'triangolo') [w, h] = [intero(rng, 1, 3), intero(rng, 1, 3)];
      else [w, h] = [intero(rng, 1, 2), intero(rng, 1, 2)];
      if (f.W - 2 < w || f.H - 2 < h) continue;
      const x = intero(rng, 1, f.W - 1 - w);
      const y = intero(rng, 1, f.H - 1 - h);
      const buco = bucoDi(tipo, x, y, w, h);
      if (tipo === 'triangolo' && rng() < 0.5) buco.poligono = [[x + w, y + h], [x, y + h], [x + w, y]];
      if (bucoDentro(contorno, buco.poligono)) return { ...f, famiglia: 'buco', buco };
    }
    return null;
  };

const rettangoloPieno: Generatore = (rng) => ({ famiglia: 'rettangolo', W: intero(rng, 4, 8), H: intero(rng, 4, FIGURA_H), ang: [NO, NO, NO, NO] });

function mescola<T>(rng: Rng, v: readonly T[]): T[] {
  const a = [...v];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// ── Montaggio e controlli ──

/** Il buco sta dentro la figura, lontano almeno mezzo quadretto dal contorno. */
function bucoDentro(contorno: readonly Punto[], buco: readonly Punto[]): boolean {
  const xs = buco.map((p) => p[0]);
  const ys = buco.map((p) => p[1]);
  const x0 = Math.min(...xs) - 0.5;
  const x1 = Math.max(...xs) + 0.5;
  const y0 = Math.min(...ys) - 0.5;
  const y1 = Math.max(...ys) + 0.5;
  for (let x = x0; x <= x1 + 1e-9; x += 0.25) {
    for (let y = y0; y <= y1 + 1e-9; y += 0.25) {
      if (!dentro(contorno, x + 1e-4, y + 1e-4)) return false;
    }
  }
  return true;
}

function monta(b: Bozza, mezzi: boolean): RoundAree | null {
  const { W, H, ang } = b;
  if (W < 1 || H < 1 || W > FIGURA_W || H > FIGURA_H) return null;
  for (const g of ang) if (g.k !== 'no' && (g.a < 1 || g.b < 1 || g.a > W || g.b > H)) return null;
  const morsi = b.morsi ?? [];
  const contorno = cammina(W, H, ang, morsi);
  if (contorno.length < 3 || !semplice(contorno)) return null;
  const togli = pezziDi(W, H, ang, morsi);
  let area = W * H - togli.reduce((s, t) => s + t.area, 0);
  if (Math.abs(areaGauss(contorno) - area) > 1e-9) return null;
  // Il riquadro deve restare pieno: la figura tocca tutti e quattro i lati.
  const xs = contorno.map((p) => p[0]);
  const ys = contorno.map((p) => p[1]);
  if (Math.min(...xs) !== 0 || Math.max(...xs) !== W || Math.min(...ys) !== 0 || Math.max(...ys) !== H) return null;
  let buco: Punto[] | null = null;
  if (b.buco) {
    if (!bucoDentro(contorno, b.buco.poligono)) return null;
    buco = b.buco.poligono;
    togli.push(b.buco);
    area -= b.buco.area;
  }
  if (togli.length > 5) return null;
  if (area < 2 || area > AREA_MAX) return null;
  if (!mezzi && !Number.isInteger(area)) return null;
  if (!Number.isInteger(area * 2)) return null;
  if (misureGiuste(area, mezzi).length === 0) return null;
  return { famiglia: b.famiglia, W, H, contorno, buco, togli, area, mezzi };
}

// ── Il gesto ──

export function passo(mezzi: boolean): number {
  return mezzi ? 0.5 : 1;
}

/** Tutti i rettangoli-misura che il gesto sa fare. */
export function misurePossibili(mezzi: boolean): Misura[] {
  const s = passo(mezzi);
  const out: Misura[] = [];
  for (let w = s; w <= MISURA_W + 1e-9; w += s) for (let h = s; h <= MISURA_H + 1e-9; h += s) out.push({ w, h });
  return out;
}

export function misureGiuste(area: number, mezzi: boolean): Misura[] {
  return misurePossibili(mezzi).filter((m) => Math.abs(m.w * m.h - area) < 1e-9);
}

export function giusta(r: RoundAree, m: Misura): boolean {
  const s = passo(r.mezzi);
  const sulPasso = (x: number) => Math.abs(x / s - Math.round(x / s)) < 1e-9 && x > 0;
  return sulPasso(m.w) && sulPasso(m.h) && m.w <= MISURA_W && m.h <= MISURA_H && Math.abs(m.w * m.h - r.area) < 1e-9;
}

/** Il rettangolo da mostrare come risposta: il più «quadrato» fra quelli giusti. */
export function misuraMostrata(r: RoundAree): Misura {
  const g = misureGiuste(r.area, r.mezzi);
  return [...g].sort((a, b) => Math.abs(a.w - a.h * 2) - Math.abs(b.w - b.h * 2))[0] ?? { w: r.area, h: 1 };
}

// ── Le tabelle per difficoltà ──

type Voce = readonly [peso: number, genera: Generatore];

/** T0 a d=0, T1 a d=2 … T5 a d=10; in mezzo, la tabella dopo con probabilità crescente. */
const TABELLE: readonly (readonly Voce[])[] = [
  [
    [0.25, rettangolo],
    [0.35, elle],
    [0.4, mezzo(P1)],
  ],
  [
    [0.27, mezzo([...P1, ...P2])],
    [0.27, parallelogramma(P1)],
    [0.28, trapezio(P1)],
    [0.08, rombo(false)],
    [0.1, casetta(P1)],
  ],
  [
    [0.2, parallelogramma([...P1, ...P2])],
    [0.2, trapezio(P2)],
    [0.4, angoli([...P1, ...P2], 2, 3, 0.15, 0)],
    [0.14, casetta(P2)],
    [0.04, rombo(false)],
  ],
  [
    [0.24, angoli([...P2, ...P3], 3, 4, 0.2, 0.3)],
    [0.16, storto],
    [0.14, ottuso(7)],
    [0.1, quadratoStorto],
    [0.12, parallelogramma(P3, true)],
    [0.1, trapezio(P3)],
    [0.08, rombo(true)],
    [0.06, conBuco(rettangoloPieno, ['triangolo', 'rombo'])],
  ],
  [
    [0.22, angoli([...P2, ...P3, ...PG], 3, 4, 0.2, 0.4)],
    [0.18, storto],
    [0.12, ottuso(9)],
    [0.06, quadratoStorto],
    [0.12, parallelogramma([...P3, ...PG], true)],
    [0.1, conBuco(rettangoloPieno, ['rombo', 'triangolo', 'storto'])],
    [0.2, conBuco(angoli([...P2, ...P3], 3, 4, 0, 0.2), ['triangolo', 'rombo', 'rettangolo'])],
  ],
  [
    [0.2, angoli([...P3, ...PG], 3, 4, 0.2, 0.5)],
    [0.16, storto],
    [0.1, ottuso(9)],
    [0.04, quadratoStorto],
    [0.1, parallelogramma([...P3, ...PG], true)],
    [0.08, conBuco(rettangoloPieno, ['triangolo', 'storto', 'rombo'])],
    [0.28, conBuco(angoli([...P2, ...P3], 3, 4, 0, 0.3), ['triangolo', 'rombo', 'rettangolo'])],
  ],
];

function pesca(tab: readonly Voce[], rng: Rng): Generatore {
  const tot = tab.reduce((s, v) => s + v[0], 0);
  let x = rng() * tot;
  for (const v of tab) {
    x -= v[0];
    if (x < 0) return v[1];
  }
  return tab[tab.length - 1]![1];
}

/** I mezzi quadretti entrano da d = 5. */
export function conMezzi(d: number): boolean {
  return d >= 5;
}

export function genera(d: number, rng: Rng): RoundAree {
  const dd = Math.max(0, Math.min(10, d));
  const base = Math.min(5, Math.floor(dd / 2));
  const t = base >= 5 ? 0 : (dd - base * 2) / 2;
  const tab = TABELLE[rng() < t ? Math.min(5, base + 1) : base] ?? TABELLE[0]!;
  const mezzi = conMezzi(dd);
  for (let k = 0; k < 200; k++) {
    const b = pesca(tab, rng)(rng);
    if (!b) continue;
    const r = monta(b, mezzi);
    if (r) return specchia(r, rng() < 0.5, rng() < 0.5);
  }
  return monta({ famiglia: 'mezzo', W: 4, H: 3, ang: [NO, NO, { k: 'tri', a: 4, b: 3 }, NO] }, mezzi)!;
}

// ── Le parole: aiuti e soluzione ──

/** 7.5 → «7½», 0.5 → «½». */
export function testo(x: number): string {
  const n = Math.floor(x + 1e-9);
  const mezzo = Math.abs(x - n - 0.5) < 1e-9;
  return mezzo ? (n === 0 ? '½' : `${n}½`) : String(Math.round(x));
}

function nomePezzo(p: Pezzo): string {
  if (p.buco) {
    if (p.tipo === 'storto') return `il buco storto (3 × 3 meno 4 triangoli da 1 = 5)`;
    if (p.tipo === 'rombo') return `il buco a rombo (metà di ${p.w} × ${p.h} = ${testo(p.area)})`;
    if (p.tipo === 'triangolo') return `il buco a triangolo (metà di ${p.w} × ${p.h} = ${testo(p.area)})`;
    return `il buco ${p.w} × ${p.h} = ${testo(p.area)}`;
  }
  if (p.tipo === 'triangolo') return `metà di ${p.w} × ${p.h} = ${testo(p.area)}`;
  return `la tacca ${p.w} × ${p.h} = ${testo(p.area)}`;
}

/** Un triangolo rettangolo solo, metà esatta del suo rettangolo. */
function eMezzo(r: RoundAree): boolean {
  return r.togli.length === 1 && r.togli[0]!.tipo === 'triangolo' && !r.togli[0]!.buco && r.togli[0]!.area * 2 === r.W * r.H;
}

export function aiuti(r: RoundAree): string[] {
  const box = `Chiudila nel rettangolo che la contiene: ${r.W} × ${r.H} = ${r.W * r.H} quadretti.`;
  if (r.togli.length === 0) return [`È già un rettangolo: quante righe, quanti quadretti per riga?`];
  if (eMezzo(r)) return [box, 'Il triangolo è metà di quel rettangolo: la diagonale lo taglia in due pezzi uguali.'];
  const triangoli = r.togli.filter((p) => p.tipo === 'triangolo' && !p.buco).length;
  const cosa = [
    triangoli ? `${triangoli === 1 ? 'un triangolo' : `${triangoli} triangoli`}` : '',
    r.togli.some((p) => p.tipo === 'rettangolo' && !p.buco) ? 'una tacca' : '',
    r.buco ? 'il buco' : '',
  ]
    .filter(Boolean)
    .join(', ');
  const t = r.togli.find((p) => p.tipo === 'triangolo');
  const secondo = `Ora togli quello che avanza (${cosa}).` + (t ? ` Ogni triangolo è metà del suo rettangolo: metà di ${t.w} × ${t.h} fa ${testo(t.area)}.` : '');
  const terzo = `Da togliere: ${r.togli.map(nomePezzo).join('; ')}.`;
  return [box, secondo, terzo];
}

export function soluzione(r: RoundAree): string {
  const tot = r.W * r.H;
  if (r.togli.length === 0) return `${r.W} × ${r.H} = ${testo(r.area)} quadretti.`;
  if (eMezzo(r)) return `È metà del rettangolo ${r.W} × ${r.H}: ${tot} : 2 = ${testo(r.area)} quadretti.`;
  const via = r.togli.reduce((s, p) => s + p.area, 0);
  const pezzi = r.togli.map((p) => testo(p.area));
  const meno = pezzi.length === 1 ? `meno ${pezzi[0]}` : `meno ${pezzi.join(' + ')} = ${testo(via)}`;
  return `${r.W} × ${r.H} = ${tot}, ${meno}: restano ${testo(r.area)} quadretti.`;
}
