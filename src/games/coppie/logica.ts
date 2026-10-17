import type { Rng } from '../../engine/caso.ts';
import { intero, scegli } from '../../engine/caso.ts';

/**
 * "Coppie magiche" — griglia di numeri: tocca due numeri che rispettano la
 * regola scritta sopra. Il più "Candy Crush" dei giochi.
 *
 * Regola di papà: il trucco ovvio è "l'ultima coppia è obbligata, la prendo
 * senza pensare". Per questo dalla fascia 1 in su ci sono numeri esca, che non
 * hanno compagno: fino all'ultimo bisogna controllare.
 *
 * Le regole:
 *   - somma       a + b = obiettivo
 *   - prodotto    a × b = obiettivo
 *   - differenza  il più grande meno il più piccolo = obiettivo
 *   - multiplo    a + b è un multiplo di obiettivo (3, 4, 5…)
 *   - primi       a e b primi e a + b = obiettivo (Goldbach)
 * Differenza, multiplo e primi sono idee di papà (risposte del 16/10: «come
 * introdurre i numeri primi? anche differenze; coppie la cui somma è multiplo
 * di 3»). Somma e prodotto restano la maggioranza in ogni fascia; le regole
 * nuove escono mescolate, ognuna al massimo una griglia su tre o meno.
 */

export type Tipo = 'somma' | 'prodotto' | 'differenza' | 'multiplo' | 'primi';
export type Cella = { id: number; n: number };
/**
 * `obiettivo` è il numero magico; per `multiplo` è il divisore (somma multiplo
 * di 3 → 3). `coppie` è quante coppie si tolgono prima che la griglia finisca:
 * i numeri che restano sono le esche.
 */
export type RoundCoppie = { tipo: Tipo; obiettivo: number; celle: Cella[]; coppie: number };

export function primo(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let k = 2; k * k <= n; k++) if (n % k === 0) return false;
  return true;
}

export function formano(r: Pick<RoundCoppie, 'tipo' | 'obiettivo'>, a: number, b: number): boolean {
  switch (r.tipo) {
    case 'somma':
      return a + b === r.obiettivo;
    case 'prodotto':
      return a * b === r.obiettivo;
    case 'differenza':
      return Math.abs(a - b) === r.obiettivo;
    case 'multiplo':
      return (a + b) % r.obiettivo === 0;
    case 'primi':
      return a + b === r.obiettivo && primo(a) && primo(b);
  }
}

/**
 * Il compagno di `n`, per le regole dove ce n'è uno solo (somma, prodotto,
 * primi). Differenza e multiplo ne hanno più d'uno: null, e vale `formano`.
 */
export function compagno(tipo: Tipo, obiettivo: number, n: number): number | null {
  switch (tipo) {
    case 'somma':
      return obiettivo - n > 0 ? obiettivo - n : null;
    case 'prodotto':
      return obiettivo % n === 0 ? obiettivo / n : null;
    case 'primi':
      return primo(n) && primo(obiettivo - n) ? obiettivo - n : null;
    default:
      return null;
  }
}

/**
 * Quante coppie si riescono a togliere, nel modo peggiore e in quello migliore,
 * provando tutti gli ordini di gioco. Se `minimo < massimo` c'è un vicolo cieco:
 * una mossa giusta che a un certo punto lascia la griglia senza coppie.
 */
export function esplora(r: Pick<RoundCoppie, 'tipo' | 'obiettivo'>, numeri: readonly number[]): { minimo: number; massimo: number } {
  const k = numeri.length;
  const vicini = numeri.map((a, i) => {
    let m = 0;
    numeri.forEach((b, j) => {
      if (j > i && formano(r, a, b)) m |= 1 << j;
    });
    return m;
  });
  const memo = new Map<number, readonly [number, number]>();
  const giro = (mask: number): readonly [number, number] => {
    const visto = memo.get(mask);
    if (visto) return visto;
    let lo = Infinity;
    let hi = 0;
    for (let i = 0; i < k; i++) {
      if (!(mask & (1 << i))) continue;
      let v = (vicini[i] ?? 0) & mask;
      while (v) {
        const bit = v & -v;
        v &= v - 1;
        const [a, b] = giro(mask & ~(1 << i) & ~bit);
        lo = Math.min(lo, a + 1);
        hi = Math.max(hi, b + 1);
      }
    }
    const esito = lo === Infinity ? ([0, 0] as const) : ([lo, hi] as const);
    memo.set(mask, esito);
    return esito;
  };
  const [minimo, massimo] = giro((1 << k) - 1);
  return { minimo, massimo };
}

