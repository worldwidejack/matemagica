/**
 * Verifica dei generatori: migliaia di quesiti per gioco, a ogni difficoltà.
 * Controlla che ogni quesito sia risolvibile e coerente, misura quanto spesso
 * i trucchi ovvi funzionerebbero (la regola di papà) e quanto costa generarli.
 * Le famiglie nuove (risposte di papà, 16/10) hanno i loro controlli: risposta
 * giusta ricalcolata dal testo, risposta unica, frequenze, trucchi.
 *
 *   npm run verifica
 */
import { rngConSeme } from '../src/engine/caso.ts';
import * as piuGrande from '../src/games/piu-grande/logica.ts';
import * as coppie from '../src/games/coppie/logica.ts';
import * as catena from '../src/games/catena/logica.ts';
import * as stima from '../src/games/stima/logica.ts';
import * as bersaglio from '../src/games/bersaglio/logica.ts';
import * as bilancia from '../src/games/bilancia/logica.ts';
import * as regola from '../src/games/regola/logica.ts';
import { SEQUENZE_PAPA } from '../src/content/sequenze.ts';
import { SPIEGAZIONI } from '../src/content/spiegazioni.ts';

const rng = rngConSeme(7);
/** Un secondo dado per i campioni e i trucchi "a caso": non sposta i quesiti generati. */
const dado = rngConSeme(11);
const N = 600;
const DIFF = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let problemi = 0;

function controlla(cond: boolean, msg: string) {
  if (!cond) {
    problemi++;
    if (problemi < 15) console.log('  ✗ ' + msg);
  }
}

function prova<R>(nome: string, gen: (d: number) => R, verifica: (r: R, d: number) => void, esempio: (r: R) => string) {
  // Si misura solo la generazione: i controlli (forza bruta compresa) non contano.
  let totale = 0;
  let lento = 0;
  for (const d of DIFF) {
    for (let i = 0; i < N; i++) {
      const t = performance.now();
      const r = gen(d);
      const dt = performance.now() - t;
      totale += dt;
      lento = Math.max(lento, dt);
      verifica(r, d);
    }
  }
  const ms = totale / (N * DIFF.length);
  console.log(`\n${nome}: ${(N * DIFF.length)} quesiti, ${ms.toFixed(2)} ms medi, ${lento.toFixed(0)} ms il più lento`);
  for (const d of [0, 4, 8, 10]) console.log(`  d${d}: ${esempio(gen(d))}`);
}

const pc = (a: number, b: number) => (b === 0 ? '–' : `${Math.round((a / b) * 100)}%`);
const conta = <K>(m: Map<K, number>, k: K) => m.set(k, (m.get(k) ?? 0) + 1);

// ── Chi è più grande? ──

