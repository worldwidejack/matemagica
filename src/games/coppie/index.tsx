import { useState } from 'react';
import type { ArcadeGame, ArcadeViewProps } from '@/engine/cartuccia';
import { formano, genera, tempo, type RoundCoppie } from './logica';

type Fatto = 'fatto';

function Vista({ round, onHit, onMiss, onAnswer, locked, correct }: ArcadeViewProps<RoundCoppie, Fatto>) {
  const [scelta, setScelta] = useState<number | null>(null);
  const [tolte, setTolte] = useState<Set<number>>(() => new Set());
  const [sbagliate, setSbagliate] = useState<{ ids: [number, number]; k: number } | null>(null);

  const tocca = (id: number) => {
    if (locked || tolte.has(id)) return;
    if (scelta === null) return setScelta(id);
    if (scelta === id) return setScelta(null);
    const a = round.celle.find((c) => c.id === scelta);
    const b = round.celle.find((c) => c.id === id);
    if (!a || !b) return;
    if (formano(round, a.n, b.n)) {
      const nuove = new Set(tolte).add(a.id).add(b.id);
      setTolte(nuove);
      setScelta(null);
      if (nuove.size >= round.coppie * 2) onAnswer('fatto');
      else onHit();
    } else {
      const k = (sbagliate?.k ?? 0) + 1;
      setSbagliate({ ids: [a.id, b.id], k });
      setScelta(null);
      onMiss();
      // Il rosso dura un attimo: quei numeri possono ancora andare con altri.
      window.setTimeout(() => setSbagliate((s) => (s?.k === k ? null : s)), 600);
    }
  };

  const colonne = round.celle.length > 9 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className="flex flex-col gap-5">
      <p className="text-center text-xl">
        {round.tipo === 'somma' ? (
          <>
            Tocca due numeri che <b className="text-oro-400">sommati</b> fanno{' '}
            <span className="text-3xl font-black text-oro-400">{round.obiettivo}</span>
          </>
        ) : (
          <>
            Tocca due numeri che <b className="text-oro-400">moltiplicati</b> fanno{' '}
            <span className="text-3xl font-black text-oro-400">{round.obiettivo}</span>
          </>
        )}
      </p>
      <div className={`grid ${colonne} gap-2.5`}>
        {round.celle.map((c) => {
          const via = tolte.has(c.id);
          const errore = sbagliate?.ids.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => tocca(c.id)}
              disabled={locked || via}
              className={[
                'aspect-square rounded-2xl text-[clamp(1.4rem,7vw,2.2rem)] font-bold tabular-nums transition-all duration-200',
                via ? 'scale-50 opacity-0' : 'active:scale-90',
                scelta === c.id
                  ? 'scale-105 bg-oro-400 text-inchiostro shadow-[0_0_20px_var(--color-oro-400)]'
                  : errore
                    ? 'bg-pericolo-400 text-panna-50'
                    : 'bg-panna-100 text-inchiostro shadow-[0_3px_0_var(--color-panna-200)]',
                correct === false && !via ? 'opacity-50' : '',
              ].join(' ')}
            >
              {c.n}
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-panna-100/50">
        {(round.coppie * 2 - tolte.size) / 2} coppie da trovare · attento ai numeri senza compagno
      </p>
    </div>
  );
}

export const coppieMagiche: ArcadeGame<RoundCoppie, Fatto> = {
  id: 'coppie',
  mode: 'arcade',
  title: 'Coppie magiche',
  hint: 'Trova le coppie che fanno il numero magico. Occhio: alcuni numeri non hanno compagno.',
  generate: genera,
  View: Vista,
  check: () => true,
  timeFor: (r, d) => tempo(r, d),
  roundPerPartita: 5,
};
