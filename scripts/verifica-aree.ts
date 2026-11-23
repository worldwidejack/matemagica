/**
 * Verifica di «Quanto è grande?»: 3000 figure per ogni difficoltà 0-10.
 * L'area si ricalcola in tre modi indipendenti dal gioco: formula di Gauss sui vertici,
 * teorema di Pick (nodi dentro e sul contorno) e somma esatta dei pezzi di figura in ogni
 * quadretto (ogni quadretto ritagliato col poligono). Più il conto del gioco: il
 * rettangolo meno i pezzi. Poi il gesto: ogni area si costruisce col rettangolo-misura e
 * `giusta` accetta tutti e soli i rettangoli grandi uguale. Infine i trucchi (la regola di papà).
 *
 *   node scripts/verifica-aree.ts
 */
import { rngConSeme } from '../src/engine/caso.ts';
import * as g from '../src/games/aree/logica.ts';

type P = readonly [number, number];

const rng = rngConSeme(29);
const N = 3000;
let problemi = 0;

function controlla(cond: boolean, msg: string) {
  if (!cond) {
    problemi++;
    if (problemi < 15) console.log('  ✗ ' + msg);
  }
}

// ── Tre aree indipendenti ──

function gauss(p: readonly P[]): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i]!;
    const b = p[(i + 1) % p.length]!;
    s += (a[0] + b[0]) * (b[1] - a[1]);
  }
  return Math.abs(s) / 2;
}

const mcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : mcd(b, a % b));

function dentroRaggio(p: readonly P[], x: number, y: number): boolean {
  let s = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i]!;
    const [xj, yj] = p[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) s = !s;
  }
  return s;
}

function sulBordo(p: readonly P[], x: number, y: number): boolean {
  for (let i = 0; i < p.length; i++) {
    const [ax, ay] = p[i]!;
    const [bx, by] = p[(i + 1) % p.length]!;
    if ((bx - ax) * (y - ay) - (by - ay) * (x - ax) === 0 && Math.min(ax, bx) <= x && x <= Math.max(ax, bx) && Math.min(ay, by) <= y && y <= Math.max(ay, by)) return true;
  }
  return false;
}

/** Pick: A = I + B/2 − 1, con I e B contati sui nodi. */
function pick(p: readonly P[]): number {
  let B = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i]!;
    const b = p[(i + 1) % p.length]!;
    B += mcd(b[0] - a[0], b[1] - a[1]);
  }
  const xs = p.map((q) => q[0]);
  const ys = p.map((q) => q[1]);
  let I = 0;
  for (let x = Math.min(...xs); x <= Math.max(...xs); x++) {
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      if (!sulBordo(p, x, y) && dentroRaggio(p, x, y)) I++;
    }
  }
  return I + B / 2 - 1;
}

/** Sutherland–Hodgman: il pezzo di poligono dentro il quadretto [x, x+1] × [y, y+1]. */
function ritaglia(p: readonly P[], x: number, y: number): P[] {
  const lati: [(q: P) => boolean, (a: P, b: P) => P][] = [
    [(q) => q[0] >= x, (a, b) => [x, a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])]],
    [(q) => q[0] <= x + 1, (a, b) => [x + 1, a[1] + ((b[1] - a[1]) * (x + 1 - a[0])) / (b[0] - a[0])]],
    [(q) => q[1] >= y, (a, b) => [a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]), y]],
    [(q) => q[1] <= y + 1, (a, b) => [a[0] + ((b[0] - a[0]) * (y + 1 - a[1])) / (b[1] - a[1]), y + 1]],
  ];
  let out: P[] = [...p];
  for (const [den, taglio] of lati) {
    const prima = out;
    out = [];
    for (let i = 0; i < prima.length; i++) {
      const a = prima[i]!;
      const b = prima[(i + 1) % prima.length]!;
      if (den(b)) {
        if (!den(a)) out.push(taglio(a, b));
        out.push(b);
      } else if (den(a)) out.push(taglio(a, b));
    }
    if (out.length === 0) break;
  }
  return out;
}

