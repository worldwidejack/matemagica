import { isolaDellaTappa, nomeDellaTappa, type Isola, type Punto } from '@/content/isole';
import { SENTIERO, TAPPE_TOTALI, type Livello } from '@/content/sentiero';
import { rngConSeme } from '@/engine/caso';

/**
 * La geometria della mappa «Sassi e isole», calcolata una volta (niente React).
 *
 * Tutto è in UNITÀ: la colonna è larga 100 e ogni altezza scala con la larghezza,
 * così la mappa intera ha proporzioni fisse e ogni punto si mette con left/top in %.
 * Dall'alto in basso: il velo sulla prossima tappa, le tappe raggiunte (la più alta
 * in cima), il fondo di nuvole sotto l'isola 1.
 */

/**
 * Larghezza di un'isola dipinta (su 100). Più larga dell'88% previsto: i 5 sassi, bimbo,
 * gatto e fumetto stanno tutti sulla parte piatta e con meno spazio si accavallavano.
 */
const ISOLA_LARGA = 94;
/** Cielo sopra un'isola: ci sta l'etichetta. */
const SOPRA = 15;
const SOTTO = 3;
/** Il riquadro delle stelle di una costellazione. */
const CIELO_ALTO = 92;
/** La prossima isola, lontana: più piccola. */
const VELO_LARGO = 60;
const FONDO = 30;

export type Riquadro = { x: number; y: number; w: number; h: number };
export type Stellina = { x: number; y: number; r: number; punte: boolean; ammicca: number | null };

type Base = {
  n: number;
  /** In alto, in unità dalla cima della mappa. */
  y: number;
  h: number;
  /** «Altitudine» del cielo in fondo e in cima al pezzo: decide quanto è scuro. */
  cieloSotto: number;
  cieloSopra: number;
  /** In coordinate del pezzo (0-100 × 0-h). */
  stelle: Stellina[];
};

export type PezzoIsola = Base & {
  tipo: 'isola';
  isola: Isola;
  nome: string;
  riquadro: Riquadro;
  monumento: Punto;
  livelli: Livello[];
  sassi: Punto[];
};
export type PezzoCielo = Base & {
  tipo: 'cielo';
  nome: string;
  livelli: Livello[];
  sassi: Punto[];
  nebbia: { cx: number; cy: number; ruota: number };
};
export type PezzoVelo = Base & {
  tipo: 'velo';
  isola?: Isola;
  riquadro?: Riquadro;
  /** Dove finisce la linea di puntini: il primo sasso della prossima isola, nascosto. */
  arrivo: Punto;
};
export type PezzoFondo = Base & { tipo: 'fondo' };
export type Pezzo = PezzoIsola | PezzoCielo | PezzoVelo | PezzoFondo;
export type PezzoTappa = PezzoIsola | PezzoCielo;

export type Mappa = {
  pezzi: Pezzo[];
  alto: number;
  tappaCorrente: number;
  /** Il punto di ogni livello disegnato, per id. */
  posti: Map<string, Punto>;
  /** I sassi disegnati, dal livello 1 in su. */
  percorso: Punto[];
  velo?: PezzoVelo;
};

function stelleDi(seme: number, h: number): Stellina[] {
  const rng = rngConSeme(seme);
  const puntini = Math.round(h / 5);
  const croci = Math.max(2, Math.round(h / 26));
  return Array.from({ length: puntini + croci }, (_, i) => {
    const punte = i < croci;
    return {
      x: 3 + rng() * 94,
      y: 2 + rng() * (h - 4),
      r: punte ? 1.4 + rng() * 1.3 : 0.3 + rng() * 0.35,
      punte,
      ammicca: rng() < 0.3 ? Math.round(rng() * 24) / 10 : null,
    };
  });
}

function pezzoIsola(n: number, isola: Isola, y: number): PezzoIsola {
  const h = SOPRA + ISOLA_LARGA * isola.rapporto + SOTTO;
  // Le isole si alternano appena: le dispari a sinistra, le pari a destra.
  const riquadro = { x: n % 2 === 1 ? 1 : 5, y: y + SOPRA, w: ISOLA_LARGA, h: ISOLA_LARGA * isola.rapporto };
  const dentro = (p: Punto): Punto => ({ x: riquadro.x + p.x * riquadro.w, y: riquadro.y + p.y * riquadro.h });
  return {
    tipo: 'isola',
    n,
    y,
    h,
    cieloSotto: n - 1,
    cieloSopra: n,
    stelle: stelleDi(n * 7919, h),
    isola,
    nome: isola.nome,
    riquadro,
    monumento: dentro(isola.monumento),
    livelli: SENTIERO.slice((n - 1) * 5, n * 5),
    sassi: isola.sassi.map(dentro),
  };
}

