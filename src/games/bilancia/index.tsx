import { useState } from 'react';
import type { PuzzleGame, PuzzleViewProps } from '@/engine/cartuccia';
import { Display, Tastierino } from '../_comune/Tastierino';
import { FORME, aiuti, genera, soluzione, type Bilancia, type Piatto, type RoundBilancia } from './logica';

function PiattoVista({ piatto }: { piatto: Piatto }) {
  const pezzi = piatto.forme.flatMap((n, i) => Array.from({ length: n }, (_, k) => ({ k: `${i}-${k}`, f: FORME[i] })));
  return (
    <div className="flex min-h-16 flex-1 flex-wrap items-end justify-center gap-1.5 rounded-b-[2rem] border-b-4 border-turchese-400/70 bg-notte-700/60 px-2 pt-2 pb-1.5">
      {pezzi.map((p) => (
        <span key={p.k} className="text-[1.9rem] leading-none">
          {p.f}
        </span>
      ))}
      {piatto.peso > 0 && (
        <span className="rounded-lg bg-oro-500 px-2.5 py-1 text-xl font-black text-notte-900 tabular-nums">{piatto.peso}</span>
      )}
    </div>
  );
}

function BilanciaVista({ b }: { b: Bilancia }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full items-end gap-3">
        <PiattoVista piatto={b.sinistra} />
        <PiattoVista piatto={b.destra} />
      </div>
      <div className="h-1.5 w-11/12 rounded-full bg-turchese-400/70" />
      <div className="h-0 w-0 border-x-[16px] border-b-[22px] border-x-transparent border-b-turchese-400/70" />
    </div>
  );
}

function Vista({ round, onTry, locked, risolto }: PuzzleViewProps<RoundBilancia, number>) {
  const [risposta, setRisposta] = useState('');
  const forma = FORME[round.chiesta];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-white/55">Tutte le bilance sono in equilibrio.</p>
      <div className="flex flex-col gap-1.5">
        {round.bilance.map((b, i) => (
          <BilanciaVista key={i} b={b} />
        ))}
      </div>
      <p className="text-center text-2xl">
        Quanto pesa <span className="text-3xl">{forma}</span>?
      </p>
      <Display valore={risolto ? String(round.pesi[round.chiesta]) : risposta} />
      {!risolto && (
        <Tastierino
          valore={risposta}
          onCambia={setRisposta}
          disabilitato={locked}
          maxCifre={3}
          onInvia={() => {
            const n = Number(risposta);
            setRisposta('');
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
