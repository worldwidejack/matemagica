import type { Rng } from '../../engine/caso.ts';
import { intero, scegli } from '../../engine/caso.ts';

/**
 * "Stima lampo" — un calcolo troppo lungo da fare in pochi secondi, tre
 * risposte arrotondate: scegli quella più vicina. Vince chi stima.
 *
 * Regola di papà: i trucchi da smontare sono "la risposta giusta è sempre
 * quella in mezzo" (la giusta è a caso la più bassa, la media o la più alta),
 * "guardo l'ultima cifra" (le opzioni sono tutte arrotondate) e "guardo solo
 * le distanze fra le opzioni" (le esche sono spaziate a caso e in modo
 * simmetrico: dagli scarti non si capisce dov'è la giusta).
 *
 * Papà (16/10): i calcoli utili nella vita vera sono "il resto in un acquisto,
 * la conversione miglia-km, gradi Celsius-Fahrenheit". Sono tre famiglie
 * mescolate ai calcoli di sempre, un 10% ciascuna.
 */

export type Famiglia = 'calcolo' | 'resto' | 'miglia-km' | 'km-miglia' | 'c-f' | 'f-c';

export type RoundStima = {
  /** Il calcolo, in grande. */
  testo: string;
  valore: number;
  opzioni: number[];
  giusta: number;
  famiglia: Famiglia;
  /** Il contesto, sopra il calcolo ("Paghi con 50 €"). */
  sopra?: string;
  /** La domanda sotto il calcolo, al posto di "≈ quanto, più o meno?". */
  domanda?: string;
  /** La regola di conversione, in piccolo: non è un quiz di memoria. */
  formula?: string;
  /** L'unità delle risposte ("€", "km", "°F"…). */
  unita?: string;
};

type Quesito = Omit<RoundStima, 'opzioni' | 'giusta'>;

/** Quanto spesso esce ogni famiglia nuova (il resto sono i calcoli di sempre). */
export const QUOTA_FAMIGLIA = 0.1;

/** 1 miglio = 1,609 km: lo stesso numero che il giocatore vede scritto. */
export const KM_PER_MIGLIO = 1.609;

/**
 * Arrotonda a 2 cifre significative: 798 → 800, 4 312 → 4 300.
 * Mai sotto l'unità: niente "≈ 7,6" fra opzioni intere (sarebbe un indizio).
 */
export function arrotonda(x: number): number {
  if (x === 0) return 0;
  const p = Math.max(1, Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 1));
  return Math.round(x / p) * p;
}

export function formatta(n: number): string {
  return n.toLocaleString('it-IT');
}

