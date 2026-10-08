import { suona } from '@/audio/sfx';
import { STORIE } from '@/content/storie';
import { useProfilo } from '@/profilo/store';
import { Icona } from './kit';
import { livelloDiStoria } from './progressi';

/** Le carte: una per ogni storia sbloccata lungo il sentiero. */
export function Collezione({ onCarta }: { onCarta: (id: string) => void }) {
  const carte = useProfilo((p) => p.carte);
  return (
    <div className="cielo-stellato min-h-full px-4 pt-4 pb-28">
      <h2 className="text-4xl font-semibold text-panna-50">Collezione</h2>
      <p className="mt-1 text-panna-100/75">
        {carte.length} di {STORIE.length} carte · ogni storia si vince lungo il sentiero
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
                  'flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-3xl p-3 text-center transition-transform',
                  presa
                    ? 'border-4 border-panna-50 bg-panna-100 text-inchiostro shadow-[0_8px_20px_rgb(0_0_0/0.3)] outline-2 outline-oro-500 active:scale-95'
                    : 'border-2 border-dashed border-panna-100/25 text-panna-100/45',
                ].join(' ')}
              >
                <span className={presa ? 'text-5xl' : ''}>{presa ? s.emoji : <Icona nome="lucchetto" className="h-8 w-8" />}</span>
                <span className={`titolo text-base font-semibold ${presa ? '' : 'text-sm'}`}>
                  {presa ? s.carta : `Tappa ${Math.ceil((livelloDiStoria(s.id)?.numero ?? 5) / 5)}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
