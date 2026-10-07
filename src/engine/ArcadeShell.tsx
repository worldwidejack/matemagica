import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArcadeGame } from './cartuccia';
import {
  PARTITA,
  bravuraDopoPartita,
  diffDopoRisposta,
  diffIniziale,
  moltiplicatore,
  punti,
  stelle as calcolaStelle,
  type EsitoPartita,
  type Stelle,
} from './regole';
import { Risultato } from './Risultato';
import { suona, vibra } from '@/audio/sfx';
import type { RiepilogoPartita } from '@/profilo/store';

export type FinePartita = { esito: EsitoPartita; stelle: Stelle; bravuraDopo: number };

export type PlayProps = {
  bravura: number;
  record: number;
  /** Chi monta il motore salva la partita e restituisce il riepilogo da mostrare. */
  onFine: (f: FinePartita) => RiepilogoPartita;
  onEsci: () => void;
};

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
  budget: number;
  inizio: number;
  annuncioCombo: number | null;
};

function statoIniziale<R, A>(bravura: number): Stato<R, A> {
  return {
    fase: 'pronto',
    round: null,
    d: diffIniziale(bravura),
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
    budget: 1,
    inizio: 0,
    annuncioCombo: null,
  };
}

const PAUSA_GIUSTA = 420;
const PAUSA_SBAGLIATA = 1100;

const SCOSSA: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-9px)' },
  { transform: 'translateX(8px)' },
  { transform: 'translateX(-5px)' },
  { transform: 'translateX(3px)' },
  { transform: 'translateX(0)' },
];

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
  } else {
    suona('giusto', st.combo / 12);
  }
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
export function ArcadeShell<R, A>({ game, bravura, record, onFine, onEsci }: PlayProps & { game: ArcadeGame<R, A> }) {
  const s = useRef<Stato<R, A>>(statoIniziale<R, A>(bravura));
  // I timer leggono e scrivono il ref; lo schermo si disegna da questa copia.
  const [st, setVista] = useState<Stato<R, A>>(() => statoIniziale<R, A>(bravura));
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
    const st = s.current;
    const esito: EsitoPartita = {
      punteggio: st.punteggio,
      giuste: st.giuste,
      errori: st.errori,
      roundGiocati: st.roundGiocati,
      comboMax: st.comboMax,
    };
    const f: FinePartita = {
      esito,
      stelle: calcolaStelle(esito),
      bravuraDopo: bravuraDopoPartita(bravura, st.diffGiuste),
    };
    st.fase = 'fine';
    suona('fine');
    setFine({ fine: f, riepilogo: onFine(f) });
    ridisegna();
  }, [bravura, onFine, ridisegna]);

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
    if (st.roundGiocati >= PARTITA.round || st.vite <= 0) return chiudi();
    st.round = game.generate(st.d, Math.random);
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
  }, [game, chiudi, avviaTimer, ridisegna]);

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
        st.errori++;
        st.vite--;
        st.combo = 0;
        st.colpo++;
        suona('sbagliato');
        vibra(120);
        campo.current?.animate(SCOSSA, { duration: 400, easing: 'ease-in-out' });
      }
      st.d = diffDopoRisposta(st.d, ok, rapidita);
      ridisegna();
      timer.current = window.setTimeout(nuovoRound, ok ? PAUSA_GIUSTA : PAUSA_SBAGLIATA);
    },
    [game, nuovoRound, pulisci, ridisegna],
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

  const onAnswer = useCallback((a: A) => risposta.current(a), []);

  const via = useCallback(() => {
    pulisci();
    setFine(null);
    s.current = statoIniziale<R, A>(bravura);
    s.current.fase = 'gioco';
    suona('tap');
    nuovoRound();
  }, [bravura, nuovoRound, pulisci]);

  if (st.fase === 'fine' && fine) {
    return (
      <Risultato
        titolo={game.title}
        fine={fine.fine}
        riepilogo={fine.riepilogo}
        onAncora={via}
        onEsci={onEsci}
      />
    );
  }

  if (st.fase === 'pronto') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 text-center">
        <button onClick={onEsci} className="absolute top-4 left-4 text-2xl text-white/50" aria-label="Esci">
          ✕
        </button>
        <h1 className="font-display text-4xl font-bold text-oro-400">{game.title}</h1>
        <p className="max-w-xs text-lg text-white/80">{game.hint}</p>
        <div className="w-full max-w-xs">
          <div className="mb-1 flex justify-between text-sm text-white/60">
            <span>Bravura</span>
            <span>{bravura.toFixed(1)} / 10</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-notte-600">
            <div className="h-full rounded-full bg-turchese-400" style={{ width: `${bravura * 10}%` }} />
          </div>
          {record > 0 && <p className="mt-3 text-sm text-white/60">Record: {record}</p>}
        </div>
        <button
          onClick={via}
          className="animate-respiro mt-4 rounded-2xl bg-oro-500 px-14 py-5 text-2xl font-bold text-notte-900 shadow-[0_0_40px_var(--color-oro-500)] active:scale-95"
        >
          Via!
        </button>
      </div>
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
      {st.correct === false && (
        <div key={`flash-${st.colpo}`} className="animate-flash pointer-events-none absolute inset-0 bg-pericolo-400/25" />
      )}

      <header className="relative flex items-center justify-between text-lg">
        <button onClick={onEsci} className="text-2xl text-white/50" aria-label="Esci">
          ✕
        </button>
        <div className="flex gap-1.5 text-2xl" aria-label={`${st.vite} vite`}>
          {Array.from({ length: PARTITA.vite }, (_, i) => (
            <span key={i} className={i < st.vite ? 'text-magenta-400' : 'text-white/15'}>
              ◆
            </span>
          ))}
        </div>
        <div className="relative min-w-16 text-right font-bold tabular-nums text-oro-400">
          {st.punteggio}
          {st.colpoPunti === st.colpo ? (
            <span key={`pti-${st.colpo}`} className="animate-sali absolute top-6 right-0 text-base text-turchese-300">
              +{st.guadagno}
            </span>
          ) : null}
        </div>
      </header>

      <div className="relative mt-2 flex items-center justify-between text-sm text-white/50">
        <span className="tabular-nums">
          {Math.min(st.roundGiocati + (feedback ? 0 : 1), PARTITA.round)} / {PARTITA.round}
        </span>
        {molt > 1 && (
          <span key={`molt-${molt}`} className="animate-pop rounded-full bg-oro-500 px-3 py-0.5 font-bold text-notte-900">
            ×{molt}
          </span>
        )}
      </div>

      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-notte-600">
        {!st.revealing && !st.locked && (
          <div
            key={`timer-${st.colpo}`}
            className="animate-timer h-full rounded-full bg-turchese-400"
            style={{ animationDuration: `${st.budget}ms` }}
          />
        )}
      </div>

      {st.annuncioCombo !== null && (
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
            round={st.round}
            onAnswer={onAnswer}
            onHit={onHit}
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
