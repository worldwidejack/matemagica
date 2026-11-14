import { suona } from '@/audio/sfx';
import { titoloTappa } from '@/content/luoghi';
import { STORIE } from '@/content/storie';
import { useProfilo } from '@/profilo/store';
import { Icona } from './kit';
import { livelloDiStoria } from './progressi';

/** Le carte: una per ogni storia sbloccata lungo il sentiero. */
export function Collezione({ onCarta }: { onCarta: (id: string) => void }) {
  const carte = useProfilo((p) => p.carte);
  return (
    <div className="animate-entra mx-auto max-w-md px-4 pt-4 pb-[calc(var(--barra)+1.5rem)]">
      <h2 className="text-4xl font-bold">Collezione</h2>
      <p className="mt-1 font-semibold text-inchiostro-chiaro">
        {carte.length} di {STORIE.length} carte · ogni storia si vince lungo il viaggio
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
                    ? 'ombra-dura bg-panna-50 text-inchiostro active:translate-y-1 active:shadow-none'
                    : 'bg-inchiostro/6 text-inchiostro/40',
                ].join(' ')}
              >
                <span className={presa ? 'text-5xl' : ''}>{presa ? s.emoji : <Icona nome="lucchetto" className="h-8 w-8" />}</span>
                <span className={`titolo text-base leading-tight font-bold ${presa ? '' : 'text-sm'}`}>
                  {presa ? s.carta : titoloTappa(Math.ceil((livelloDiStoria(s.id)?.numero ?? 5) / 5))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