/** Centesimi → "12,90 €". */
function euro(centesimi: number): string {
  return `${(centesimi / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** Il valore esatto da mostrare dopo la risposta: "11,30 €", "99,8 km". */
/** Il risultato dopo la risposta, con «=» se è esatto e «≈» se è arrotondato. */
export function rivela(r: RoundStima): string {
  if (r.famiglia === 'resto') {
    const cent = Math.round(r.valore * 100);
    return `${Math.abs(r.valore * 100 - cent) < 1e-6 ? '=' : '≈'} ${euro(cent)}`;
  }
  const arrotondato = Math.round(r.valore * 10) / 10;
  const n = formatta(arrotondato);
  const segno = Math.abs(r.valore - arrotondato) < 1e-9 ? '=' : '≈';
  return `${segno} ${r.unita ? `${n} ${r.unita}` : n}`;
}

/** I calcoli di sempre: moltiplicazioni, percentuali, divisioni. */
function calcolo(fascia: number, rng: Rng): Quesito {
  const q = (testo: string, valore: number): Quesito => ({ testo, valore, famiglia: 'calcolo' });
  if (fascia === 0) {
    const a = intero(rng, 12, 49);
    const b = intero(rng, 3, 9);
    return q(`${a} × ${b}`, a * b);
  }
  if (fascia === 1) {
    const a = intero(rng, 12, 49);
    const b = intero(rng, 12, 39);
    return q(`${a} × ${b}`, a * b);
  }
  if (fascia === 2) {
    const a = intero(rng, 41, 99);
    const b = intero(rng, 21, 89);
    return q(`${a} × ${b}`, a * b);
  }
  if (fascia === 3 && rng() < 0.5) {
    const p = intero(rng, 11, 49);
    const n = intero(rng, 12, 98) * 10;
    return q(`${p}% di ${n}`, (p * n) / 100);
  }
  if (rng() < 0.5) {
    const b = intero(rng, 12, 39);
    const qq = intero(rng, 21, 299);
    const resto = intero(rng, 0, b - 1);
    return q(`${qq * b + resto} ÷ ${b}`, (qq * b + resto) / b);
  }
  const a = intero(rng, 120, 899);
  const b = intero(rng, 12, 79);
  return q(`${a} × ${b}`, a * b);
}

/**
 * Il resto (papà): "Paghi con 50 €: 3 × 12,90 €. Resto?". Si lavora in
 * centesimi interi, niente errori di virgola. Il resto sta fra il 15% e il 70%
 * della banconota e mai sotto i 10 €: la sottrazione finale amplifica gli
 * arrotondamenti, ed è proprio quello che fa pensare.
 */
function resto(fascia: number, rng: Rng): Quesito {
  const banconote = [[50], [50], [50, 100], [100, 200], [100, 200]][fascia] ?? [50];
  const pezzi = [[2, 3], [2, 4], [3, 6], [3, 8], [4, 9]][fascia] ?? [2, 3];
  for (let t = 0; t < 50; t++) {
    const paga = scegli(rng, banconote);
    const n = intero(rng, pezzi[0] ?? 2, pezzi[1] ?? 3);
    const quota = 0.15 + 0.55 * rng();
    const euroInteri = Math.floor((paga * (1 - quota)) / n);
    const cent =
      fascia === 0
        ? scegli(rng, [50, 90])
        : fascia === 1
          ? scegli(rng, [49, 50, 90, 95, 99])
          : fascia === 2
            ? 5 * intero(rng, 1, 19)
            : intero(rng, 1, 99);
    const prezzo = euroInteri * 100 + cent;
    const restoCent = paga * 100 - n * prezzo;
    if (euroInteri < 1 || restoCent < 1000 || restoCent < paga * 15 || restoCent > paga * 70) continue;
    return {
      testo: `${n} × ${euro(prezzo)}`,
      valore: restoCent / 100,
      famiglia: 'resto',
      sopra: `Paghi con ${paga} €`,
      domanda: 'Il resto, più o meno?',
      unita: '€',
    };
  }
  return { testo: '3 × 12,90 €', valore: 11.3, famiglia: 'resto', sopra: 'Paghi con 50 €', domanda: 'Il resto, più o meno?', unita: '€' };
}

/** Miglia ↔ km (papà). Le distanze crescono con la fascia: dal paese vicino alla traversata. */
function distanza(fascia: number, rng: Rng): Quesito {
  const formula = '1 miglio ≈ 1,609 km';
  if (rng() < 0.5) {
    const miglia = [
      () => 5 * intero(rng, 2, 12),
      () => intero(rng, 12, 99),
      () => 10 * intero(rng, 11, 60),
      () => intero(rng, 110, 990),
      () => 10 * intero(rng, 110, 300),
    ][fascia]?.() ?? 50;
    return {
      testo: `${formatta(miglia)} miglia`,
      valore: miglia * KM_PER_MIGLIO,
      famiglia: 'miglia-km',
      domanda: 'In km, più o meno?',
      formula,
      unita: 'km',
    };
  }
  const km = [
    () => 10 * intero(rng, 2, 15),
    () => intero(rng, 21, 199),
    () => 10 * intero(rng, 21, 99),
    () => intero(rng, 210, 1990),
    () => 10 * intero(rng, 210, 500),
  ][fascia]?.() ?? 100;
  return {
    testo: `${formatta(km)} km`,
    valore: km / KM_PER_MIGLIO,
    famiglia: 'km-miglia',
    domanda: 'In miglia, più o meno?',
    formula,
    unita: 'miglia',
  };
}

/**
 * Celsius ↔ Fahrenheit (papà). Si parte dal meteo e si arriva al forno: lì
 * "raddoppia e aggiungi 30" non basta più, bisogna correggere il ×2 in ×1,8.
 */
function temperatura(fascia: number, rng: Rng): Quesito {
  if (rng() < 0.5) {
    const c = [
      () => 5 * intero(rng, 2, 8),
      () => intero(rng, 5, 40),
      () => intero(rng, 41, 100),
      () => 5 * intero(rng, 24, 50),
      () => intero(rng, 101, 300),
    ][fascia]?.() ?? 20;
    return {
      testo: `${c} °C`,
      valore: c * 1.8 + 32,
      famiglia: 'c-f',
      domanda: 'In °F, più o meno?',
      formula: '°F = °C × 1,8 + 32',
      unita: '°F',
    };
  }
  const f = [
    () => 10 * intero(rng, 5, 10),
    () => intero(rng, 50, 110),
    () => intero(rng, 111, 220),
    () => 25 * intero(rng, 10, 19),
    () => intero(rng, 221, 500),
  ][fascia]?.() ?? 68;
  return {
    testo: `${f} °F`,
    valore: (f - 32) / 1.8,
    famiglia: 'f-c',
    domanda: 'In °C, più o meno?',
    formula: '°C = (°F − 32) ÷ 1,8',
    unita: '°C',
  };
}

/** Pesca la famiglia: un 10% ciascuna le tre di papà, il resto i calcoli di sempre. */
function quesito(d: number, rng: Rng): Quesito {
  const fascia = Math.min(4, Math.floor(d / 2));
  const x = rng();
  if (x < QUOTA_FAMIGLIA) return resto(fascia, rng);
  if (x < 2 * QUOTA_FAMIGLIA) return distanza(fascia, rng);
  if (x < 3 * QUOTA_FAMIGLIA) return temperatura(fascia, rng);
  return calcolo(fascia, rng);
}

export function genera(d: number, rng: Rng): RoundStima {
  for (let t = 0; t < 200; t++) {
    const q = quesito(d, rng);
    const giusta = arrotonda(q.valore);
    // Le esche si avvicinano col livello: dal ±45% al ±14% (in media).
    const passo = 0.45 - 0.031 * Math.min(10, d);
    // Scarti a caso e misurati in rapporto (scala logaritmica), con lo stesso
    // dado per i tre schemi: le distanze fra le opzioni non tradiscono la giusta.
    const base = Math.log(1 + passo);
    const s1 = base * (0.75 + 0.5 * rng());
    const s2 = base * (0.75 + 0.5 * rng());
    const schema = Math.floor(rng() * 3); // 0: giusta la più bassa, 1: in mezzo, 2: la più alta
    const schemi = (a: number, b: number) => [[a, a + b], [-a, b], [-a, -a - b]];
    const prova = (salti: number[]): number[] | null => {
      // Dal valore vero, non dalla giusta già arrotondata: così ogni opzione ha il
      // suo arrotondamento e gli scarti accanto alla giusta non sono più regolari.
      const esche = salti.map((s) => arrotonda(q.valore * Math.exp(s)));
      const opzioni = [giusta, ...esche];
      if (new Set(opzioni).size < 3 || esche.some((e) => e <= 0)) return null;
      // La giusta deve essere davvero la più vicina al valore vero.
      const dist = Math.abs(giusta - q.valore);
      return esche.some((e) => Math.abs(e - q.valore) <= dist) ? null : opzioni;
    };
    // Si scarta se una qualsiasi disposizione verrebbe scartata, non solo quella
    // pescata: così gli scarti buttati non spostano la statistica verso uno schema.
    if ([...schemi(s1, s2), ...schemi(s2, s1)].some((salti) => prova(salti) === null)) continue;
    const opzioni = prova(schemi(s1, s2)[schema] ?? []);
    if (!opzioni) continue;
    // Fisher-Yates: con sort(() => rng() - 0.5) la giusta finiva sul terzo bottone solo 1 volta su 4.
    const mescolate = [...opzioni];
    for (let i = mescolate.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const x = mescolate[i]!;
      mescolate[i] = mescolate[j]!;
      mescolate[j] = x;
    }
    return { ...q, opzioni: mescolate, giusta: mescolate.indexOf(giusta) };
  }
  return { testo: '38 × 21', valore: 798, opzioni: [600, 800, 1100], giusta: 1, famiglia: 'calcolo' };
}

/** Secondi in più per leggere: il resto ha due righe e due conti, le conversioni una formula. */
const LETTURA: Record<Famiglia, number> = {
  calcolo: 0,
  resto: 2500,
  'miglia-km': 1200,
  'km-miglia': 1200,
  'c-f': 1800,
  'f-c': 1800,
};

/** Poco tempo, apposta: il calcolo esatto non ci sta, la stima sì. */
export function tempo(d: number, r?: RoundStima): number {
  return Math.round(Math.max(2800, 4200 - 120 * d)) + (r ? LETTURA[r.famiglia] : 0);
}
