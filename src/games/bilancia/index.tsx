import { useState } from 'react';
import type { PuzzleGame, PuzzleViewProps } from '@/engine/cartuccia';
import { suona } from '@/audio/sfx';
import { Display, Tastierino } from '../_comune/Tastierino';
import { FORME, aiuti, genera, scriviNumero, soluzione, type Bilancia, type Piatto, type RoundBilancia } from './logica';

/**
 * `compatta`: con tre bilance e piatti pieni la schermata sforava i 375×812
 * (fino a ~60 px, in più di un rompicapo su quattro da d 8): forme e piatti più bassi.
 */
function PiattoVista({ piatto, compatta }: { piatto: Piatto; compatta: boolean }) {
  const pezzi = piatto.forme.flatMap((n, i) => Array.from({ length: n }, (_, k) => ({ k: `${i}-${k}`, f: FORME[i] })));
  return (
    <div
      className={[
        'flex flex-1 flex-wrap items-end justify-center rounded-b-[2rem] border-b-4 border-panna-200 bg-panna-100/90 px-2 pt-2 pb-1.5',
        compatta ? 'min-h-13 gap-1' : 'min-h-16 gap-1.5',
      ].join(' ')}
    >
      {pezzi.map((p) => (
        <span key={p.k} className={`${compatta ? 'text-[1.55rem]' : 'text-[1.9rem]'} leading-none`}>
          {p.f}
        </span>
      ))}
      {piatto.peso > 0 && (
        <span className="rounded-lg bg-oro-500 px-2.5 py-1 text-xl font-black text-inchiostro tabular-nums">{piatto.peso}</span>
      )}
    </div>
  );
}

function BilanciaVista({ b, compatta }: { b: Bilancia; compatta: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full items-end gap-3">
        <PiattoVista piatto={b.sinistra} compatta={compatta} />
        <PiattoVista piatto={b.destra} compatta={compatta} />
      </div>
      <div className="h-1.5 w-11/12 rounded-full bg-panna-200" />
      <div
        className={`h-0 w-0 border-x-transparent border-b-panna-200 ${compatta ? 'border-x-[12px] border-b-[15px]' : 'border-x-[16px] border-b-[22px]'}`}
      />
    </div>
  );
}

function Vista({ round, onTry, locked, risolto }: PuzzleViewProps<RoundBilancia, number>) {
  const [risposta, setRisposta] = useState('');
  // Da d 7 una forma può pesare meno di zero: la risposta può avere il meno.
  const [meno, setMeno] = useState(false);
  const forma = FORME[round.chiesta];
  const scritta = risolto ? scriviNumero(round.pesi[round.chiesta] ?? 0) : (meno ? '−' : '') + risposta;
  const compatta = round.bilance.length >= 3;
  const conSegno = round.sottoZero && !risolto;

  return (
    <div className={`flex flex-col ${compatta ? 'gap-2' : 'gap-3'}`}>
      {round.sottoZero ? (
        <p className="text-center text-sm text-panna-100/80">
          🎈 Qui una forma può pesare <b className="font-black text-oro-400">meno di zero</b>: tira su.
        </p>
      ) : (
        <p className="text-center text-sm text-panna-100/70">Tutte le bilance sono in equilibrio.</p>
      )}
      <div className={`flex flex-col ${compatta ? 'gap-1' : 'gap-1.5'}`}>
        {round.bilance.map((b, i) => (
          <BilanciaVista key={i} b={b} compatta={compatta} />
        ))}
      </div>
      <p className="text-center text-2xl">
        Quanto pesa <span className="text-3xl">{forma}</span>?
      </p>
      <div className="flex items-center justify-center gap-2">
        {conSegno && (
          <button
            onClick={() => {
              suona('tap');
              setMeno((m) => !m);
            }}
            disabled={locked}
            aria-label="Cambia segno"
            aria-pressed={meno}
            className={[
              'h-14 w-14 rounded-2xl text-3xl font-black active:scale-95 disabled:opacity-40',
              meno ? 'bg-oro-400 text-inchiostro' : 'bg-panna-100 text-inchiostro',
            ].join(' ')}
          >
            ±
          </button>
        )}
        <Display valore={scritta} />
        {/* Contrappeso invisibile al tasto ±: il display resta al centro. */}
        {conSegno && <span className="w-14" aria-hidden />}
      </div>
      {!risolto && (
        <Tastierino
          valore={risposta}
          onCambia={setRisposta}
          disabilitato={locked}
          maxCifre={3}
          onInvia={() => {
            const n = (meno ? -1 : 1) * Number(risposta);
            setRisposta('');
            setMeno(false);
            onTry(n);
          }}
        />
      )}
    </div>
  );
}

export const laBilancia: PuzzleGame<RoundBilancia, number> = {
  id: 'bilancia',
  mode: 'puzzle',
  title: 'La Bilancia',
  hint: 'Le bilance sono in equilibrio: scopri quanto pesa la forma misteriosa.',
  generate: genera,
  View: Vista,
  check: (r, n) => n === r.pesi[r.chiesta],
  aiuti,
  soluzione,
};
