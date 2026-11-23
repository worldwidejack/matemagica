/**
 * Verifica di «Mini sudoku»: N griglie per ogni difficoltà 0-10 (di base 4000, cioè 44.000).
 * Con risolutori scritti da capo qui, senza le funzioni del gioco, controlla che ogni griglia
 * sia valida e abbia UNA soluzione sola (forza bruta che conta fino a 2), che i segni < >
 * servano davvero, che `corretta`, `conflitti`, `aiuti` e `soluzione` funzionino; misura i
 * due trucchi (la regola di papà) e il tempo di generazione.
 *
 *   node scripts/verifica-sudoku.ts [N]
 */
import { rngConSeme } from '../src/engine/caso.ts';
import * as g from '../src/games/sudoku/logica.ts';

const rng = rngConSeme(59);
const N = Number(process.argv[2] ?? 4000);
let problemi = 0;

function controlla(cond: boolean, msg: string) {
  if (!cond) {
    problemi++;
    if (problemi < 15) console.log('  ✗ ' + msg);
  }
}

// ── Risolutori indipendenti ─────────────────────────────────────────────

type F = { n: number; rh: number; rw: number };
type Segno = { a: number; b: number };

const cacheUnita = new Map<string, number[][]>();
function unitaVere(f: F, riquadri: boolean): number[][] {
  const chiave = `${f.n}-${riquadri}`;
  const c = cacheUnita.get(chiave);
  if (c) return c;
  const { n, rh, rw } = f;
  const u: number[][] = [];
  for (let r = 0; r < n; r++) u.push(Array.from({ length: n }, (_, c) => r * n + c));
  for (let c = 0; c < n; c++) u.push(Array.from({ length: n }, (_, r) => r * n + c));
  if (riquadri) {
    for (let br = 0; br < n; br += rh)
      for (let bc = 0; bc < n; bc += rw) {
        const b: number[] = [];
        for (let r = br; r < br + rh; r++) for (let c = bc; c < bc + rw; c++) b.push(r * n + c);
        u.push(b);
      }
  }
  cacheUnita.set(chiave, u);
  return u;
}

/** Per ogni casella, le caselle che non possono avere lo stesso numero. */
function viciniVeri(f: F, riquadri: boolean): number[][] {
  const out = Array.from({ length: f.n * f.n }, () => new Set<number>());
  for (const u of unitaVere(f, riquadri)) for (const i of u) for (const j of u) if (i !== j) out[i]!.add(j);
  return out.map((s) => [...s]);
}

/** Forza bruta: quante soluzioni (si ferma a `limite`). */
function contaVere(f: F, griglia: readonly number[], segni: readonly Segno[], riquadri: boolean, limite = 2): number {
  const n = f.n;
  const vic = viciniVeri(f, riquadri);
  const v = [...griglia];
  const segniDi = Array.from({ length: n * n }, () => [] as Segno[]);
  for (const s of segni) {
    segniDi[s.a]!.push(s);
    segniDi[s.b]!.push(s);
  }
  const ok = (i: number, x: number) => {
    for (const j of vic[i]!) if (v[j] === x) return false;
    for (const s of segniDi[i]!) {
      const a = s.a === i ? x : v[s.a]!;
      const b = s.b === i ? x : v[s.b]!;
      if (a && b && !(a < b)) return false;
    }
    return true;
  };
  // Le date devono già rispettare le regole.
  for (let i = 0; i < n * n; i++) {
    const x = v[i]!;
    if (!x) continue;
    v[i] = 0;
    const buono = ok(i, x);
    v[i] = x;
    if (!buono) return 0;
  }
  let trovate = 0;
  const giro = (): void => {
    let migliore = -1;
    let scelte: number[] = [];
    for (let i = 0; i < n * n; i++) {
      if (v[i]) continue;
      const qui: number[] = [];
      for (let x = 1; x <= n; x++) if (ok(i, x)) qui.push(x);
      if (migliore < 0 || qui.length < scelte.length) {
        migliore = i;
        scelte = qui;
        if (!qui.length) return;
      }
    }
    if (migliore < 0) {
      trovate++;
      return;
    }
    for (const x of scelte) {
      v[migliore] = x;
      giro();
      v[migliore] = 0;
      if (trovate >= limite) return;
    }
  };
  giro();
  return trovate;
}

