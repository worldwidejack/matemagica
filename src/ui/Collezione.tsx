import { suona } from '@/audio/sfx';
import { STORIE } from '@/content/storie';
import { useProfilo } from '@/profilo/store';
import { livelloDiStoria } from './progressi';

/** Le carte: una per ogni storia sbloccata lungo il sentiero. */
export function Collezione({ onCarta }: { onCarta: (id: string) => void }) {
  const carte = useProfilo((p) => p.carte);
  return (
    <div className="px-4 pb-28">
      <h2 className="mt-2 text-2xl font-black">Collezione</h2>
      <p className="mt-1 text-white/60">
        {carte.length} / {STORIE.length} carte · ogni storia si sblocca lungo il sentiero
      </p>
      <ul className="mt-5 grid grid-cols-2 gap-3">
        {STORIE.map((s) => {
          const presa = carte.includes(s.id);
          return (
            <li key={s.id}>
              <button
                disabled={!presa}
                onClick={() => {
                  suona('tap');
                  onCarta(s.id);
                }}
                className={[
                  'flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 p-3 text-center transition-transform',
                  presa
                    ? 'border-oro-500/70 bg-gradient-to-b from-notte-600 to-notte-800 shadow-[0_0_18px_rgb(245_183_49/0.2)] active:scale-95'
                    : 'border-notte-700 bg-notte-800',
                ].join(' ')}
              >
                <span className={`text-5xl ${presa ? '' : 'opacity-20 grayscale'}`}>{presa ? s.emoji : '?'}</span>
                <span className={`text-sm font-bold ${presa ? 'text-oro-400' : 'text-white/30'}`}>
                  {presa ? s.carta : `Livello ${livelloDiStoria(s.id)?.numero ?? '?'}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
