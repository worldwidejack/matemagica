import { useMemo, useRef, useState, type PointerEvent as PE } from 'react';
import type { ArcadeGame, ArcadeViewProps } from '@/engine/cartuccia';
import { menoMovimento } from '@/anim/orologio';
import { suona, vibra } from '@/audio/sfx';
import { formatta, genera, rivela, tempo, type RoundStima } from './logica';
import './stile.css';

/** Margine ai lati della linea e distanza minima fra due punti, in frazione della larghezza. */
const MARGINE = 0.16;
const DISTANZA_MIN = 0.3;

/**
 * Dove stanno i tre punti sulla linea (0-1 della larghezza), in scala vera fra
 * loro; quello in mezzo non può avvicinarsi troppo agli estremi, così col dito
 * si distinguono sempre. La posizione non dice quale è la giusta: le opzioni
 * sono solo tre valori arrotondati.
 */
function posizioni(opzioni: number[]): number[] {
  const min = Math.min(...opzioni);
  const max = Math.max(...opzioni);
  const span = max - min || 1;
  return opzioni.map((o) => {
    let t = (o - min) / span;
    if (t > 0 && t < 1) t = Math.min(1 - DISTANZA_MIN, Math.max(DISTANZA_MIN, t));
    return MARGINE + t * (1 - 2 * MARGINE);
  });
}

/** Indice del punto più vicino a x. */
function vicino(pos: number[], x: number): number {
  let best = 0;
  pos.forEach((p, i) => {
    if (Math.abs(p - x) < Math.abs((pos[best] ?? 0) - x)) best = i;
  });
  return best;
}

/**
 * «Oltre la porta»: sotto il calcolo c'è una linea dei numeri con tre punti.
 * La goccia parte posata in un incavo sotto la linea; al primo tocco sale sulla
 * linea e segue il dito in orizzontale (o si tocca un punto). Al rilascio cade
 * sul punto più vicino e quella è la risposta. Niente si accende prima.
 */
