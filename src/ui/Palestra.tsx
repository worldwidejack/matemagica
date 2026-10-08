import { suona } from '@/audio/sfx';
import type { GameId } from '@/engine/cartuccia';
import { GIOCHI, ORDINE_GIOCHI } from '@/games/registro';
import { useProfilo } from '@/profilo/store';
import { Icona } from './kit';
import { giocoSbloccato, primoLivelloDi } from './progressi';

/** Un gioco solo, a oltranza: per chi preferisce allenare un argomento. */
export function Palestra({ onGioca }: { onGioca: (g: GameId) => void }) {
  const stelle = useProfilo((p) => p.stelleLivelli);
  const bravura = useProfilo((p) => p.bravura);
  const record = useProfilo((p) => p.record);

  return (
    <div className="cielo-stellato min-h-full px-4 pt-4 pb-28">
      <h2 className="text-4xl font-semibold text-panna-50">Palestra</h2>
      <p className="mt-1 text-panna-100/75">Un gioco solo, quanto vuoi. Il livello si adatta a te.</p>
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
                  'flex w-full items-center gap-4 rounded-3xl px-4 py-3.5 text-left transition-transform',
                  aperto
                    ? 'bg-panna-100 text-inchiostro shadow-[0_5px_0_var(--color-panna-200),0_8px_20px_rgb(0_0_0/0.2)] active:translate-y-1 active:shadow-none'
                    : 'bg-panna-100/10 text-panna-100/50',
                ].join(' ')}
              >
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${aperto ? 'bg-azzurro' : 'bg-panna-100/10'}`}
                >
                  {aperto ? v.icona : <Icona nome="lucchetto" className="h-6 w-6" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="titolo block text-xl font-semibold">{v.titolo}</span>
                  {aperto ? (
                    <>
                      <span className="text-sm text-inchiostro-chiaro">
                        {v.tipo === 'arcade' ? 'Arcade' : 'Rompicapo'}
                        {(record[g] ?? 0) > 0 ? ` · record ${record[g]}` : ''}
                      </span>
                      <span className="mt-2 block h-2 overflow-hidden rounded-full bg-panna-200">
                        <span className="block h-full rounded-full bg-oro-500" style={{ width: `${b * 10}%` }} />
                      </span>
                    </>
                  ) : (
                    <span className="text-sm">Lo incontri al livello {primoLivelloDi(g)?.numero} del sentiero</span>
                  )}
                </span>
                {aperto && <span className="titolo text-lg font-semibold tabular-nums">{b.toFixed(1)}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
