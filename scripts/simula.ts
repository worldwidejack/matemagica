/**
 * Simulazione: migliaia di partite finte per tarare i numeri del motore
 * (stelle, livello adattivo, durata) senza indovinare a occhio.
 *
 *   npm run simula
 *
 * Il giocatore finto ha una bravura "vera" s (0-10): risponde giusto con
 * probabilità alta se il quesito è sotto la sua bravura, bassa se è sopra.
 * Modella il tempo di reazione, non la fatica: i numeri veri li danno le
 * partite di Jack e papà.
 */
import { rngConSeme, type Rng } from '../src/engine/caso.ts';
import {
  PARTITA,
  ADATTIVO,
  bravuraDopoPartita,
  diffDopoRisposta,
  diffIniziale,
  type ParametriAdattivi,
  punti,
  stelle,
  type EsitoPartita,
} from '../src/engine/regole.ts';
import { genera, tempo } from '../src/games/piu-grande/logica.ts';

function probGiusta(s: number, d: number): number {
  return 0.5 + 0.47 / (1 + Math.exp(-1.3 * (s - d + 1)));
}

function partita(s: number, bravura: number, rng: Rng, p: ParametriAdattivi) {
  let d = diffIniziale(bravura, p);
  let combo = 0;
  const e: EsitoPartita = { punteggio: 0, giuste: 0, errori: 0, roundGiocati: 0, comboMax: 0 };
  const diffGiuste: number[] = [];
  let secondi = 0;
  while (e.roundGiocati < PARTITA.round && e.errori < PARTITA.vite) {
    genera(d, rng); // esercita anche il generatore
    const budget = tempo(d);
    const rapidita = Math.max(0, Math.min(1, 0.75 - 0.08 * (d - s) + (rng() - 0.5) * 0.4));
    secondi += (budget * (1 - rapidita)) / 1000 + 0.6;
    const ok = rng() < probGiusta(s, d);
    e.roundGiocati++;
    if (ok) {
      e.giuste++;
      e.punteggio += punti(d, rapidita, combo);
      combo++;
      e.comboMax = Math.max(e.comboMax, combo);
      diffGiuste.push(d);
    } else {
      e.errori++;
      combo = 0;
    }
    d = diffDopoRisposta(d, ok, rapidita, p);
  }
  return { e, stelle: stelle(e), bravura: bravuraDopoPartita(bravura, diffGiuste, p), secondi };
}

const rng = rngConSeme(42);
// Per provare una taratura: npm run simula -- '{"discesa":1.5}'
const p: ParametriAdattivi = { ...ADATTIVO, ...(JSON.parse(process.argv[2] ?? '{}') as Partial<ParametriAdattivi>) };
console.log('parametri', JSON.stringify(p));
console.log('bravura vera | bravura dopo 1 / 5 / 15 partite | stelle (0/1/2/3 su 15) | durata media | punti medi');
for (const s of [1, 3, 5, 7, 9]) {
  let bravura = 0;
  const traccia: number[] = [];
  const conteggio = [0, 0, 0, 0];
  let durata = 0;
  let pti = 0;
  for (let i = 0; i < 15; i++) {
    const r = partita(s, bravura, rng, p);
    bravura = r.bravura;
    traccia.push(bravura);
    conteggio[r.stelle]!++;
    durata += r.secondi;
    pti += r.e.punteggio;
  }
  console.log(
    `   ${s}        |  ${traccia[0]!.toFixed(1)} / ${traccia[4]!.toFixed(1)} / ${traccia[14]!.toFixed(1)}` +
      `                    |  ${conteggio.join('/')}               |  ${Math.round(durata / 15)} s        | ${Math.round(pti / 15)}`,
  );
}

// Controllo della regola di papà: il trucco "numero più grosso" deve fallire spesso.
let inganni = 0;
const N = 4000;
for (let i = 0; i < N; i++) if (genera(2 + (i % 9), rng).ingannevole) inganni++;
console.log(`\nQuesiti dove il trucco "vince il numero più grosso" sbaglia: ${Math.round((inganni / N) * 100)}%`);

// Altro trucco da evitare: un numero in comune tra le due espressioni.
let inComune = 0;
for (let i = 0; i < N; i++) {
  const r = genera(i % 11, rng);
  if (r.a.numeri.some((n) => r.b.numeri.includes(n))) inComune++;
}
console.log(`Quesiti con un numero in comune (da tenere vicino a 0): ${Math.round((inComune / N) * 100)}%`);

console.log('\nEsempi per difficoltà:');
for (const d of [0, 2, 4, 6, 8, 10]) {
  const es = Array.from({ length: 3 }, () => {
    const r = genera(d, rng);
    return `${r.a.testo} vs ${r.b.testo}`;
  });
  console.log(`  ${d}: ${es.join('  ·  ')}`);
}