/** Quanto di ogni quadretto è figura (contorno meno buco), in esatto. */
function celle(r: g.RoundAree): number[] {
  const out: number[] = [];
  for (let x = 0; x < r.W; x++) {
    for (let y = 0; y < r.H; y++) {
      const fuori = ritaglia(r.contorno, x, y);
      const dentroBuco = r.buco ? ritaglia(r.buco, x, y) : [];
      out.push((fuori.length >= 3 ? gauss(fuori) : 0) - (dentroBuco.length >= 3 ? gauss(dentroBuco) : 0));
    }
  }
  return out;
}

// ── Quanto storti i lati ──

function pendenze(r: g.RoundAree): Set<string> {
  const s = new Set<string>();
  for (const poli of [r.contorno, r.buco ?? []]) {
    for (let i = 0; i < poli.length; i++) {
      const a = poli[i]!;
      const b = poli[(i + 1) % poli.length]!;
      const dx = Math.abs(b[0] - a[0]);
      const dy = Math.abs(b[1] - a[1]);
      if (dx === 0 || dy === 0) continue;
      const m = mcd(dx, dy);
      const [p, q] = [Math.min(dx, dy) / m, Math.max(dx, dy) / m];
      s.add(`${p}:${q}`);
    }
  }
  return s;
}

// ── Il giro ──

type Conti = {
  n: number;
  interi: number;
  toccati: number;
  mezzoTagliati: number;
  metaBox: number;
  box: number;
  mezzi: number;
  buchi: number;
  storti: number;
  ripidi: number;
  pezzi: number;
  aree: number[];
  famiglie: Map<string, number>;
};
const conti: Conti[] = [];
const t0 = performance.now();
let lento = 0;
const possibili = [g.misurePossibili(false), g.misurePossibili(true)] as const;