/** Una tappa senza isola dipinta: una costellazione, i 5 livelli sono le sue stelle. */
function pezzoCielo(n: number, y: number): PezzoCielo {
  const h = SOPRA + CIELO_ALTO + SOTTO;
  const rng = rngConSeme(n * 7919);
  const lato = rng() < 0.5 ? 1 : -1;
  const sassi = Array.from({ length: 5 }, (_, k) => ({
    x: 50 + lato * (k % 2 === 0 ? -1 : 1) * (12 + rng() * 16),
    y: y + SOPRA + (0.82 - k * 0.18 + (rng() - 0.5) * 0.04) * CIELO_ALTO,
  }));
  return {
    tipo: 'cielo',
    n,
    y,
    h,
    cieloSotto: n - 1,
    cieloSopra: n,
    stelle: stelleDi(n * 104729, h),
    nome: nomeDellaTappa(n),
    livelli: SENTIERO.slice((n - 1) * 5, n * 5),
    sassi,
    nebbia: { cx: 30 + (n % 5) * 10, cy: 30 + (n % 3) * 18, ruota: -30 + (n % 7) * 9 },
  };
}

function pezzoVelo(n: number, y: number): PezzoVelo {
  const isola = isolaDellaTappa(n);
  if (!isola) {
    const h = 74;
    return { tipo: 'velo', n, y, h, cieloSotto: n - 1, cieloSopra: n - 0.4, stelle: stelleDi(n * 31, h), arrivo: { x: 50, y: y + 36 } };
  }
  const w = VELO_LARGO;
  const riquadro = { x: (100 - w) / 2 + (n % 2 === 1 ? -6 : 6), y: y + 8, w, h: w * isola.rapporto };
  const h = 8 + riquadro.h + 20;
  const primo = isola.sassi[0] ?? { x: 0.5, y: 0.5 };
  return {
    tipo: 'velo',
    n,
    y,
    h,
    cieloSotto: n - 1,
    cieloSopra: n - 0.4,
    stelle: stelleDi(n * 31, h),
    isola,
    riquadro,
    arrivo: { x: riquadro.x + primo.x * riquadro.w, y: riquadro.y + primo.y * riquadro.h },
  };
}

/** Tutta la mappa per chi è arrivato al livello di indice `corrente`. */
export function disegnaMappa(corrente: number): Mappa {
  const tappaCorrente = SENTIERO[corrente]?.tappa ?? 1;
  const pezzi: Pezzo[] = [];
  let y = 0;
  let velo: PezzoVelo | undefined;
  if (tappaCorrente < TAPPE_TOTALI) {
    velo = pezzoVelo(tappaCorrente + 1, y);
    pezzi.push(velo);
    y += velo.h;
  }
  // Si disegnano solo le tappe raggiunte, dalla più alta alla prima.
  for (let n = tappaCorrente; n >= 1; n--) {
    const isola = isolaDellaTappa(n);
    const p = isola ? pezzoIsola(n, isola, y) : pezzoCielo(n, y);
    pezzi.push(p);
    y += p.h;
  }
  pezzi.push({ tipo: 'fondo', n: 0, y, h: FONDO, cieloSotto: 0, cieloSopra: 0, stelle: stelleDi(17, FONDO) });
  y += FONDO;

  const posti = new Map<string, Punto>();
  const tappe = pezzi.filter((p): p is PezzoTappa => p.tipo === 'isola' || p.tipo === 'cielo').reverse();
  const percorso: Punto[] = [];
  for (const t of tappe) {
    t.livelli.forEach((l, k) => {
      const p = t.sassi[k];
      if (!p) return;
      posti.set(l.id, p);
      percorso.push(p);
    });
  }
  return { pezzi, alto: y, tappaCorrente, posti, percorso, velo };
}

/**
 * Il colore del cielo a una certa «altitudine»: dall'oltremare dell'isola 1 alla
 * notte scura dell'8ª, poi quasi nero tra le costellazioni. Solo token della palette.
 */
export function cieloA(a: number): string {
  if (a <= 8) {
    const p = Math.round(Math.max(0, a) * 12.5);
    return `color-mix(in oklab, var(--color-notte-700), var(--color-notte-950) ${p}%)`;
  }
  const p = Math.round(Math.min(1, (a - 8) / 4) * 100);
  return `color-mix(in oklab, var(--color-notte-950), var(--color-notte-nero) ${p}%)`;
}

