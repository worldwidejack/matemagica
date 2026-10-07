import { suona } from '@/audio/sfx';
import type { GameId } from '@/engine/cartuccia';
import { GIOCHI, ORDINE_GIOCHI } from '@/games/registro';
import { useProfilo } from '@/profilo/store';
import { giocoSbloccato, primoLivelloDi } from './progressi';

/** Un gioco solo, a oltranza: per chi preferisce allenare un argomento. */
export function Palestra({ onGioca }: { onGioca: (g: GameId) => void }) {
  const stelle = useProfilo((p) => p.stelleLivelli);
  const bravura = useProfilo((p) => p.bravura);
  const record = useProfilo((p) => p.record);

  return (
    <div className="px-4 pb-28">
      <h2 className="mt-2 text-2xl font-black">Palestra</h2>
      <p className="mt-1 text-white/60">Scegli un gioco e allenati quanto vuoi. Il livello si adatta a te.</p>
      <ul className="mt-5 flex flex-col gap-3">
        {ORDINE_GIOCHI.map((g) => {
          const v = GIOCHI[g];
          const aperto = giocoSbloccato(g, stelle);
          const b = bravura[g] ?? 0;
          return (
            <li key={g}>
              <button
                disabled={!aperto}
                onClick={() => {
                  suona('tap');
                  onGioca(g);
                }}
                className={[
                  'flex w-full items-center gap-4 rounded-3xl px-5 py-4 text-left transition-transform',
                  aperto ? 'bg-notte-700 active:scale-95' : 'bg-notte-800 text-white/35',
                ].join(' ')}
              >
                <span className="text-3xl">{aperto ? v.icona : '🔒'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold">{v.titolo}</span>
                  {aperto ? (
                    <>
                      <span className="text-sm text-white/50">
                        {v.tipo === 'arcade' ? 'Arcade' : 'Rompicapo'}
                        {(record[g] ?? 0) > 0 ? ` · record ${record[g]}` : ''}
                      </span>
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-notte-600">
                        <span className="block h-full rounded-full bg-turchese-400" style={{ width: `${b * 10}%` }} />
                      </span>
                    </>
                  ) : (
                    <span className="text-sm">Lo incontri al livello {primoLivelloDi(g)?.numero} del sentiero</span>
                  )}
                </span>
                {aperto && <span className="text-sm font-bold text-turchese-300 tabular-nums">{b.toFixed(1)}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