/** Ricalcola un'espressione dal testo che vede il giocatore: + − tra i termini, × : dentro, n². */
function valuta(testo: string): number {
  const pezzi = testo.split(' ');
  const termini: number[] = [];
  const segni: number[] = [1];
  let termine: number | null = null;
  let op: string | null = null;
  for (const p of pezzi) {
    if (p === '+' || p === '−') {
      termini.push(termine ?? NaN);
      segni.push(p === '+' ? 1 : -1);
      termine = null;
      op = null;
    } else if (p === '×' || p === ':') {
      op = p;
    } else {
      const n = p.endsWith('²') ? Number(p.slice(0, -1)) ** 2 : Number(p);
      termine = termine === null ? n : op === '×' ? termine * n : termine / n;
    }
  }
  termini.push(termine ?? NaN);
  return termini.reduce((s, t, i) => s + (segni[i] ?? 1) * t, 0);
}
const numeriDi = (testo: string) => (testo.match(/\d+/g) ?? []).map(Number);
const divisioniDi = (testo: string) => [...testo.matchAll(/(\d+) : (\d+)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
const QUADRATO_PURO = /^(\d+) × \1$|^\d+²$|^(\d+) \+ \2$/;

const famigliePG = new Map<piuGrande.Famiglia, number>();
const famigliePGperFascia = Array.from({ length: 5 }, () => new Map<piuGrande.Famiglia, number>());
const inganniPG = { tutti: 0, da2: 0, n2: 0, perFamiglia: new Map<piuGrande.Famiglia, number>() };
const quadratoPG = { n: 0, vincePuro: 0 };
const divisionePG = { n: 0, vinceDividendo: 0, stessaParteIntera: 0 };
prova('Chi è più grande?', (d) => piuGrande.genera(d, rng), (r, d) => {
  controlla(r.a.valore !== r.b.valore, 'più grande: valori uguali');
  for (const e of [r.a, r.b]) {
    controlla(Math.abs(valuta(e.testo) - e.valore) < 1e-9, `più grande: "${e.testo}" non vale ${e.valore}`);
    for (const [x, y] of divisioniDi(e.testo)) controlla(x % y !== 0, `più grande: divisione esatta ${x} : ${y}`);
  }
  const na = numeriDi(r.a.testo);
  controlla(!numeriDi(r.b.testo).some((n) => na.includes(n)), `più grande: numero in comune (${r.a.testo} contro ${r.b.testo})`);
  const da = divisioniDi(r.a.testo);
  const db = divisioniDi(r.b.testo);
  if (/^\d+ : \d+$/.test(r.a.testo) && /^\d+ : \d+$/.test(r.b.testo)) {
    const [[a, b], [c, e]] = [da[0]!, db[0]!];
    controlla(a * e !== c * b, `più grande: stesso rapporto ${r.a.testo} e ${r.b.testo}`);
  }
  controlla(piuGrande.risultato(r.a.valore) !== piuGrande.risultato(r.b.valore), `più grande: risultati mostrati uguali (${r.a.testo}, ${r.b.testo})`);
  // Le famiglie nuove entrano quando devono: divisione da d 4, quadrato da d 2.
  controlla(r.famiglia !== 'divisione' || d >= 4, `più grande: divisione a d ${d}`);
  controlla(r.famiglia !== 'quadrato' || d >= 2, `più grande: quadrato a d ${d}`);

  conta(famigliePG, r.famiglia);
  conta(famigliePGperFascia[Math.min(4, Math.floor(d / 2))]!, r.famiglia);
  if (r.ingannevole) {
    inganniPG.tutti++;
    conta(inganniPG.perFamiglia, r.famiglia);
  }
  if (d >= 2) {
    inganniPG.n2++;
    if (r.ingannevole) inganniPG.da2++;
  }
  if (r.famiglia === 'quadrato') {
    quadratoPG.n++;
    const puro = QUADRATO_PURO.test(r.a.testo) ? r.a : r.b;
    const altro = puro === r.a ? r.b : r.a;
    if (puro.valore > altro.valore) quadratoPG.vincePuro++;
  }
  if (r.famiglia === 'divisione' && da.length === 1 && db.length === 1) {
    divisionePG.n++;
    const vince = r.a.valore > r.b.valore ? da[0]! : db[0]!;
    const perde = vince === da[0] ? db[0]! : da[0]!;
    if (vince[0] > perde[0]) divisionePG.vinceDividendo++;
    if (Math.floor(r.a.valore) === Math.floor(r.b.valore)) divisionePG.stessaParteIntera++;
  }
}, (r) => `${r.a.testo} vs ${r.b.testo}   (${r.famiglia}, ${piuGrande.risultato(r.a.valore)} / ${piuGrande.risultato(r.b.valore)})`);
const totPG = N * DIFF.length;
console.log(`  il trucco "vince il numero più grosso" sbaglia: ${pc(inganniPG.tutti, totPG)} (da d2: ${pc(inganniPG.da2, inganniPG.n2)})`);
console.log(`  famiglie: ${[...famigliePG].map(([f, k]) => `${f} ${pc(k, totPG)}`).join(' · ')}`);
console.log(
  `  per fascia 0-4: ${famigliePGperFascia
    .map((m) => {
      const t = [...m.values()].reduce((a, b) => a + b, 0);
      return (['mista', 'divisione', 'quadrato'] as const).map((f) => pc(m.get(f) ?? 0, t)).join('/');
    })
    .join('  ')}   (mista/divisione/quadrato)`,
);
console.log(
  `  trucco sbaglia per famiglia: ${[...famigliePG].map(([f, k]) => `${f} ${pc(inganniPG.perFamiglia.get(f) ?? 0, k)}`).join(' · ')}`,
);
console.log(`  quadrato: "vince il quadrato" indovina nel ${pc(quadratoPG.vincePuro, quadratoPG.n)}`);
console.log(
  `  divisione: "vince il dividendo più grande" indovina nel ${pc(divisionePG.vinceDividendo, divisionePG.n)}; stessa parte intera nel ${pc(divisionePG.stessaParteIntera, divisionePG.n)}`,
);
controlla(Math.abs(inganniPG.da2 / inganniPG.n2 - 0.5) < 0.06, 'più grande: il trucco del numero grosso non sbaglia ~metà delle volte da d2');
controlla((famigliePG.get('classica') ?? 0) / totPG > 0.5, 'più grande: la classica non è più la maggioranza');
controlla(Math.abs(quadratoPG.vincePuro / quadratoPG.n - 0.5) < 0.1, 'più grande: "vince il quadrato" non è ~50%');
controlla(Math.abs(divisionePG.vinceDividendo / divisionePG.n - 0.5) < 0.1, 'più grande: "vince il dividendo più grande" non è ~50%');

// ── Coppie ──
// Differenza e multiplo hanno più compagni possibili: si prova ogni ordine di
// gioco con `formano` (la stessa regola della vista). Peggio = meglio = coppie
// vuol dire niente vicoli ciechi e niente coppie in più.
let ultimaObbligata = 0;
let griglie = 0;
const regoleCoppie = new Map<string, number>();
const primiCoppie = { n: 0, escaSomma: 0, primoSolo: 0 };
const unitaCoppie = { n: 0, falsa: 0 };
const eUnPrimo = (n: number) => {
  if (n < 2) return false;
  for (let k = 2; k * k <= n; k++) if (n % k === 0) return false;
  return true;
};
const DA_FASCIA: Record<coppie.Tipo, number> = { somma: 0, prodotto: 3, differenza: 1, multiplo: 2, primi: 2 };
prova('Coppie magiche', (d) => coppie.genera(d, rng), (r, d) => {
  const v = r.celle.map((c) => c.n);
  const memo = new Map<number, [number, number]>();
  const giro = (mask: number): [number, number] => {
    const visto = memo.get(mask);
    if (visto) return visto;
    let peggio = Infinity;
    let meglio = 0;
    for (let i = 0; i < v.length; i++) {
      for (let j = i + 1; j < v.length; j++) {
        if (!(mask & (1 << i)) || !(mask & (1 << j)) || !coppie.formano(r, v[i]!, v[j]!)) continue;
        const [a, b] = giro(mask & ~(1 << i) & ~(1 << j));
        peggio = Math.min(peggio, a + 1);
        meglio = Math.max(meglio, b + 1);
      }
    }
    const esito: [number, number] = peggio === Infinity ? [0, 0] : [peggio, meglio];
    memo.set(mask, esito);
    return esito;
  };
  const [peggio, meglio] = giro((1 << v.length) - 1);
  controlla(peggio === r.coppie && meglio === r.coppie, `coppie: ${r.tipo} ${r.obiettivo}: da ${peggio} a ${meglio} coppie, attese ${r.coppie} (${v.join(' ')})`);
  controlla(v.length <= 13, `coppie: ${v.length} celle (al massimo 13)`);
  controlla(Math.floor(d / 2) >= DA_FASCIA[r.tipo], `coppie: ${r.tipo} a d ${d}`);
  if (r.tipo !== 'somma' && r.tipo !== 'prodotto') {
    controlla(new Set(v).size === v.length, `coppie: numeri ripetuti (${r.tipo})`);
    controlla(v.length > r.coppie * 2, `coppie: ${r.tipo} senza esche`);
  }
  if (r.tipo === 'primi') {
    const S = r.obiettivo;
    primiCoppie.n++;
    // "Sommo e basta" sbaglia: c'è una coppia che fa S ma non di due primi.
    if (v.some((a) => a < S - a && v.includes(S - a) && !(eUnPrimo(a) && eUnPrimo(S - a)))) primiCoppie.escaSomma++;
    else controlla(false, `coppie: primi ${S} senza coppia esca`);
    // "Scarto i non primi" sbaglia: resta un primo senza compagno.
    if (v.some((a) => eUnPrimo(a) && !(v.includes(S - a) && eUnPrimo(S - a)))) primiCoppie.primoSolo++;
  }
  if (r.tipo === 'differenza') {
    // "Guardo solo le unità": c'è una coppia con la differenza giusta nell'ultima cifra, ma sbagliata.
    unitaCoppie.n++;
    const falsa = v.some((a) => v.some((b) => b > a && b - a !== r.obiettivo && (b - a) % 10 === r.obiettivo % 10));
    if (falsa) unitaCoppie.falsa++;
  }
  conta(regoleCoppie, r.tipo);
  griglie++;
  if (r.celle.length === r.coppie * 2 && d >= 2) ultimaObbligata++;
}, (r) => `${r.tipo} ${r.obiettivo}: ${r.celle.map((c) => c.n).join(' ')}`);
console.log(`  griglie senza esche dalla difficoltà 2 in su: ${ultimaObbligata}/${griglie}`);
console.log(`  regole: ${[...regoleCoppie].map(([t, k]) => `${t} ${pc(k, griglie)}`).join(' · ')}`);
console.log(`  primi: "sommo e basta" sbaglia nel ${pc(primiCoppie.escaSomma, primiCoppie.n)}, "scarto i non primi" nel ${pc(primiCoppie.primoSolo, primiCoppie.n)}`);
console.log(`  differenza: "guardo solo le unità" trova una coppia falsa nel ${pc(unitaCoppie.falsa, unitaCoppie.n)}`);
controlla(primiCoppie.primoSolo / primiCoppie.n > 0.9, 'coppie: "scarto i non primi" funziona troppo spesso');
controlla(unitaCoppie.falsa / unitaCoppie.n > 0.9, 'coppie: "guardo solo le unità" funziona troppo spesso');

// ── Catena ──
// Le quattro risposte sono due coppie legate dall'ultima operazione; la giusta
// è a caso il "prima" o il "dopo" della sua coppia.
const catenaT = { n: 0, coppia: 0, dopo: 0 };
const bottoniCatena = [0, 0, 0, 0];
const ordineCatena = [0, 0, 0, 0];
prova('Catena', (d) => catena.genera(d, rng), (r) => {
  controlla(r.opzioni.includes(r.risultato), 'catena: risposta non tra le opzioni');
  controlla(new Set(r.opzioni).size === 4, 'catena: opzioni ripetute');
  controlla(r.opzioni.every((o) => Number.isInteger(o) && o >= 0), `catena: opzioni ${r.opzioni.join(', ')}`);
  let x = r.inizio;
  for (const p of r.passi) x = catena.applica(x, p);
  controlla(x === r.risultato, 'catena: risultato non coerente coi passi');
  const ultimo = r.passi[r.passi.length - 1]!;
  // Esattamente due legami, e ogni risposta sta in uno solo: due coppie staccate.
  controlla(catena.legami(r.opzioni, ultimo) === 2, `catena: ${catena.legami(r.opzioni, ultimo)} legami con ${catena.testoPasso(ultimo)}, attesi 2`);
  controlla(
    r.opzioni.every((o) => r.opzioni.filter((q) => q !== o && (catena.applica(q, ultimo) === o || catena.applica(o, ultimo) === q)).length === 1),
    `catena: le coppie non sono staccate (${r.opzioni.join(', ')})`,
  );
  // Il trucco della coppia: guardo solo l'ultima operazione e prendo una risposta
  // che si ottiene da un'altra con quell'operazione.
  const cand = r.opzioni.filter((o) => r.opzioni.some((q) => q !== o && catena.applica(q, ultimo) === o));
  const scelta = cand.length > 0 ? cand[Math.floor(dado() * cand.length)] : r.opzioni[Math.floor(dado() * 4)];
  catenaT.n++;
  if (scelta === r.risultato) catenaT.coppia++;
  if (r.opzioni.some((q) => q !== r.risultato && catena.applica(q, ultimo) === r.risultato)) catenaT.dopo++;
  bottoniCatena[r.opzioni.indexOf(r.risultato)]!++;
  ordineCatena[[...r.opzioni].sort((a, b) => a - b).indexOf(r.risultato)]!++;
}, (r) => `${r.inizio} ${r.passi.map(catena.testoPasso).join(' ')} = ${r.risultato}  [${r.opzioni.join(', ')}] ${r.msPasso}ms/passo`);
console.log(`  "trucco della coppia" (guardo solo l'ultima operazione) indovina: ${pc(catenaT.coppia, catenaT.n)} (a caso: 25%)`);
console.log(`  la giusta è il "dopo" della sua coppia: ${pc(catenaT.dopo, catenaT.n)}`);
console.log(`  la giusta per bottone: ${bottoniCatena.map((b) => pc(b, catenaT.n)).join(' / ')} · dalla più bassa alla più alta: ${ordineCatena.map((b) => pc(b, catenaT.n)).join(' / ')}`);
controlla(catenaT.coppia / catenaT.n < 0.32, 'catena: il trucco della coppia indovina troppo');
controlla(Math.abs(catenaT.dopo / catenaT.n - 0.5) < 0.04, 'catena: la giusta non è metà "prima" e metà "dopo"');
for (const k of [...bottoniCatena, ...ordineCatena]) controlla(Math.abs(k / catenaT.n - 0.25) < 0.04, 'catena: una posizione è favorita');

// ── Stima ──
const posizioni = [0, 0, 0];
const bottoniStima = [0, 0, 0];
const famiglieStima = new Map<stima.Famiglia, number>();
let truccoScarti = 0;
/** "2.370" → 2370, "12,90" → 12.9 */
const num = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'));
prova('Stima lampo', (d) => stima.genera(d, rng), (r) => {
  const g = r.opzioni[r.giusta]!;
  const dist = Math.abs(g - r.valore);
  controlla(r.opzioni.every((o, i) => i === r.giusta || Math.abs(o - r.valore) > dist), `stima: ${r.testo} giusta non la più vicina`);
  controlla(new Set(r.opzioni).size === 3 && r.opzioni.every((o) => Number.isInteger(o) && o > 0), `stima: opzioni ${r.opzioni.join(', ')}`);
  controlla(r.valore >= 10, `stima: ${r.testo} vale ${r.valore}`);
  controlla(g === stima.arrotonda(r.valore), `stima: la giusta ${g} non è ${r.valore} arrotondato`);
  // Le famiglie nuove: il valore rifatto dal testo che vede il giocatore.
  let rifatto = r.valore;
  const n = num(r.testo.split(' ')[0] ?? '');
  if (r.famiglia === 'resto') {
    const paga = num(/(\d+) €/.exec(r.sopra ?? '')?.[1] ?? 'NaN');
    const [, pezzi, prezzo] = /^(\d+) × ([\d.,]+) €$/.exec(r.testo) ?? [];
    const cent = Math.round(num(prezzo ?? 'NaN') * 100);
    controlla(/,\d\d €$/.test(r.testo), `stima: prezzo senza centesimi (${r.testo})`);
    rifatto = (paga * 100 - Number(pezzi) * cent) / 100;
  } else if (r.famiglia === 'miglia-km') rifatto = n * stima.KM_PER_MIGLIO;
  else if (r.famiglia === 'km-miglia') rifatto = n / stima.KM_PER_MIGLIO;
  else if (r.famiglia === 'c-f') rifatto = n * 1.8 + 32;
  else if (r.famiglia === 'f-c') rifatto = (n - 32) / 1.8;
  controlla(Math.abs(rifatto - r.valore) < 1e-9, `stima: ${r.sopra ?? ''} ${r.testo} vale ${rifatto}, non ${r.valore}`);

  const ordinate = [...r.opzioni].sort((a, b) => a - b);
  posizioni[ordinate.indexOf(g)]!++;
  bottoniStima[r.giusta]!++;
  conta(famiglieStima, r.famiglia);
  // Trucco degli scarti: "se le due più basse sono vicine, la giusta è la più alta, se no quella in mezzo".
  const [a = 0, b = 0, c = 0] = ordinate;
  if ((b - a < 0.8 * (c - b) ? c : b) === g) truccoScarti++;
}, (r) => `${r.sopra ? r.sopra + ': ' : ''}${r.testo} ≈ ? [${r.opzioni.join(', ')}]${r.unita ? ' ' + r.unita : ''} → ${r.opzioni[r.giusta]} (vero ${r.valore.toFixed(1)})`);
const tot = posizioni.reduce((a, b) => a + b, 0);
console.log(`  la giusta è la più bassa / in mezzo / la più alta: ${posizioni.map((p) => pc(p, tot)).join(' / ')}`);
console.log(`  la giusta per bottone: ${bottoniStima.map((p) => pc(p, tot)).join(' / ')}`);
console.log(`  famiglie: ${[...famiglieStima].map(([f, k]) => `${f} ${pc(k, tot)}`).join(' · ')}`);
console.log(`  trucco degli scarti (guardo solo le distanze fra le opzioni) indovina: ${pc(truccoScarti, tot)} (a caso: 33%)`);
for (const p of [...posizioni, ...bottoniStima]) controlla(p / tot > 0.3 && p / tot < 0.37, 'stima: una posizione della giusta è favorita');
controlla(truccoScarti / tot < 0.4, 'stima: il trucco degli scarti indovina troppo');
const nuoveStima = { resto: 0, distanze: 0, temperature: 0 };
for (const [f, k] of famiglieStima) {
  if (f === 'resto') nuoveStima.resto += k;
  if (f === 'miglia-km' || f === 'km-miglia') nuoveStima.distanze += k;
  if (f === 'c-f' || f === 'f-c') nuoveStima.temperature += k;
}
for (const [f, k] of Object.entries(nuoveStima)) controlla(k / tot > 0.07 && k / tot < 0.13, `stima: famiglia ${f} al ${pc(k, tot)} (attesa ~10%)`);
controlla(nuoveStima.resto + nuoveStima.distanze + nuoveStima.temperature < 0.4 * tot, 'stima: le famiglie nuove non sono più minoritarie');

// ── Bersaglio ──
let sommaFunziona = 0;
let rondeB = 0;
prova('Il Numero bersaglio', (d) => bersaglio.genera(d, rng), (r, d) => {
  controlla(bersaglio.verifica(r, r.soluzione), `bersaglio: soluzione non valida ${JSON.stringify(r)}`);
  if (d >= 2) {
    rondeB++;
    if (r.numeri.reduce((s, n) => s + n, 0) === r.bersaglio) sommaFunziona++;
  }
}, (r) => `[${r.numeri.join(' ')}] → ${r.bersaglio}   (${r.soluzione.map(bersaglio.testoPasso).join(', ')})`);
console.log(`  bersagli raggiungibili "sommando tutto" (d≥2): ${sommaFunziona}/${rondeB}`);
// L'esempio della spiegazione deve volere almeno due passi (quello vecchio, 3, 4, 6 → 18, si faceva con 3 × 6).
const esempioB = /Numeri ([\d, ]+) · bersaglio (\d+)/.exec(SPIEGAZIONI.bersaglio.esempio);
const numeriB = (esempioB?.[1] ?? '').split(',').map(Number);
const passiB = esempioB ? bersaglio.passiMinimi(numeriB, Number(esempioB[2])) : 0;
console.log(`  l'esempio della spiegazione (${SPIEGAZIONI.bersaglio.esempio.split('  →')[0]}) vuole ${passiB} passi`);
controlla(passiB >= 2, 'bersaglio: l\'esempio della spiegazione si fa in un passo');

// ── Bilancia ──
const negativi = { sotto7: 0, n78: 0, neg78: 0, n910: 0, neg910: 0, conNeg: 0, chiestaNeg: 0 };
const tipiBilancia = { n0: 0, uno0: 0, n2: 0, scala2: 0 };
prova('La Bilancia', (d) => bilancia.genera(d, rng), (r, d) => {
  const n = r.pesi.length;
  for (const b of r.bilance) {
    const v = (p: bilancia.Piatto) => p.forme.reduce((s, k, i) => s + k * r.pesi[i]!, 0) + p.peso;
    controlla(v(b.sinistra) === v(b.destra), 'bilancia: non in equilibrio');
    const vuoto = (p: bilancia.Piatto) => p.peso === 0 && p.forme.every((x) => x === 0);
    controlla(!vuoto(b.sinistra) && !vuoto(b.destra) && b.sinistra.peso >= 0 && b.destra.peso >= 0, 'bilancia: piatto vuoto o peso negativo');
  }
  controlla(r.pesi.every((w) => Number.isInteger(w) && w !== 0), 'bilancia: peso non intero o zero');
  controlla(d >= 7 || r.pesi.every((w) => w > 0), 'bilancia: negativo sotto d 7');
  controlla(r.sottoZero === (d >= 7), 'bilancia: avviso sotto zero sbagliato');
  // Unicità con la forza bruta, anche sui negativi; con 3 forme un quesito su 10, per i tempi.
  if (n <= 2 || dado() < 0.1) {
    const s = bilancia.valoriPossibili(r.bilance, n, r.chiesta, -25, 25);
    controlla(s.size === 1 && s.has(r.pesi[r.chiesta]!), 'bilancia: soluzione non unica');
  }
  // Regola di papà: da 2 forme una bilancia sola non basta (né per l'algebra, né per chi pensa "tutti positivi").
  if (n >= 2) {
    for (const b of r.bilance) {
      const altre = bilancia.equazione(b).coef.some((c, i) => c !== 0 && i !== r.chiesta);
      const p = bilancia.valoriPossibili([b], n, r.chiesta, 1, 25);
      controlla(altre && !(p.size === 1 && p.has(r.pesi[r.chiesta]!)), 'bilancia: una bilancia sola basta');
    }
  }
  const neg = r.pesi.some((w) => w < 0);
  if (d < 7 && neg) negativi.sotto7++;
  if (d === 7 || d === 8) {
    negativi.n78++;
    if (neg) negativi.neg78++;
  }
  if (d >= 9) {
    negativi.n910++;
    if (neg) negativi.neg910++;
  }
  if (neg) {
    negativi.conNeg++;
    if (r.pesi[r.chiesta]! < 0) negativi.chiestaNeg++;
  }
  if (d === 0) {
    tipiBilancia.n0++;
    if (r.tipo === 'uno') tipiBilancia.uno0++;
  }
  if (d === 2) {
    tipiBilancia.n2++;
    if (r.tipo === 'scala' && n === 2) tipiBilancia.scala2++;
  }
}, (r) => {
  const piatto = (p: bilancia.Piatto) =>
    [...p.forme.flatMap((n, i) => Array<string>(n).fill(bilancia.FORME[i]!)), ...(p.peso ? [String(p.peso)] : [])].join('') || '∅';
  return `${r.bilance.map((b) => `${piatto(b.sinistra)} = ${piatto(b.destra)}`).join(' ; ')}  → ${bilancia.FORME[r.chiesta]}? (${bilancia.soluzione(r)})`;
});
console.log(
  `  con una forma negativa: d7-8 ${pc(negativi.neg78, negativi.n78)} · d9-10 ${pc(negativi.neg910, negativi.n910)} · sotto d7 ${negativi.sotto7}; la chiesta è la negativa nel ${pc(negativi.chiestaNeg, negativi.conNeg)}`,
);
console.log(`  d0: una forma sola nel ${pc(tipiBilancia.uno0, tipiBilancia.n0)} · d2: "a scala" con 2 forme nel ${pc(tipiBilancia.scala2, tipiBilancia.n2)}`);
controlla(negativi.sotto7 === 0, 'bilancia: negativi sotto d 7');
controlla(negativi.neg910 / negativi.n910 < 0.3, 'bilancia: i negativi non sono più minoritari');
controlla(tipiBilancia.uno0 === tipiBilancia.n0, 'bilancia: a d0 non sempre una forma sola');

// ── Trova la regola ──
const truccoPerFascia = [0, 0, 0, 0, 0];
const contaPerFascia = [0, 0, 0, 0, 0];
const scrittePerD = new Map<number, Map<string, number>>();
const papaPerD = new Map<number, number>();
const chiave = (t: number[], x: number) => `${t.join(',')}→${x}`;
const SCRITTE = new Set(SEQUENZE_PAPA.map((s) => chiave(s.termini, s.risposta)));
const DI_PAPA = new Set(SEQUENZE_PAPA.filter((s) => s.autore === 'papà').map((s) => chiave(s.termini, s.risposta)));
prova('Trova la regola', (d) => regola.genera(d, rng), (r, d) => {
  controlla(Number.isFinite(r.risposta), 'regola: risposta non finita');
  const f = Math.min(4, Math.floor(d / 2));
  contaPerFascia[f]!++;
  if (regola.previsioneTrucco(r.termini) === r.risposta) truccoPerFascia[f]!++;
  const k = chiave(r.termini, r.risposta);
  if (SCRITTE.has(k)) {
    const m = scrittePerD.get(d) ?? new Map<string, number>();
    scrittePerD.set(d, conta(m, k));
  }
  if (DI_PAPA.has(k)) papaPerD.set(d, (papaPerD.get(d) ?? 0) + 1);
}, (r) => `${r.termini.join(', ')}, ? → ${r.risposta}   (${r.regola})`);
console.log(
  `  il trucco "aggiungo l'ultima differenza" indovina, per fascia 0-4: ${truccoPerFascia
    .map((t, i) => pc(t, contaPerFascia[i]!))
    .join(' / ')}`,
);
const piuFrequente = DIFF.map((d) => Math.max(0, ...(scrittePerD.get(d)?.values() ?? [])) / N);
const scritteTot = DIFF.map((d) => [...(scrittePerD.get(d)?.values() ?? [])].reduce((a, b) => a + b, 0) / N);
console.log(`  la sequenza scritta più frequente, per d 0-10: ${piuFrequente.map((q) => Math.round(q * 100) + '%').join(' ')}`);
console.log(`  le scritte in tutto, per d 0-10: ${scritteTot.map((q) => Math.round(q * 100) + '%').join(' ')}`);
console.log(`  quelle di papà, per d 0-10: ${DIFF.map((d) => pc(papaPerD.get(d) ?? 0, N)).join(' ')}`);
controlla(piuFrequente.every((q) => q <= 0.25), 'regola: una sequenza scritta esce troppo spesso (si impara a memoria)');
controlla(scritteTot.every((q) => q <= 0.56), 'regola: le sequenze scritte sono più di metà');
// Le sequenze scritte: difficoltà, la regola (terzo aiuto) non rivela la risposta, il trucco non le risolve.
for (const s of SEQUENZE_PAPA) {
  controlla(s.difficolta >= 0 && s.difficolta <= 10, `regola: difficoltà fuori 0-10 (${s.termini})`);
  controlla(s.risposta < 10 || !s.regola.includes(String(s.risposta)), `regola: la regola rivela la risposta (${s.termini})`);
  if (s.difficolta >= 4) controlla(regola.previsioneTrucco(s.termini) !== s.risposta, `regola: il trucco risolve ${s.termini}`);
}
// Le due di papà seguono la regola che dichiarano: ×2 e +1 a turno; n → 2n − 1.
const RICORRENZE_PAPA: Record<string, (prec: number, i: number) => number> = {
  '3,6,7,14,15,30': (p, i) => (i % 2 === 1 ? p * 2 : p + 1),
  '2,3,5,9,17,33': (p) => 2 * p - 1,
};
for (const s of SEQUENZE_PAPA.filter((x) => x.autore === 'papà')) {
  const passo = RICORRENZE_PAPA[s.termini.join(',')];
  if (!passo) continue;
  const tutti = [...s.termini, s.risposta];
  controlla(tutti.every((x, i) => i === 0 || x === passo(tutti[i - 1]!, i)), `regola: sequenza di papà incoerente (${s.termini})`);
}
controlla(SEQUENZE_PAPA.filter((s) => s.autore === 'papà').length >= 2, 'regola: mancano le sequenze di papà');

console.log(problemi === 0 ? '\n✓ Nessun problema.' : `\n✗ ${problemi} problemi.`);
process.exit(problemi === 0 ? 0 : 1);
