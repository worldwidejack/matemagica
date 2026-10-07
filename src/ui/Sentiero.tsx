import { useEffect, useRef } from 'react';
import { suona } from '@/audio/sfx';
import { SENTIERO, type Livello } from '@/content/sentiero';
import { GIOCHI } from '@/games/registro';
import { useProfilo } from '@/profilo/store';
import { livelloAperto, livelloCorrente } from './progressi';

/** Spostamento orizzontale dei nodi: il sentiero serpeggia, come su Duolingo. */
const ONDA = [0, 38, 58, 38, 0, -38, -58, -38];

export function Sentiero({ onLivello }: { onLivello: (l: Livello) => void }) {
  const stelle = useProfilo((p) => p.stelleLivelli);
  const corrente = livelloCorrente(stelle);
  const rifCorrente = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    rifCorrente.current?.scrollIntoView({ block: 'center' });
  }, []);

  const completati = SENTIERO.filter((l) => (stelle[l.id] ?? 0) > 0).length;

  return (
    <div className="px-4 pb-28">
      <p className="mt-2 text-center text-sm text-white/50">
        {completati} / {SENTIERO.length} livelli · {Object.values(stelle).reduce<number>((s, n) => s + n, 0)} ★
      </p>
      <ol className="mt-4 flex flex-col items-center">
        {SENTIERO.map((l, i) => {
          const aperto = livelloAperto(i, stelle);
          const s = stelle[l.id] ?? 0;
          const eCorrente = i === corrente;
          const voce = GIOCHI[l.gioco];
          return (
            <li key={l.id} className="flex flex-col items-center">
              {i % 5 === 0 && (
                <p className="mt-6 mb-4 rounded-full bg-notte-700 px-4 py-1 text-xs font-bold tracking-widest text-white/60 uppercase">
                  Tappa {l.tappa}
                </p>
              )}
              <div className="flex flex-col items-center py-2" style={{ transform: `translateX(${ONDA[i % ONDA.length]}px)` }}>
                <button
                  ref={eCorrente ? rifCorrente : undefined}
                  disabled={!aperto}
                  onClick={() => {
                    suona('tap');
                    onLivello(l);
                  }}
                  aria-label={`Livello ${l.numero}: ${voce.titolo}${aperto ? '' : ', chiuso'}`}
                  className={[
                    'relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full text-3xl transition-transform active:scale-90',
                    !aperto
                      ? 'bg-notte-800 text-white/25'
                      : eCorrente
                        ? 'animate-respiro bg-oro-500 shadow-[0_0_30px_var(--color-oro-500)]'
                        : s > 0
                          ? 'bg-turchese-500/80'
                          : 'bg-notte-600',
                  ].join(' ')}
                >
                  {aperto ? voce.icona : '🔒'}
                  {l.storia && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-magenta-400 px-1.5 text-sm" aria-label="Storia in premio">
                      📜
                    </span>
                  )}
                </button>
                <div className="mt-1 h-4 text-sm tracking-tighter">
                  {aperto &&
                    [1, 2, 3].map((k) => (
                      <span key={k} className={k <= s ? 'text-oro-400' : 'text-white/15'}>
                        ★
                      </span>
                    ))}
                </div>
                <p className={`text-xs ${eCorrente ? 'font-bold text-oro-400' : 'text-white/45'}`}>
                  {eCorrente ? 'Gioca!' : `${l.numero} · ${voce.titolo}`}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-8 text-center text-white/40">Altri sentieri in arrivo…</p>
    </div>
  );
}