/**
 * Il giocatore del trucco: candidati da righe, colonne (e riquadri se li guarda) e dai segni
 * usati fino in fondo; riempie solo caselle con un candidato, e con `nascoste` anche i numeri
 * che in un'unità possono stare in un posto solo. true se arriva in fondo.
 */
function arrivaInFondo(f: F, griglia: readonly number[], segni: readonly Segno[], riquadri: boolean, nascoste: boolean): boolean {
  const n = f.n;
  const vic = viciniVeri(f, riquadri);
  const unita = unitaVere(f, riquadri);
  const v = [...griglia];
  const cand: Set<number>[] = v.map((x, i) => {
    if (x) return new Set([x]);
    const s = new Set<number>();
    for (let y = 1; y <= n; y++) if (!vic[i]!.some((j) => v[j] === y)) s.add(y);
    return s;
  });
  const metti = (i: number, x: number) => {
    v[i] = x;
    cand[i] = new Set([x]);
    for (const j of vic[i]!) cand[j]!.delete(x);
  };
  for (;;) {
    // Segni: a < b ⇒ a < max(b) e b > min(a), finché cambia qualcosa.
    let cambiato = true;
    while (cambiato) {
      cambiato = false;
      for (const { a, b } of segni) {
        const ca = cand[a]!;
        const cb = cand[b]!;
        if (!ca.size || !cb.size) return false;
        const maxB = Math.max(...cb);
        const minA = Math.min(...ca);
        for (const x of [...ca]) {
          if (x >= maxB) {
            ca.delete(x);
            cambiato = true;
          }
        }
        for (const x of [...cb]) {
          if (x <= minA) {
            cb.delete(x);
            cambiato = true;
          }
        }
      }
    }
    const vuote = v.map((x, i) => (x ? -1 : i)).filter((i) => i >= 0);
    if (!vuote.length) return true;
    if (vuote.some((i) => cand[i]!.size === 0)) return false;
    const sola = vuote.find((i) => cand[i]!.size === 1);
    if (sola !== undefined) {
      metti(sola, [...cand[sola]!][0]!);
      continue;
    }
    if (!nascoste) return false;
    let fatto = false;
    for (const u of unita) {
      for (let x = 1; x <= n && !fatto; x++) {
        if (u.some((i) => v[i] === x)) continue;
        const posti = u.filter((i) => !v[i] && cand[i]!.has(x));
        if (posti.length === 1) {
          metti(posti[0]!, x);
          fatto = true;
        }
      }
      if (fatto) break;
    }
    if (!fatto) return false;
  }
}

/** Una permutazione di 1..n? */
const giusta = (xs: number[], n: number) => xs.length === n && new Set(xs).size === n && xs.every((x) => x >= 1 && x <= n);

// ── Il giro ─────────────────────────────────────────────────────────────

type Conti = {
  n: number;
  lato6: number;
  indizi: number;
  conSegni: number;
  segni: number;
  tecniche: Record<g.Tecnica, number>;
  soloSole: number;
  soloSoleSenzaSegni: number;
  latino: number;
  righeColonne: number;
  blocchi: number;
  blocchiMin: number;
  ms: number;
  msMax: number;
};
const conti: Conti[] = [];
const t0 = performance.now();