/** Una curva leggera tra due sassi (alternata a destra e a sinistra), come un sentierino. */
export function tracciato(punti: Punto[], alto: number, inizio = 0): string {
  const a = punti[0];
  if (!a) return '';
  let d = `M${a.x.toFixed(2)} ${a.y.toFixed(2)}`;
  for (let i = 1; i < punti.length; i++) {
    const p = punti[i - 1];
    const q = punti[i];
    if (!p || !q) continue;
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const verso = (i + inizio) % 2 === 0 ? 1 : -1;
    const cx = (p.x + q.x) / 2 - dy * 0.14 * verso;
    const cy = Math.min(alto, Math.max(0, (p.y + q.y) / 2 + dx * 0.14 * verso));
    d += ` Q${cx.toFixed(2)} ${cy.toFixed(2)} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
  }
  return d;
}

// ── Dove mettere bimbo, gatto e fumetto: dove non coprono gli altri sassi ──

/** Misure in px dei pezzi intorno al sasso attuale. */
export const MISURE = {
  mago: { w: 42, h: 70 },
  gatto: { w: 27, h: 34 },
  /** Gruppo bimbo + gatto: larghezza, distanza dal centro del sasso, piedi sotto il centro. */
  gruppo: { w: 64, distanza: 14, piedi: 13 },
  fumetto: { w: 160, h: 48 },
} as const;

type Scatola = [number, number, number, number];

function sovrapposto(a: Scatola, b: Scatola): number {
  const w = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
  const h = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  return w > 0 && h > 0 ? w * h : 0;
}

function fuori(a: Scatola, largo: number): number {
  const h = a[3] - a[1];
  return (Math.max(0, 4 - a[0]) + Math.max(0, a[2] - (largo - 4))) * h;
}

/** Bimbo e gatto da un lato del sasso (x, y in px): le due scatole. */
function scatolePersonaggi(x: number, y: number, lato: 'sx' | 'dx'): Scatola[] {
  const { mago, gatto, gruppo } = MISURE;
  const piedi = y + gruppo.piedi;
  // A sinistra: [bimbo][gatto] sasso. A destra si specchiano: sasso [gatto][bimbo].
  if (lato === 'sx') {
    const da = x - gruppo.distanza - gruppo.w;
    return [
      [da, piedi - mago.h, da + mago.w, piedi],
      [x - gruppo.distanza - gatto.w, piedi - gatto.h, x - gruppo.distanza, piedi],
    ];
  }
  const a = x + gruppo.distanza + gruppo.w;
  return [
    [a - mago.w, piedi - mago.h, a, piedi],
    [x + gruppo.distanza, piedi - gatto.h, x + gruppo.distanza + gatto.w, piedi],
  ];
}

export type Disposizione = {
  lato: 'sx' | 'dx';
  /** Spostamento in px del centro del fumetto rispetto al sasso. */
  spostamento: number;
  /** Px tra il centro del sasso e il fumetto (il suo fondo se sta sopra, la cima se sta sotto). */
  distanza: number;
  /** Il fumetto sta sotto il sasso (quando sopra non c'è posto). */
  sotto: boolean;
};

/**
 * Sceglie da che parte stanno bimbo e gatto e dove va il fumetto «Gioca!»: prova
 * qualche posto e tiene quello che copre meno gli altri sassi (e il bimbo), dentro lo
 * schermo. `qui` e `altri` in unità della mappa, `largo` = larghezza della mappa in px,
 * `ostacoli` in px (le etichette delle isole e il bottone del test).
 */
export function disponi(qui: Punto, altri: Punto[], largo: number, ostacoli: Riquadro[] = []): Disposizione {
  const k = largo / 100;
  const x = qui.x * k;
  const y = qui.y * k;
  // Gli altri sassi vicini, con le stelline sotto, e gli ostacoli (etichette, bottoni).
  const sassi: Scatola[] = [
    ...altri
      .map((p) => [p.x * k, p.y * k] as const)
      .filter(([sx, sy]) => Math.abs(sx - x) < 260 && Math.abs(sy - y) < 220)
      .map(([sx, sy]): Scatola => [sx - 28, sy - 18, sx + 28, sy + 32]),
    ...ostacoli.map((o): Scatola => [o.x, o.y, o.x + o.w, o.y + o.h]),
  ];
  const copre = (b: Scatola) => sassi.reduce((s, a) => s + sovrapposto(a, b), 0);

  const lati: ('sx' | 'dx')[] = x > largo / 2 ? ['sx', 'dx'] : ['dx', 'sx'];
  let lato = lati[0] ?? 'sx';
  let meglio = Infinity;
  for (const l of lati) {
    const voto = scatolePersonaggi(x, y, l).reduce((s, b) => s + copre(b) + fuori(b, largo) * 2, 0);
    if (voto < meglio - 1) {
      meglio = voto;
      lato = l;
    }
  }
  const personaggi = scatolePersonaggi(x, y, lato);

  const { w, h } = MISURE.fumetto;
  let scelta: Disposizione = { lato, spostamento: 0, distanza: 30, sotto: false };
  let voto = Infinity;
  // Sopra il sasso è meglio; sotto solo se sopra copre qualcosa.
  const posti = [
    ...[28, 44, 62, 80].map((d) => ({ d, sotto: false, costo: d * 8 })),
    ...[30, 44].map((d) => ({ d, sotto: true, costo: 260 + d * 8 })),
  ];
  for (const { d, sotto, costo } of posti) {
    for (const s of [0, 30, -30, 60, -60, 90, -90]) {
      // Dentro lo schermo, a 6 px dal bordo.
      const c = Math.min(largo - 6 - w / 2, Math.max(6 + w / 2, x + s));
      const b: Scatola = sotto ? [c - w / 2, y + d, c + w / 2, y + d + h] : [c - w / 2, y - d - h, c + w / 2, y - d];
      const v = copre(b) + personaggi.reduce((t, p) => t + sovrapposto(p, b) * 2, 0) + costo + Math.abs(c - x) * 3;
      if (v < voto) {
        voto = v;
        scelta = { lato, spostamento: c - x, distanza: d, sotto };
      }
    }
  }
  return scelta;
}
