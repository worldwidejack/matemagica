import { useState } from 'react';
import type { PuzzleGame, PuzzleViewProps } from '@/engine/cartuccia';
import { Display, Tastierino } from '../_comune/Tastierino';
import { aiuti, genera, soluzione, type RoundRegola } from './logica';

function Vista({ round, onTry, locked, risolto }: PuzzleViewProps<RoundRegola, number>) {
  const [risposta, setRisposta] = useState('');
  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-white/60">Qual è il prossimo numero?</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {round.termini.map((t, i) => (
          <span key={i} className="rounded-2xl bg-notte-700 px-3.5 py-3 text-2xl font-bold tabular-nums">
            {t}
          </span>
        ))}
        <span
          className={`rounded-2xl border-2 px-3.5 py-3 text-2xl font-bold tabular-nums ${
            risolto ? 'animate-pop border-oro-400 text-oro-400' : 'border-dashed border-oro-500/60 text-oro-400/60'
          }`}
        >
          {risolto ? round.risposta : '?'}
        </span>
      </div>
      {!risolto && (
        <>
          <Display valore={risposta} />
          <Tastierino
            valore={risposta}
            onCambia={setRisposta}
            disabilitato={locked}
            onInvia={() => {
              const n = Number(risposta);
              setRisposta('');
              onTry(n);
            }}
          />
        </>
      )}
    </div>
  );
}

export const trovaLaRegola: PuzzleGame<RoundRegola, number> = {
  id: 'regola',
  mode: 'puzzle',
  title: 'Trova la regola',
  hint: 'Ogni sequenza nasconde una regola. Scoprila e scrivi il numero che viene dopo.',
  generate: genera,
  View: Vista,
  check: (r, n) => n === r.risposta,
  aiuti,
  soluzione,
};