for (let d = 0; d <= 10; d++) {
  const F = g.fascia(d);
  const c: Conti = {
    n: 0, lato6: 0, indizi: 0, conSegni: 0, segni: 0,
    tecniche: { sola: 0, nascosta: 0, incastro: 0, coppia: 0 },
    soloSole: 0, soloSoleSenzaSegni: 0, latino: 0, righeColonne: 0, blocchi: 0, blocchiMin: Infinity, ms: 0, msMax: 0,
  };
  for (let k = 0; k < N; k++) {
    const t = performance.now();
    const r = g.genera(d, rng);
    const dt = performance.now() - t;
    c.ms += dt;
    c.msMax = Math.max(c.msMax, dt);
    const f: F = { n: r.n, rh: r.rh, rw: r.rw };
    const n = r.n;
    const id = `d${d} #${k} ${n}×${n}`;
    const sol = r.soluzione;
    const griglia = sol.map((x, i) => (r.date[i] ? x : 0));

    // Validità.
    controlla(sol.length === n * n && r.date.length === n * n, `${id}: misure sbagliate`);
    controlla((n === 4 && r.rh === 2 && r.rw === 2) || (n === 6 && r.rh === 2 && r.rw === 3), `${id}: riquadri sbagliati`);
    controlla(unitaVere(f, true).every((u) => giusta(u.map((i) => sol[i]!), n)), `${id}: la soluzione non è un sudoku`);
    const vistiSegni = new Set<string>();
    for (const { a, b } of r.segni) {
      const vicine = (Math.floor(a / n) === Math.floor(b / n) && Math.abs(a - b) === 1) || Math.abs(a - b) === n;
      controlla(vicine, `${id}: segno fra caselle non vicine (${a}, ${b})`);
      controlla(sol[a]! < sol[b]!, `${id}: segno non rispettato dalla soluzione`);
      const chiave = [a, b].sort((x, y) => x - y).join('-');
      controlla(!vistiSegni.has(chiave), `${id}: segno doppio`);
      vistiSegni.add(chiave);
    }

    // Unica (forza bruta) e i segni servono.
    controlla(contaVere(f, griglia, r.segni, true) === 1, `${id}: non ha una soluzione sola`);
    if (r.segni.length) {
      controlla(r.segni.length >= 2, `${id}: un segno solo`);
      controlla(contaVere(f, griglia, [], true) >= 2, `${id}: i segni non servono (unica anche senza)`);
    }

    // Il gioco: strada umana, controllo, conflitti, aiuti.
    const s = g.strada(r);
    controlla(!!s && s.griglia.every((x, i) => x === sol[i]), `${id}: il risolutore umano non arriva alla soluzione`);
    controlla(g.LIVELLO[r.tecnica] >= F.min && g.LIVELLO[r.tecnica] <= F.max, `${id}: tecnica ${r.tecnica} fuori fascia`);
    controlla(g.corretta(r, sol), `${id}: rifiuta la soluzione`);
    const libere = sol.map((_, i) => i).filter((i) => !r.date[i]);
    // Una griglia piena sbagliata: due caselle libere di una riga con numeri diversi scambiate.
    let sbagliata: number[] | null = null;
    for (const p of libere) {
      const q = libere.find((q) => q !== p && Math.floor(q / n) === Math.floor(p / n) && sol[q] !== sol[p]);
      if (q !== undefined) {
        sbagliata = [...sol];
        [sbagliata[p], sbagliata[q]] = [sol[q]!, sol[p]!];
        break;
      }
    }
    if (!sbagliata && libere.length) {
      sbagliata = [...sol];
      sbagliata[libere[0]!] = (sol[libere[0]!]! % n) + 1;
    }
    if (sbagliata) {
      controlla(!g.corretta(r, sbagliata), `${id}: accetta una griglia sbagliata`);
      const cf = g.conflitti(r, sbagliata);
      controlla(cf.unita.length + cf.segni.length > 0, `${id}: griglia sbagliata senza conflitti`);
    }
    const aiuti = g.aiuti(r);
    controlla(aiuti.length >= 2 && aiuti.every((x) => x.trim().length > 10), `${id}: aiuti vuoti`);
    controlla(g.soluzione(r).trim().length > 10, `${id}: soluzione vuota`);

    // I trucchi, misurati coi risolutori di qui.
    c.n++;
    if (n === 6) c.lato6++;
    c.indizi += r.date.filter(Boolean).length;
    if (r.segni.length) c.conSegni++;
    c.segni += r.segni.length;
    c.tecniche[r.tecnica]++;
    if (arrivaInFondo(f, griglia, r.segni, true, false)) {
      c.soloSole++;
      if (!r.segni.length) c.soloSoleSenzaSegni++;
    }
    if (contaVere(f, griglia, r.segni, false) === 1) c.latino++;
    if (arrivaInFondo(f, griglia, r.segni, false, true)) c.righeColonne++;
    const b = g.blocchi(f as g.Forma, griglia, r.segni);
    c.blocchi += Math.min(b, 20);
    c.blocchiMin = Math.min(c.blocchiMin, b);
    controlla(d < 8 || b >= F.blocchi, `${id}: ci si blocca ${b} volte, ne servono ${F.blocchi}`);
  }
  conti.push(c);
}