function mescola<T>(rng: Rng, lista: readonly T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function round(tipo: Tipo, obiettivo: number, numeri: readonly number[], coppie: number, rng: Rng): RoundCoppie {
  const celle = mescola(rng, numeri).map((n, id) => ({ id, n }));
  return { tipo, obiettivo, celle, coppie };
}

/**
 * Per le regole nuove: numeri tutti diversi, almeno un'esca, e qualunque ordine
 * di gioco toglie esattamente `coppie` coppie (niente vicoli ciechi, niente
 * coppie in più).
 */
function regge(tipo: Tipo, obiettivo: number, numeri: readonly number[], coppie: number): boolean {
  if (new Set(numeri).size !== numeri.length || numeri.length <= coppie * 2) return false;
  const { minimo, massimo } = esplora({ tipo, obiettivo }, numeri);
  return minimo === coppie && massimo === coppie;
}

// ── Somma e prodotto (le classiche) ──

type Ricetta = { tipo: Tipo; obiettivo: number; coppie: number; esche: number; coppia: (r: Rng) => [number, number] };

function sommaA(obiettivo: number, min: number): (r: Rng) => [number, number] {
  return (r) => {
    const a = intero(r, min, obiettivo - min);
    return [a, obiettivo - a];
  };
}

function prodottoA(obiettivo: number): (r: Rng) => [number, number] {
  const divisori: number[] = [];
  for (let k = 2; k * k <= obiettivo; k++) if (obiettivo % k === 0) divisori.push(k);
  return (r) => {
    const a = scegli(r, divisori);
    return r() < 0.5 ? [a, obiettivo / a] : [obiettivo / a, a];
  };
}

function ricetta(fascia: number, rng: Rng): Ricetta {
  switch (fascia) {
    case 0:
      return { tipo: 'somma', obiettivo: 10, coppie: 4, esche: 1, coppia: sommaA(10, 1) };
    case 1: {
      const obiettivo = scegli(rng, [10, 20]);
      return { tipo: 'somma', obiettivo, coppie: 5, esche: 2, coppia: sommaA(obiettivo, 1) };
    }
    case 2:
      return { tipo: 'somma', obiettivo: 100, coppie: 5, esche: 2, coppia: sommaA(100, 6) };
    case 3: {
      const obiettivo = scegli(rng, [24, 36, 48, 60]);
      return { tipo: 'prodotto', obiettivo, coppie: 5, esche: 2, coppia: prodottoA(obiettivo) };
    }
    default: {
      if (rng() < 0.5) {
        const obiettivo = scegli(rng, [72, 96, 120, 144]);
        return { tipo: 'prodotto', obiettivo, coppie: 5, esche: 3, coppia: prodottoA(obiettivo) };
      }
      return { tipo: 'somma', obiettivo: 1000, coppie: 5, esche: 3, coppia: sommaA(1000, 105) };
    }
  }
}

function classica(fascia: number, rng: Rng): RoundCoppie {
  const r = ricetta(fascia, rng);
  const numeri: number[] = [];
  for (let i = 0; i < r.coppie; i++) numeri.push(...r.coppia(rng));

  // Esche: numeri plausibili il cui compagno NON è in griglia.
  const max = r.tipo === 'somma' ? r.obiettivo - 1 : Math.min(r.obiettivo, 30);
  let tentativi = 0;
  const esche: number[] = [];
  while (esche.length < r.esche && tentativi++ < 500) {
    const n = intero(rng, r.tipo === 'somma' ? Math.max(1, Math.round(r.obiettivo * 0.05)) : 2, max);
    const c = compagno(r.tipo, r.obiettivo, n);
    const tutti = [...numeri, ...esche];
    if (c !== null && tutti.includes(c)) continue;
    if (tutti.includes(n)) continue;
    if (esche.some((e) => compagno(r.tipo, r.obiettivo, e) === n)) continue;
    esche.push(n);
  }

  return round(r.tipo, r.obiettivo, [...numeri, ...esche], r.coppie, rng);
}

// ── Differenza (papà) ──

/**
 * Coppie (a, a + N) staccate fra loro. Le esche sbagliano di poco: differenza
 * N ± 1, N ± 10 (stessa ultima cifra: smonta "guardo solo le unità") o 2N.
 * A volte una catena di tre (a, a+N, a+2N): il numero di mezzo ha due compagni,
 * uno dei due resterà da solo. Catene di quattro no: lì si può restare bloccati.
 */
function differenza(fascia: number, rng: Rng): RoundCoppie | null {
  const p =
    fascia <= 1
      ? { N: intero(rng, 2, 5), lo: 1, hi: 30, esche: 2 }
      : fascia === 2
        ? { N: scegli(rng, [6, 7, 8, 9, 11, 12, 15]), lo: 1, hi: 60, esche: 2 }
        : fascia === 3
          ? { N: scegli(rng, [13, 14, 15, 16, 17, 18, 19, 21, 23, 24, 25, 27, 29]), lo: 10, hi: 99, esche: scegli(rng, [2, 3]) }
          : { N: scegli(rng, [26, 28, 33, 35, 37, 39, 41, 44, 47, 48, 52, 55, 57, 63, 66, 75]), lo: 10, hi: 199, esche: 3 };
  const { N, lo, hi } = p;
  const coppie = 5;
  const presi = new Set<number>();
  const dentro = (v: number) => v >= lo && v <= hi && !presi.has(v);
  const solo = (v: number) => dentro(v) && !presi.has(v - N) && !presi.has(v + N);

  const coppieFatte: [number, number][] = [];
  for (let i = 0; i < coppie; i++) {
    let fatta = false;
    for (let t = 0; t < 80 && !fatta; t++) {
      const a = intero(rng, lo, hi - N);
      const b = a + N;
      if (!solo(a) || !dentro(b) || presi.has(b + N)) continue;
      presi.add(a).add(b);
      coppieFatte.push([a, b]);
      fatta = true;
    }
    if (!fatta) return null;
  }

  let esche = p.esche;
  if (esche >= 2 && rng() < 0.35) {
    // Catena di tre: allungo una coppia da un lato.
    const [a, b] = scegli(rng, coppieFatte);
    const v = rng() < 0.5 ? b + N : a - N;
    const fuori = v > b ? v + N : v - N;
    if (dentro(v) && !presi.has(fuori)) {
      presi.add(v);
      esche--;
    }
  }

  const scarti = [N - 1, N + 1, N + 10, N - 10, 2 * N].filter((s) => s > 0 && s !== N);
  const tutti = () => [...presi];
  for (let i = 0; i < esche; i++) {
    let messa = false;
    for (let t = 0; t < 120 && !messa; t++) {
      const x = scegli(rng, tutti());
      const v = x + (rng() < 0.5 ? 1 : -1) * scegli(rng, scarti);
      if (solo(v)) {
        presi.add(v);
        messa = true;
      }
    }
    for (let t = 0; t < 200 && !messa; t++) {
      const v = intero(rng, lo, hi);
      if (solo(v)) {
        presi.add(v);
        messa = true;
      }
    }
    if (!messa) return null;
  }

  const numeri = tutti();
  return regge('differenza', N, numeri, coppie) ? round('differenza', N, numeri, coppie, rng) : null;
}

// ── Somma multiplo di 3, 4, 5… (papà) ──

/** Un numero a caso in [lo, hi] con resto `c` nella divisione per `m`. */
function conResto(rng: Rng, m: number, c: number, lo: number, hi: number): number {
  const base = lo + ((((c - lo) % m) + m) % m);
  return base + m * intero(rng, 0, Math.floor((hi - base) / m));
}

/**
 * Due numeri vanno insieme se i resti (divisi per m) fanno 0 o m: i multipli
 * di m fra loro, "resto 1" con "resto m−1", e così via. Ogni gruppo è o tutti
 * con tutti (multipli di m) o tutti di un resto con tutti del resto opposto: in
 * questi grafi qualunque ordine di gioco toglie lo stesso numero di coppie, e
 * `esplora` lo ricontrolla. Le esche sbilanciano un gruppo senza creare coppie
 * nuove: un multiplo di m da solo, un "resto 1" in più. Le coppie hanno somme
 * diverse (12, 21, 45…): non basta cercare sempre lo stesso numero.
 */
function multiplo(fascia: number, rng: Rng): RoundCoppie | null {
  const p =
    fascia <= 2
      ? { m: 3, lo: 2, hi: 30, esche: 2 }
      : fascia === 3
        ? { m: scegli(rng, [3, 4, 5]), lo: 5, hi: 60, esche: scegli(rng, [2, 3]) }
        : { m: scegli(rng, [4, 6, 7, 9]), lo: 10, hi: 99, esche: 3 };
  const { m, lo, hi } = p;
  const coppie = 5;
  const presi = new Set<number>();
  const conta: number[] = Array.from({ length: m }, () => 0);
  const opposto = (c: number) => (m - c) % m;

  const pesca = (c: number): number | null => {
    for (let t = 0; t < 40; t++) {
      const v = conResto(rng, m, c, lo, hi);
      if (!presi.has(v)) return v;
    }
    return null;
  };
  const metti = (v: number) => {
    presi.add(v);
    conta[v % m]!++;
  };

  const restiMisti = Array.from({ length: m - 1 }, (_, i) => i + 1).filter((c) => 2 * c !== m);
  for (let i = 0; i < coppie; i++) {
    const x = rng();
    const c = x < 0.2 ? 0 : m % 2 === 0 && x < 0.3 ? m / 2 : scegli(rng, restiMisti);
    const a = pesca(c);
    if (a === null) return null;
    metti(a);
    const b = pesca(opposto(c));
    if (b === null) return null;
    metti(b);
  }

  for (let i = 0; i < p.esche; i++) {
    // Un resto che non crea coppie nuove: se va con sé stesso, solo se il suo
    // gruppo è pari; altrimenti solo se è già in vantaggio sul resto opposto.
    const ammessi = Array.from({ length: m }, (_, c) => c).filter((c) =>
      opposto(c) === c ? conta[c]! % 2 === 0 : conta[c]! >= conta[opposto(c)]!,
    );
    const v = pesca(scegli(rng, ammessi));
    if (v === null) return null;
    metti(v);
  }

  const numeri = [...presi];
  return regge('multiplo', m, numeri, coppie) ? round('multiplo', m, numeri, coppie, rng) : null;
}

// ── Numeri primi (papà: «come introdurre i numeri primi?») ──

function goldbach(N: number): [number, number][] {
  const coppie: [number, number][] = [];
  for (let a = 2; a < N - a; a++) if (primo(a) && primo(N - a)) coppie.push([a, N - a]);
  return coppie;
}

/** "Sembra primo": dispari, non finisce per 5, ma non è primo (21, 49, 91…). */
function finto(n: number): boolean {
  return n > 1 && n % 2 === 1 && n % 10 !== 5 && !primo(n);
}

/**
 * Due numeri PRIMI che sommati fanno N (N pari: Goldbach). In ogni griglia c'è
 * almeno una coppia esca che fa N ma non è di due primi: 11 + 49 = 60 (49 = 7 × 7),
 * 1 + 59 (1 non è primo), 21 + 39. Così non basta sommare (va controllato che
 * siano primi) e non basta scartare i non primi (il primo dell'esca resta solo).
 * Niente numeri pari: si scarterebbero a colpo d'occhio.
 */
function primi(fascia: number, rng: Rng): RoundCoppie | null {
  const p =
    fascia <= 2
      ? { N: scegli(rng, [24, 30, 36, 40, 42]), coppie: 4, esche: scegli(rng, [2, 3]) }
      : fascia === 3
        ? { N: scegli(rng, [48, 54, 60, 64, 66, 70]), coppie: 4, esche: 3 }
        : { N: scegli(rng, [72, 78, 84, 90, 96, 100]), coppie: 5, esche: 3 };
  const { N } = p;
  const scelte = mescola(rng, goldbach(N)).slice(0, p.coppie);
  const coppie = scelte.length;
  const presi = new Set<number>(scelte.flat());
  const libero = (v: number) => v > 0 && v < N && !presi.has(v);

  // Coppie esca: a + b = N, dispari, non tutti e due primi. La più insidiosa ha
  // un primo e un "finto primo"; quella con l'1 è più rara.
  const pesoEsca = (a: number, b: number): number => {
    if (a === 1) return 1;
    if ((primo(a) && finto(b)) || (primo(b) && finto(a))) return 4;
    if (finto(a) && finto(b)) return 2;
    if (primo(a) || primo(b) || finto(a) || finto(b)) return 0.5; // con un 25, un 35…
    return 0;
  };
  const coppiaEsca = (conPrimo: boolean): boolean => {
    const candidati: [number, number, number][] = [];
    for (let a = 1; a < N - a; a += 2) {
      const b = N - a;
      if ((primo(a) && primo(b)) || !libero(a) || !libero(b)) continue;
      if (conPrimo && !primo(a) && !primo(b)) continue;
      const w = pesoEsca(a, b);
      if (w > 0) candidati.push([a, b, w]);
    }
    const totale = candidati.reduce((s, c) => s + c[2], 0);
    let x = rng() * totale;
    for (const [a, b, w] of candidati) {
      x -= w;
      if (x <= 0) {
        presi.add(a).add(b);
        return true;
      }
    }
    return false;
  };
  // Esca da sola: un finto primo o un primo il cui complemento non è primo.
  const escaSola = (): boolean => {
    const candidati: number[] = [];
    for (let v = 3; v < N; v += 2) {
      if (!libero(v) || presi.has(N - v)) continue;
      if (finto(v) || (primo(v) && !primo(N - v))) candidati.push(v);
    }
    if (candidati.length === 0) return false;
    presi.add(scegli(rng, candidati));
    return true;
  };

  // La prima coppia esca quasi sempre ha un primo: dopo aver scartato i non
  // primi, resta un primo senza compagno e bisogna ancora sommare.
  if (!coppiaEsca(rng() < 0.9)) return null;
  let mancano = p.esche - 2;
  while (mancano > 0) {
    const due = mancano >= 2 && rng() < 0.5;
    if (!(due ? coppiaEsca(false) : escaSola())) return null;
    mancano -= due ? 2 : 1;
  }

  const numeri = [...presi];
  return regge('primi', N, numeri, coppie) ? round('primi', N, numeri, coppie, rng) : null;
}

// ── Quale regola esce ──

type Famiglia = 'classica' | 'differenza' | 'multiplo' | 'primi';

/**
 * Quanto spesso esce ogni regola, per fascia. Le classiche (somma, prodotto)
 * restano la maggioranza; le nuove entrano una alla volta: la differenza dalla
 * fascia 1, multiplo e primi dalla 2.
 */
const MAZZI: readonly (readonly (readonly [Famiglia, number])[])[] = [
  [['classica', 1]],
  [['classica', 0.7], ['differenza', 0.3]],
  [['classica', 0.55], ['differenza', 0.15], ['multiplo', 0.15], ['primi', 0.15]],
  [['classica', 0.55], ['differenza', 0.15], ['multiplo', 0.15], ['primi', 0.15]],
  [['classica', 0.55], ['differenza', 0.15], ['multiplo', 0.15], ['primi', 0.15]],
];

function famigliaDi(fascia: number, x: number): Famiglia {
  const mazzo = MAZZI[fascia] ?? MAZZI[0]!;
  for (const [f, w] of mazzo) {
    if (x < w) return f;
    x -= w;
  }
  return 'classica';
}

export function genera(d: number, rng: Rng): RoundCoppie {
  const fascia = Math.max(0, Math.min(4, Math.floor(d / 2)));
  const famiglia = famigliaDi(fascia, rng());
  if (famiglia !== 'classica') {
    const costruisci = famiglia === 'differenza' ? differenza : famiglia === 'multiplo' ? multiplo : primi;
    for (let t = 0; t < 30; t++) {
      const r = costruisci(fascia, rng);
      if (r) return r;
    }
  }
  return classica(fascia, rng);
}

/** Le regole nuove chiedono un passaggio in più per coppia: un po' più di tempo. */
const PESO_TEMPO: Record<Tipo, number> = { somma: 1, prodotto: 1, differenza: 1.15, multiplo: 1.3, primi: 1.5 };

/** Una griglia dura più di un quesito secco: tempo per coppia, che si stringe col livello. */
export function tempo(r: RoundCoppie, d: number): number {
  return Math.round(2500 + r.coppie * Math.max(1700, 3200 - 140 * d) * PESO_TEMPO[r.tipo]);
}