function Vista({ round, onAnswer, locked, given, correct }: ArcadeViewProps<RoundStima, number>) {
  const feedback = correct !== null;
  const pos = useMemo(() => posizioni(round.opzioni), [round]);
  const [x, setX] = useState(0.5);
  const [toccato, setToccato] = useState(false);
  const [preso, setPreso] = useState(false);
  const [rilasciato, setRilasciato] = useState(false);
  const campo = useRef<HTMLDivElement>(null);
  const attivo = useRef<number | null>(null);
  const dato = useRef(false);
  const ultimo = useRef(-1);
  const fermo = menoMovimento();

  const frazione = (e: PE<HTMLDivElement>) => {
    const r = campo.current?.getBoundingClientRect();
    if (!r || r.width === 0) return 0.5;
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  };
  const segui = (f: number) => {
    setX(f);
    const v = vicino(pos, f);
    if (v !== ultimo.current) {
      if (ultimo.current !== -1) {
        suona('tap');
        vibra(8);
      }
      ultimo.current = v;
    }
  };

  const giu = (e: PE<HTMLDivElement>) => {
    if (locked || feedback || dato.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    attivo.current = e.pointerId;
    setPreso(true);
    setToccato(true);
    ultimo.current = -1;
    segui(frazione(e));
    suona('tap');
  };
  const muovi = (e: PE<HTMLDivElement>) => {
    if (attivo.current !== e.pointerId || dato.current) return;
    segui(frazione(e));
  };
  const su = (e: PE<HTMLDivElement>) => {
    if (attivo.current !== e.pointerId) return;
    attivo.current = null;
    setPreso(false);
    if (dato.current || locked || feedback) return;
    dato.current = true;
    setRilasciato(true);
    const i = vicino(pos, frazione(e));
    setX(pos[i] ?? 0.5);
    onAnswer(i);
  };

  const parcheggiato = !toccato;
  const xMostrata = given !== null ? (pos[given] ?? x) : parcheggiato ? 0.5 : x;
  const inCorsa = preso && !feedback ? vicino(pos, x) : -1;
  const reazioneGiusta = feedback && correct === true;
  const reazioneSbagliata = feedback && correct === false;
  const anim = fermo
    ? ''
    : reazioneGiusta
      ? 'stima-rimbalzo'
      : reazioneSbagliata
        ? 'stima-scossa'
        : rilasciato
          ? 'stima-cade'
          : '';

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <div className="text-center">
        {round.sopra && <p className="mb-2 text-xl text-panna-100/75">{round.sopra}</p>}
        <p className="titolo text-[clamp(2.8rem,15vw,4.4rem)] leading-none font-semibold tabular-nums">{round.testo}</p>
        {round.formula && <p className="mt-3 text-base text-panna-100/70 tabular-nums">{round.formula}</p>}
        <p className={`mt-3 text-xl ${feedback ? 'text-panna-100/80' : 'text-panna-100/70'}`}>
          {feedback ? rivela(round) : (round.domanda ?? '≈ quanto, più o meno?')}
        </p>
      </div>

      {/* L'area del gesto: tutta questa fascia prende il dito. La linea sta al 62%. */}
      <div
        ref={campo}
        onPointerDown={giu}
        onPointerMove={muovi}
        onPointerUp={su}
        onPointerCancel={su}
        className="relative min-h-[260px] w-full max-w-[420px] flex-1 touch-none self-center select-none"
      >
        {/* Le tacche. */}
        {Array.from({ length: 21 }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute top-[62%] w-[3px] rounded-full bg-panna-100/55"
            style={{ left: `${(i / 20) * 100}%`, height: i % 5 === 0 ? 26 : 14, transform: 'translate(-50%, -50%)' }}
          />
        ))}
        {/* La linea. */}
        <div className="absolute inset-x-0 top-[62%] h-2 -translate-y-1/2 rounded-full bg-panna-100/60" />

        {/* I tre punti con la loro etichetta. */}
        {round.opzioni.map((o, i) => {
          const p = pos[i] ?? 0.5;
          const rango = pos.filter((q) => q < p).length;
          const giusta = feedback && i === round.giusta;
          const accesaOro = giusta && correct === true;
          const accesaTurchese = giusta && correct === false;
          const sbagliata = reazioneSbagliata && given === i;
          const grande = i === inCorsa || giusta;
          // Gli estremi si ancorano al bordo, quello in mezzo sta più in alto: niente sovrapposizioni.
          const ancora = rango === 0 ? 'left' : rango === 2 ? 'right' : 'center';
          const sposta = rango === 0 ? 'translateX(-24px)' : rango === 2 ? 'translateX(calc(-100% + 24px))' : 'translateX(-50%)';
          return (
            <div key={o}>
              <div
                className="absolute w-0"
                style={{ left: `${p * 100}%`, bottom: `calc(38% + ${rango === 1 ? 74 : 30}px)` }}
              >
                <div
                  className={['absolute bottom-0 left-0 flex flex-col whitespace-nowrap', fermo ? '' : 'transition-transform duration-150'].join(' ')}
                  style={{
                    transform: `${sposta} scale(${grande ? 1.3 : 1})`,
                    transformOrigin: `bottom ${ancora}`,
                    alignItems: ancora === 'left' ? 'flex-start' : ancora === 'right' ? 'flex-end' : 'center',
                  }}
                >
                  <span
                    className={[
                      'titolo text-[1.6rem] leading-none font-semibold tabular-nums',
                      accesaOro ? 'text-oro-400' : accesaTurchese ? 'text-turchese-300' : sbagliata ? 'text-pericolo-400' : 'text-panna-50',
                    ].join(' ')}
                  >
                    {formatta(o)}
                  </span>
                  <span className="mt-1 h-4 text-sm leading-4 text-panna-100/65">{round.unita ?? ''}</span>
                </div>
              </div>
              <span
                aria-hidden
                className={[
                  'absolute top-[62%] rounded-full border-[3px]',
                  accesaOro
                    ? 'h-7 w-7 border-oro-600 bg-oro-400 shadow-[0_0_26px_var(--color-oro-500)]'
                    : accesaTurchese
                      ? 'h-7 w-7 border-turchese-500 bg-turchese-400 shadow-[0_0_26px_var(--color-turchese-400)]'
                      : 'h-5 w-5 border-inchiostro bg-panna-100',
                ].join(' ')}
                style={{ left: `${p * 100}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
          );
        })}

        {/* L'incavo dove la goccia aspetta. */}
        <div
          aria-hidden
          className="absolute left-1/2 h-16 w-16 rounded-full border-2 border-dashed border-panna-100/35 bg-notte-950/50"
          style={{ top: 'calc(62% + 78px)', transform: 'translate(-50%, -50%)' }}
        />
        {parcheggiato && !feedback && (
          <p
            className="animate-respiro absolute text-base text-panna-100/60"
            style={{ top: 'calc(62% + 78px)', left: 'calc(50% + 44px)', transform: 'translateY(-50%)' }}
          >
            trascina ↑
          </p>
        )}

        {/* La goccia: grande, comoda per il pollice. */}
        <div
          aria-hidden
          className="pointer-events-none absolute z-10"
          style={{
            left: `${xMostrata * 100}%`,
            top: parcheggiato ? 'calc(62% + 78px)' : '62%',
            transform: 'translate(-50%, -50%)',
            transition: fermo ? 'none' : preso ? 'top 150ms ease-out' : 'left 150ms ease-out, top 150ms ease-out',
          }}
        >
          {preso && !feedback && <div className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-oro-400/40 blur-xl" />}
          <div key={anim} className={`relative ${anim}`}>
            <div
              className={[
                'h-14 w-14 rounded-full border-[3px] shadow-[0_5px_0_var(--color-inchiostro)]',
                reazioneSbagliata ? 'border-pericolo-600 bg-pericolo-400' : preso ? 'scale-110 border-oro-600 bg-oro-300' : 'border-oro-600 bg-oro-400',
                fermo ? '' : 'transition-transform duration-100',
              ].join(' ')}
            >
              <div className="mx-auto mt-3 h-3.5 w-3.5 rounded-full bg-inchiostro/25" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const stimaLampo: ArcadeGame<RoundStima, number> = {
  id: 'stima',
  mode: 'arcade',
  title: 'Stima lampo',
  hint: 'Non c’è tempo per il calcolo esatto: trascina il segnalino sul valore più vicino. Arrotonda!',
  generate: genera,
  View: Vista,
  check: (r, i) => i === r.giusta,
  timeFor: (r, d) => tempo(d, r),
  roundPerPartita: 10,
  fluido: true,
  reazione: (giusta) => (giusta ? 750 : 1300),
};
