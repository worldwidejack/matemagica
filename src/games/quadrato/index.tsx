import { useState } from 'react';
import { suona } from '@/audio/sfx';
import type { PuzzleGame, PuzzleViewProps } from '@/engine/cartuccia';
import { Tastierino } from '../_comune/Tastierino';
import { aiuti, corretta, genera, soluzione, testoNumero, type RoundQuadrato } from './logica';

/** La risposta: la griglia intera, riga per riga (date comprese). */
export type Risposta = number[];

const NUMERO = /^-?\d+$/;

function Vista({ round, onTry, locked, sbagli, risolto }: PuzzleViewProps<RoundQuadrato, Risposta>) {
  const { lato, date, soluzione: sol } = round;
  const vuote = date.flatMap((data, i) => (data ? [] : [i]));
  const [scritti, setScritti] = useState<string[]>(() => date.map(() => ''));
  const [scelta, setScelta] = useState(vuote[0] ?? -1);
  // L'errore resta evidenziato finché non si cambia qualcosa.
  const [letti, setLetti] = useState(sbagli);
  const errore = sbagli > letti && !risolto;
  const piena = vuote.every((i) => NUMERO.test(scritti[i] ?? ''));
  const valore = scritti[scelta] ?? '';

  const scrivi = (v: string) => {
    if (locked || scelta < 0) return;
    setScritti(scritti.map((x, i) => (i === scelta ? v : x)));
    setLetti(sbagli);
  };

  const prova = () => {
    if (locked || !piena) return;
    suona('tap');
    onTry(sol.map((x, i) => (date[i] ? x : Number(scritti[i]))));
  };

  /** OK sul tastierino: alla prossima casella ancora vuota; se è tutto pieno, controlla. */
  const avanti = () => {
    if (piena) return prova();
    const k = vuote.indexOf(scelta);
    const giro = [...vuote.slice(k + 1), ...vuote.slice(0, k + 1)];
    const dopo = giro.find((i) => !NUMERO.test(scritti[i] ?? ''));
    if (dopo !== undefined) setScelta(dopo);
  };

  const segno = () => {
    if (locked || scelta < 0) return;
    suona('tap');
    scrivi(valore.startsWith('-') ? valore.slice(1) : '-' + valore);
  };

  const tocca = (i: number) => {
    if (locked) return;
    suona('tap');
    setScelta(i);
  };

  const testo = lato === 3 ? 'text-3xl' : 'text-2xl';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-bold text-panna-50/90">Righe, colonne e diagonali: stessa somma.</p>
        {round.sommaData && (
          <p className="titolo rounded-full bg-inchiostro/30 px-3.5 py-1 text-sm font-bold text-oro-300">
            Somma magica: <span className="tabular-nums">{testoNumero(round.somma)}</span>
          </p>
        )}
      </div>

      <div className={`mx-auto grid w-full ${lato === 3 ? 'max-w-[16.5rem] grid-cols-3 gap-2' : 'max-w-[18.5rem] grid-cols-4 gap-1.5'}`}>
        {sol.map((x, i) => {
          const base = `titolo flex aspect-square items-center justify-center rounded-2xl font-bold tabular-nums ${testo}`;
          if (date[i]) {
            return (
              <div key={i} className={`${base} bg-panna-50 text-inchiostro shadow-[0_4px_0_rgb(21_19_46/0.22)]`}>
                {testoNumero(x)}
              </div>
            );
          }
          if (risolto) {
            return (
              <div key={i} className={`${base} animate-pop border-2 border-oro-400 bg-notte-950/40 text-oro-300`}>
                {testoNumero(x)}
              </div>
            );
          }
          const v = scritti[i] ?? '';
          const stato =
            i === scelta
              ? 'border-solid border-oro-400 bg-notte-950/50 ring-2 ring-oro-400/40'
              : errore && v
                ? 'border-solid border-pericolo-400 bg-pericolo-400/10'
                : 'border-dashed border-panna-100/35 bg-notte-950/20';
          return (
            <button key={i} onClick={() => tocca(i)} disabled={locked} className={`${base} border-2 text-panna-50 ${stato}`}>
              {v.replace('-', '−')}
            </button>
          );
        })}
      </div>

      {!risolto && (
        <>
          <div className="flex gap-2">
            {round.negativi && (
              <button
                onClick={segno}
                disabled={locked || scelta < 0}
                aria-label="Cambia segno"
                className="titolo rounded-2xl bg-panna-50 px-5 text-2xl font-bold text-inchiostro shadow-[0_4px_0_rgb(21_19_46/0.2)] active:translate-y-1 disabled:opacity-40"
              >
                ±
              </button>
            )}
            <button
              onClick={prova}
              disabled={locked || !piena}
              className="titolo flex-1 rounded-2xl bg-oro-400 py-2.5 text-xl font-bold text-inchiostro shadow-[0_4px_0_var(--color-oro-600)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-oro-600)] disabled:bg-inchiostro/20 disabled:text-panna-50/55 disabled:shadow-none"
            >
              Controlla
            </button>
          </div>
          <Tastierino
            valore={valore}
            onCambia={scrivi}
            onInvia={avanti}
            disabilitato={locked || scelta < 0}
            maxCifre={valore.startsWith('-') ? 4 : 3}
          />
        </>
      )}
    </div>
  );
}

export const quadratoMagico: PuzzleGame<RoundQuadrato, Risposta> = {
  id: 'quadrato',
  mode: 'puzzle',
  title: 'Il Quadrato magico',
  hint: 'Righe, colonne e diagonali fanno la stessa somma: riempi le caselle vuote.',
  generate: genera,
  View: Vista,
  check: corretta,
  aiuti,
  soluzione,
};
