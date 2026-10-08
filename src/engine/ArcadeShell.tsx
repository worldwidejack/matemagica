import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArcadeGame } from './cartuccia';
import { SCOSSA, type FinePartita, type PlayProps } from './partita';
import { Pronto } from './Pronto';
import {
  PARTITA,
  bravuraConLimiti,
  bravuraDopoPartita,
  dentroLimiti,
  diffDopoRisposta,
  diffIniziale,
  moltiplicatore,
  punti,
  stelle as calcolaStelle,
  type Limiti,
} from './regole';
import { Risultato } from './Risultato';
import { suona, vibra } from '@/audio/sfx';
import { rngConSeme, type Rng } from './caso';
import type { RiepilogoPartita } from '@/profilo/store';

type Stato<R, A> = {
  fase: 'pronto' | 'gioco' | 'fine';
  round: R | null;
  d: number;
  punteggio: number;
  vite: number;
  combo: number;
  comboMax: number;
  roundGiocati: number;
  giuste: number;
  errori: number;
  diffGiuste: number[];
  given: A | null;
  correct: boolean | null;
  revealing: boolean;
  locked: boolean;
  /** Cresce a ogni evento: rilancia le animazioni (CSS keyed). */
  colpo: number;
  guadagno: number;
  /** Il `colpo` in cui sono stati presi gli ultimi punti: solo lì si mostra il "+N". */
  colpoPunti: number;
  /** Il `colpo` dell'ultimo errore: lì si mostra il lampo rosso. */
  colpoErrore: number;
  budget: number;
  inizio: number;
  annuncioCombo: number | null;
  /** Numero del quesito: la vista del gioco si azzera a ogni quesito nuovo. */
  nRound: number;
};

function statoIniziale<R, A>(bravura: number, limiti?: Limiti): Stato<R, A> {
  return {
    fase: 'pronto',
    round: null,
    d: dentroLimiti(diffIniziale(bravura), limiti),
    punteggio: 0,
    vite: PARTITA.vite,
    combo: 0,
    comboMax: 0,
    roundGiocati: 0,
    giuste: 0,
    errori: 0,
    diffGiuste: [],
    given: null,
    correct: null,
    revealing: false,
    locked: true,
    colpo: 0,
    guadagno: 0,
    colpoPunti: -1,
    colpoErrore: -1,
    budget: 1,
    inizio: 0,
    annuncioCombo: null,
    nRound: 0,
  };
}

const PAUSA_GIUSTA = 420;
const PAUSA_SBAGLIATA = 1100;

function rapiditaOra<R, A>(st: Stato<R, A>): number {
  return Math.max(0, Math.min(1, 1 - (performance.now() - st.inizio) / st.budget));
}

/** Una risposta giusta (finale o parziale): punti, combo, suono. */
function premia<R, A>(st: Stato<R, A>, rapidita: number): void {
  const prima = moltiplicatore(st.combo);
  st.guadagno = punti(st.d, rapidita, st.combo);
  st.punteggio += st.guadagno;
  st.combo++;
  st.comboMax = Math.max(st.comboMax, st.combo);
  st.colpo++;
  st.colpoPunti = st.colpo;
  const dopo = moltiplicatore(st.combo);
  if (dopo > prima) {
    st.annuncioCombo = dopo;
    suona('combo');
    vibra(25);
  } else {
    suona('giusto', st.combo / 12);
  }
}

/** Una risposta sbagliata (finale o parziale): vita, combo, suono, scossa. */
function punisci<R, A>(st: Stato<R, A>, campo: HTMLDivElement | null): void {
  st.errori++;
  st.vite--;
  st.combo = 0;
  st.colpo++;
  st.colpoErrore = st.colpo;
  suona('sbagliato');
  vibra(120);
  campo?.animate(SCOSSA, { duration: 400, easing: 'ease-in-out' });
}

/**
 * Il motore arcade: possiede timer, vite, combo, punteggio, livello adattivo,
 * suoni e risultato — per TUTTI i giochi arcade. Il gioco riceve un quesito e
 * restituisce risposte.
 *
 * Lo stato vive in un ref (i timer lo leggono sempre aggiornato); a ogni evento
 * se ne fa una copia per il disegno. Il timer visivo è un'animazione CSS:
 * zero render per frame.
 */