for (let d = 0; d <= 10; d++) {
  const c: Conti = { n: 0, interi: 0, toccati: 0, mezzoTagliati: 0, metaBox: 0, box: 0, mezzi: 0, buchi: 0, storti: 0, ripidi: 0, pezzi: 0, aree: [], famiglie: new Map() };
  for (let k = 0; k < N; k++) {
    const t = performance.now();
    const r = g.genera(d, rng);
    lento = Math.max(lento, performance.now() - t);
    const id = `d${d} ${r.famiglia} ${r.W}×${r.H} [${r.contorno.map((p) => p.join(',')).join(' ')}]${r.buco ? ' buco' : ''}`;

    // Forma.
    const tutti = [...r.contorno, ...(r.buco ?? [])];
    controlla(tutti.every(([x, y]) => Number.isInteger(x) && Number.isInteger(y)), `${id}: vertice fuori dai nodi`);
    controlla(tutti.every(([x, y]) => x >= 0 && x <= r.W && y >= 0 && y <= r.H), `${id}: vertice fuori dal rettangolo`);
    controlla(r.W <= g.FIGURA_W && r.H <= g.FIGURA_H, `${id}: non entra nella carta`);
    controlla(g.semplice(r.contorno) && (!r.buco || g.semplice(r.buco)), `${id}: contorno che si incrocia`);
    controlla(g.areaGauss(r.contorno) > 0 && (!r.buco || g.areaGauss(r.buco) > 0), `${id}: verso sbagliato`);
    if (r.buco) {
      const bucoFuori = r.buco.some(([x, y]) => !dentroRaggio(r.contorno, x, y) || sulBordo(r.contorno, x, y));
      controlla(!bucoFuori, `${id}: il buco esce dalla figura`);
    }

    // L'area in quattro modi.
    const aG = gauss(r.contorno) - (r.buco ? gauss(r.buco) : 0);
    const aP = pick(r.contorno) - (r.buco ? pick(r.buco) : 0);
    const pezzi = celle(r);
    const aC = pezzi.reduce((s, x) => s + x, 0);
    const aD = r.W * r.H - r.togli.reduce((s, p) => s + p.area, 0);
    const ok = (x: number) => Math.abs(x - r.area) < 1e-6;
    controlla(ok(aG), `${id}: Gauss ${aG} ≠ ${r.area}`);
    controlla(ok(aP), `${id}: Pick ${aP} ≠ ${r.area}`);
    controlla(ok(aC), `${id}: quadretti ritagliati ${aC} ≠ ${r.area}`);
    controlla(ok(aD), `${id}: rettangolo meno pezzi ${aD} ≠ ${r.area}`);
    for (const p of r.togli) controlla(Math.abs(gauss(p.poligono) - p.area) < 1e-9, `${id}: pezzo ${p.tipo} con area sbagliata`);
    controlla(Number.isInteger(r.area * 2) && r.area >= 2 && r.area <= g.AREA_MAX, `${id}: area ${r.area} fuori misura`);
    controlla(r.mezzi === g.conMezzi(d), `${id}: i mezzi del gesto dipendono dalla figura`);
    if (!r.mezzi) controlla(Number.isInteger(r.area), `${id}: mezzo quadretto senza il gesto a mezzi`);
    controlla(r.togli.length <= 5, `${id}: troppi pezzi per farla a mente`);
    controlla(r.togli.every((p) => p.w <= g.FIGURA_W && p.h <= g.FIGURA_H && p.area <= 30), `${id}: un pezzo troppo grande per farlo a mente`);

    // Il gesto: raggiungibile, e accettati tutti e soli i rettangoli grandi uguale.
    const giuste = g.misureGiuste(r.area, r.mezzi);
    controlla(giuste.length > 0, `${id}: area ${r.area} che il rettangolo-misura non sa fare`);
    let accettate = 0;
    for (const m of possibili[r.mezzi ? 1 : 0]) {
      const si = g.giusta(r, m);
      if (si) accettate++;
      controlla(si === Math.abs(m.w * m.h - r.area) < 1e-9, `${id}: giusta sbaglia su ${m.w} × ${m.h}`);
    }
    controlla(accettate === giuste.length, `${id}: risposte accettate ${accettate} ≠ ${giuste.length}`);
    controlla(!g.giusta(r, { w: r.area + 0.25, h: 1 }) && !g.giusta(r, { w: 0, h: 5 }) && !g.giusta(r, { w: r.area * 4, h: 0.25 }), `${id}: accetta un rettangolo fuori dal gesto`);
    const mm = g.misuraMostrata(r);
    controlla(g.giusta(r, mm), `${id}: la misura mostrata è sbagliata`);
    controlla(g.aiuti(r).length >= 1 && g.soluzione(r).includes(g.testo(r.area)), `${id}: aiuti o soluzione vuoti`);

    // I trucchi.
    const interi = pezzi.filter((x) => x > 1 - 1e-9).length;
    const toccati = pezzi.filter((x) => x > 1e-9).length;
    c.n++;
    if (interi === r.area) c.interi++;
    if (toccati === r.area) c.toccati++;
    if (Math.abs(interi + (toccati - interi) / 2 - r.area) < 1e-9) c.mezzoTagliati++;
    if (r.W * r.H === r.area * 2) c.metaBox++;
    if (r.W * r.H === r.area) c.box++;
    if (!Number.isInteger(r.area)) c.mezzi++;
    if (r.buco) c.buchi++;
    const pend = pendenze(r);
    if ([...pend].some((s) => s !== '1:1')) c.storti++;
    if ([...pend].some((s) => s !== '1:1' && s !== '1:2')) c.ripidi++;
    c.pezzi += r.togli.length;
    c.aree.push(r.area);
    c.famiglie.set(r.famiglia, (c.famiglie.get(r.famiglia) ?? 0) + 1);
  }
  conti.push(c);
}

