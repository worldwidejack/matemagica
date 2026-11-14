import { suona } from '@/audio/sfx';
import { luogoDellaTappa, titoloTappa } from '@/content/luoghi';
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
          const tappa = Math.ceil((livelloDiStoria(s.id)?.numero ?? 5) / 5);
          const colore = luogoDellaTappa(tappa).tinta;
          return (
            <li key={s.id}>
              <button
                disabled={!presa}
                onClick={() => {
                  suona('tap');
                  onCarta(s.id);
                }}
                style={presa ? undefined : { backgroundColor: `color-mix(in oklab, ${colore} 16%, var(--color-carta))`, color: colore }}
                className={[
                  'flex aspect-[3/4] w-full flex-col overflow-hidden rounded-3xl text-center transition-transform',
                  presa ? 'ombra-dura bg-panna-50 text-inchiostro active:translate-y-1 active:shadow-none' : 'items-center justify-center gap-3 p-3',
                ].join(' ')}
              >
                {presa ? (
                  <>
                    <img src={`/carte/${s.id}.webp`} alt="" width={640} height={640} draggable={false} className="aspect-square w-full object-cover" />
                    <span className="titolo flex flex-1 items-center justify-center px-2 text-base leading-tight font-bold">{s.carta}</span>
                  </>
                ) : (
                  <>
                    <Icona nome="lucchetto" className="h-8 w-8" />
                    <span className="titolo text-sm leading-tight font-bold">{titoloTappa(tappa)}</span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