export function ArcadeShell<R, A>({
  game,
  bravura,
  record,
  limiti,
  etichetta,
  inPalestra,
  seme,
  condividi,
  onFine,
  onEsci,
}: PlayProps & { game: ArcadeGame<R, A> }) {
  // Con un seme (sfida del giorno) i quesiti sono gli stessi per tutti.
  const rng = useRef<Rng>(seme !== undefined ? rngConSeme(seme) : Math.random);
  const totale = game.roundPerPartita ?? PARTITA.round;
  const s = useRef<Stato<R, A>>(statoIniziale<R, A>(bravura, limiti));
  // I timer leggono e scrivono il ref; lo schermo si disegna da questa copia.
  const [st, setVista] = useState<Stato<R, A>>(() => statoIniziale<R, A>(bravura, limiti));
  const ridisegna = useCallback(() => setVista({ ...s.current }), []);
  const timer = useRef<number | null>(null);
  const campo = useRef<HTMLDivElement>(null);
  const [fine, setFine] = useState<{ fine: FinePartita; riepilogo: RiepilogoPartita } | null>(null);

  const pulisci = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => pulisci, [pulisci]);

  const chiudi = useCallback(() => {
    pulisci();
    const st = s.current;
    const esito = {
      punteggio: st.punteggio,
      giuste: st.giuste,
      errori: st.errori,
      roundGiocati: st.roundGiocati,
      comboMax: st.comboMax,
    };
    const f: FinePartita = {
      punteggio: st.punteggio,
      stelle: calcolaStelle(esito, totale),
      bravuraDopo: bravuraConLimiti(bravura, bravuraDopoPartita(bravura, st.diffGiuste), st.diffGiuste, limiti),
      dati: [
        { etichetta: 'Giuste', valore: `${st.giuste}/${st.roundGiocati}` },
        { etichetta: 'Combo max', valore: String(st.comboMax) },
      ],
      comboMax: st.comboMax,
      giuste: st.giuste,
    };
    st.fase = 'fine';
    st.locked = true;
    suona('fine');
    setFine({ fine: f, riepilogo: onFine(f) });
    ridisegna();
  }, [bravura, limiti, onFine, pulisci, ridisegna, totale]);

  // Riferimento stabile per i timer annidati.
  const risposta = useRef<(a: A | null) => void>(() => {});

  const avviaTimer = useCallback(() => {
    const st = s.current;
    if (st.round === null) return;
    st.revealing = false;
    st.locked = false;
    st.budget = game.timeFor(st.round, st.d);
    st.inizio = performance.now();
    st.colpo++;
    ridisegna();
    timer.current = window.setTimeout(() => risposta.current(null), st.budget);
  }, [game, ridisegna]);

  const nuovoRound = useCallback(() => {
    const st = s.current;
    if (st.roundGiocati >= totale || st.vite <= 0) return chiudi();
    st.round = game.generate(st.d, rng.current);
    st.nRound++;
    st.given = null;
    st.correct = null;
    st.annuncioCombo = null;
    const reveal = game.revealFor?.(st.round) ?? 0;
    if (reveal > 0) {
      st.revealing = true;
      st.locked = true;
      st.colpo++;
      ridisegna();
      timer.current = window.setTimeout(avviaTimer, reveal);
    } else {
      avviaTimer();
    }
  }, [game, chiudi, avviaTimer, ridisegna, totale]);

  const rispondi = useCallback(
    (a: A | null) => {
      const st = s.current;
      if (st.locked || st.round === null || st.fase !== 'gioco') return;
      pulisci();
      st.locked = true;
      const rapidita = a === null ? 0 : rapiditaOra(st);
      const ok = a !== null && game.check(st.round, a);
      st.given = a;
      st.correct = ok;
      st.roundGiocati++;
      if (ok) {
        st.giuste++;
        st.diffGiuste.push(st.d);
        premia(st, rapidita);
      } else {
        punisci(st, campo.current);
      }
      st.d = dentroLimiti(diffDopoRisposta(st.d, ok, rapidita, undefined, PARTITA.round / totale), limiti);
      ridisegna();
      timer.current = window.setTimeout(nuovoRound, ok ? PAUSA_GIUSTA : PAUSA_SBAGLIATA);
    },
    [game, limiti, nuovoRound, pulisci, ridisegna, totale],
  );
  useEffect(() => {
    risposta.current = rispondi;
  }, [rispondi]);

  const onHit = useCallback(() => {
    const st = s.current;
    if (st.locked || st.fase !== 'gioco') return;
    premia(st, rapiditaOra(st));
    ridisegna();
  }, [ridisegna]);

  const onMiss = useCallback(() => {
    const st = s.current;
    if (st.locked || st.fase !== 'gioco') return;
    punisci(st, campo.current);
    ridisegna();
    if (st.vite <= 0) {
      st.locked = true;
      timer.current = window.setTimeout(chiudi, PAUSA_SBAGLIATA);
    }
  }, [chiudi, ridisegna]);

  const onAnswer = useCallback((a: A) => risposta.current(a), []);

  const via = useCallback(() => {
    pulisci();
    setFine(null);
    s.current = statoIniziale<R, A>(bravura, limiti);
    s.current.fase = 'gioco';
    if (seme !== undefined) rng.current = rngConSeme(seme);
    suona('tap');
    nuovoRound();
  }, [bravura, limiti, nuovoRound, pulisci, seme]);

  if (st.fase === 'fine' && fine) {
    return (
      <Risultato
        titolo={game.title}
        etichetta={etichetta}
        fine={fine.fine}
        riepilogo={fine.riepilogo}
        inPalestra={inPalestra}
        condividi={condividi?.(fine.fine)}
        onAncora={via}
        onEsci={() => onEsci(true)}
      />
    );
  }

  if (st.fase === 'pronto') {
    return (
      <Pronto
        titolo={game.title}
        hint={game.hint}
        etichetta={etichetta}
        bravura={bravura}
        record={record}
        tipo="arcade"
        onVia={via}
        onEsci={() => onEsci(false)}
      />
    );
  }

  const molt = moltiplicatore(st.combo);
  const feedback = st.correct !== null;
  const View = game.View;

  return (
    <div ref={campo} className="relative flex min-h-full flex-col px-4 pt-3 pb-6">
      {/* Bagliore di sfondo: cresce col combo, il gioco "si scalda". */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: Math.min(0.9, st.combo / 12),
          background: 'radial-gradient(circle at 50% 40%, var(--color-oro-500) 0%, transparent 65%)',
          mixBlendMode: 'soft-light',
        }}
      />
      {st.colpoErrore === st.colpo && (
        <div key={`flash-${st.colpo}`} className="animate-flash pointer-events-none absolute inset-0 bg-pericolo-400/25" />
      )}

      <header className="relative flex items-center justify-between text-lg">
        <button onClick={() => onEsci(false)} className="text-2xl text-panna-100/50" aria-label="Esci">
          ✕
        </button>
        <div className="flex gap-1.5 text-2xl" aria-label={`${st.vite} vite`}>
          {Array.from({ length: PARTITA.vite }, (_, i) => (
            <span key={i} className={i < st.vite ? 'text-magenta-400' : 'text-panna-100/15'}>
              ◆
            </span>
          ))}
        </div>
        <div className="relative min-w-16 text-right font-bold tabular-nums text-oro-400">
          {st.punteggio}
          {st.colpoPunti === st.colpo ? (
            <span key={`pti-${st.colpo}`} className="animate-sali absolute top-6 right-0 text-base text-oro-300">
              +{st.guadagno}
            </span>
          ) : null}
        </div>
      </header>

      <div className="relative mt-2 flex items-center justify-between text-sm text-panna-100/50">
        <span className="tabular-nums">
          {Math.min(st.roundGiocati + (feedback ? 0 : 1), totale)} / {totale}
        </span>
        {molt > 1 && (
          <span key={`molt-${molt}`} className="animate-pop rounded-full bg-oro-400 px-3 py-0.5 font-bold text-inchiostro">
            ×{molt}
          </span>
        )}
      </div>

      <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-notte-950/50">
        {!st.revealing && !feedback && st.fase === 'gioco' && (
          <div
            key={`timer-${st.roundGiocati}-${st.inizio}`}
            className="animate-timer h-full rounded-full bg-turchese-400"
            style={{ animationDuration: `${st.budget}ms` }}
          />
        )}
      </div>

      {st.annuncioCombo !== null && st.colpoPunti === st.colpo && (
        <div
          key={`combo-${st.colpo}`}
          className="animate-annuncio pointer-events-none absolute inset-x-0 top-1/3 z-10 text-center text-5xl font-black text-oro-400 drop-shadow-[0_0_20px_var(--color-oro-500)]"
        >
          COMBO ×{st.annuncioCombo}!
        </div>
      )}

      <main className="relative flex flex-1 flex-col justify-center py-6">
        {st.round !== null && (
          <View
            key={st.nRound}
            round={st.round}
            onAnswer={onAnswer}
            onHit={onHit}
            onMiss={onMiss}
            locked={st.locked}
            revealing={st.revealing}
            given={st.given}
            correct={st.correct}
          />
        )}
      </main>
    </div>
  );
}