const totale = N * 11;
console.log(`\nMini sudoku: ${totale} griglie in ${((performance.now() - t0) / 1000).toFixed(1)} s (verifica compresa); ripieghi ${g.contatori.ripieghi}, tentativi medi ${(g.contatori.tentativi / totale).toFixed(1)}`);
const pc = (x: number, n: number) => `${Math.round((x / n) * 1000) / 10}%`.padStart(6);
console.log('\n   d | lato | indizi | con < > | segni | sola/nascosta/incastro/coppia | solo candidati soli | righe+colonne: uniche | risolte | blocchi (min) | ms medi | ms max');
conti.forEach((c, d) => {
  const t = c.tecniche;
  const mix = [t.sola, t.nascosta, t.incastro, t.coppia].map((x) => String(Math.round((x / c.n) * 100)).padStart(3)).join(' /');
  console.log(
    `  ${String(d).padStart(2)} | ${c.lato6 ? '6×6' : '4×4'}  |  ${(c.indizi / c.n).toFixed(1).padStart(5)} | ${pc(c.conSegni, c.n)} |  ${(c.conSegni ? c.segni / c.conSegni : 0).toFixed(1)}  | ${mix.padEnd(28)} |              ${pc(c.soloSole, c.n)} |                ${pc(c.latino, c.n)} | ${pc(c.righeColonne, c.n)} |   ${(c.blocchi / c.n).toFixed(1).padStart(4)} (${c.blocchiMin === Infinity ? '∞' : c.blocchiMin}) |   ${(c.ms / c.n).toFixed(2).padStart(5)} | ${c.msMax.toFixed(1).padStart(5)}`,
  );
});

// Le soglie: se una non regge, esce con errore.
const soglia = (cond: boolean, msg: string) => {
  if (!cond) {
    problemi++;
    console.log('  ✗ soglia: ' + msg);
  }
};
soglia(g.contatori.ripieghi === 0, `la rete di sicurezza è servita ${g.contatori.ripieghi} volte`);
conti.forEach((c, d) => {
  soglia((c.lato6 === c.n) === d >= 6 && (c.lato6 === 0) === d < 6, `d${d}: lato sbagliato (6 × 6 da d6)`);
  if (d <= 1) soglia(c.soloSole === c.n && c.conSegni === 0, `d${d}: all'inizio devono bastare i candidati soli`);
  // Trucco 1: da d3 righe e colonne non bastano mai.
  if (d >= 3) {
    soglia(c.latino === 0, `d${d}: ${c.latino} griglie uniche anche senza riquadri`);
    soglia(c.righeColonne === 0, `d${d}: ${c.righeColonne} griglie risolte guardando solo righe e colonne`);
  }
  // Trucco 2: a d5 e da d7 i candidati soli non bastano mai.
  if (d === 5 || d >= 7) soglia(c.soloSole === 0, `d${d}: ${c.soloSole} griglie si fanno coi soli candidati soli`);
  if (d >= 8) soglia(c.blocchiMin >= g.fascia(d).blocchi, `d${d}: qualcuna si blocca meno di ${g.fascia(d).blocchi} volte`);
  soglia(c.ms / c.n <= 5, `d${d}: generazione lenta (${(c.ms / c.n).toFixed(2)} ms medi)`);
  soglia(c.msMax <= 150, `d${d}: una generazione ha preso ${c.msMax.toFixed(0)} ms`);
});
// La difficoltà sale: per ogni lato meno indizi, e in cima ci si blocca più spesso.
for (let d = 1; d <= 10; d++) {
  const [a, b] = [conti[d - 1]!, conti[d]!];
  if (d !== 6) soglia(b.indizi / b.n < a.indizi / a.n, `d${d}: gli indizi non scendono (${(a.indizi / a.n).toFixed(1)} → ${(b.indizi / b.n).toFixed(1)})`);
  if (d >= 8) soglia(b.blocchi / b.n > a.blocchi / a.n, `d${d}: non ci si blocca più spesso che a d${d - 1}`);
}

console.log('\nEsempi (· = vuota; a destra i segni, «a<b» con le caselle come riga.colonna):');
const cella = (n: number, i: number) => `${Math.floor(i / n) + 1}.${(i % n) + 1}`;
for (const d of [0, 3, 5, 7, 10]) {
  const r = g.genera(d, rng);
  const righe = Array.from({ length: r.n }, (_, y) =>
    Array.from({ length: r.n }, (_, x) => (r.date[y * r.n + x] ? String(r.soluzione[y * r.n + x]) : '·')).join(''),
  );
  const segni = r.segni.map((s) => `${cella(r.n, s.a)}<${cella(r.n, s.b)}`).join(' ');
  console.log(`  d${d} (${r.tecnica}): ${righe.join(' / ')}${segni ? '   ' + segni : ''}`);
}

console.log(problemi === 0 ? '\n✓ Nessun problema.' : `\n✗ ${problemi} problemi.`);
process.exit(problemi === 0 ? 0 : 1);