const ms = (performance.now() - t0) / (N * 11);
console.log(`\nQuanto è grande?: ${N * 11} figure, ${ms.toFixed(3)} ms medi (verifica compresa), ${lento.toFixed(1)} ms la più lenta a generare`);
const pc = (x: number, n: number) => `${Math.round((x / n) * 100)}%`.padStart(4);
console.log('\n   d | interi | toccati | interi+½ tagliati | metà del rettangolo | rettangolo | mezzi □ | buco | lati non 1:1 | 1:3 o 2:3 | pezzi | area mediana | famiglie');
conti.forEach((c, d) => {
  const aree = [...c.aree].sort((a, b) => a - b);
  const mediana = aree[Math.floor(aree.length / 2)] ?? 0;
  const fam = [...c.famiglie.entries()].sort((a, b) => b[1] - a[1]).map(([f, k]) => `${f}:${Math.round((k / c.n) * 100)}`).join(' ');
  console.log(
    `  ${String(d).padStart(2)} |   ${pc(c.interi, c.n)} |    ${pc(c.toccati, c.n)} |              ${pc(c.mezzoTagliati, c.n)} |                ${pc(c.metaBox, c.n)} |       ${pc(c.box, c.n)} |    ${pc(c.mezzi, c.n)} | ${pc(c.buchi, c.n)} |         ${pc(c.storti, c.n)} |      ${pc(c.ripidi, c.n)} |   ${(c.pezzi / c.n).toFixed(1)} |         ${g.testo(mediana).padStart(4)} | ${fam}`,
  );
});

// Quali aree il rettangolo-misura non sa fare (le figure con quelle aree non escono mai).
for (const mezzi of [false, true]) {
  const no: string[] = [];
  for (let a = 2; a <= g.AREA_MAX; a += mezzi ? 0.5 : 1) if (g.misureGiuste(a, mezzi).length === 0) no.push(g.testo(a));
  console.log(`\nAree che il gesto non fa${mezzi ? ' (a mezzi)' : ''}: ${no.join(' ') || 'nessuna'}`);
}

// Le soglie della regola di papà: se una non regge, esce con errore.
const soglia = (cond: boolean, msg: string) => {
  if (!cond) {
    problemi++;
    console.log('  ✗ soglia: ' + msg);
  }
};
conti.forEach((c, d) => {
  const q = (x: number) => x / c.n;
  if (d >= 2) {
    soglia(q(c.interi) <= 0.03, `d${d}: «conto i quadretti interi» riesce il ${pc(c.interi, c.n)}`);
    soglia(q(c.toccati) <= 0.03, `d${d}: «conto i quadretti toccati» riesce il ${pc(c.toccati, c.n)}`);
    soglia(q(c.box) <= 0.03, `d${d}: ci sono ancora rettangoli pieni`);
  }
  if (d >= 4) soglia(q(c.metaBox) <= 0.25, `d${d}: «metà del rettangolo» riesce il ${pc(c.metaBox, c.n)}`);
  if (d >= 6) soglia(q(c.storti) >= 0.7, `d${d}: troppi lati a 45° (${pc(c.storti, c.n)} storti)`);
  if (d <= 3) soglia(q(c.ripidi) <= 0.1, `d${d}: pendenze 1:3 già all'inizio`);
  if (d >= 7) soglia(q(c.mezzoTagliati) <= 0.6, `d${d}: «interi + metà dei tagliati» riesce il ${pc(c.mezzoTagliati, c.n)}`);
  if (d >= 8) {
    soglia(q(c.buchi) >= 0.15, `d${d}: pochi buchi (${pc(c.buchi, c.n)})`);
    soglia(q(c.mezzi) >= 0.15, `d${d}: pochi mezzi quadretti (${pc(c.mezzi, c.n)})`);
    soglia(c.pezzi / c.n >= 2.5, `d${d}: pochi pezzi da togliere`);
  }
});
const p0 = conti[2]!.pezzi / conti[2]!.n;
const p10 = conti[10]!.pezzi / conti[10]!.n;
soglia(p10 > p0 + 0.8, `la difficoltà non aggiunge pezzi (${p0.toFixed(1)} → ${p10.toFixed(1)})`);

console.log('\nEsempi:');
for (const d of [0, 2, 4, 6, 8, 10]) {
  const xs = Array.from({ length: 3 }, () => g.genera(d, rng));
  console.log(`  d${d}: ${xs.map((r) => `${r.famiglia} → ${g.soluzione(r)}`).join('  ·  ')}`);
}

console.log(problemi === 0 ? '\n✓ Nessun problema.' : `\n✗ ${problemi} problemi.`);
process.exit(problemi === 0 ? 0 : 1);
