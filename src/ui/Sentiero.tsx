import { useEffect, useRef } from 'react';
import { suona } from '@/audio/sfx';
import { SCENE, type Disco } from '@/content/scene';
import { SENTIERO, TAPPE, type Livello } from '@/content/sentiero';
import { GIOCHI } from '@/games/registro';
import { useProfilo } from '@/profilo/store';
import { Bottone, Icona, Stelline } from './kit';
import { livelloAperto, livelloCorrente } from './progressi';

/** Dischi di ripiego per le tappe senza illustrazione: zig-zag sul cielo stellato. */
const DISCHI_RIPIEGO: Disco[] = [
  { x: 0.5, y: 0.86, r: 0.075 },
  { x: 0.72, y: 0.69, r: 0.07 },
  { x: 0.42, y: 0.52, r: 0.065 },
  { x: 0.66, y: 0.35, r: 0.06 },
  { x: 0.48, y: 0.18, r: 0.055 },
];

/**
 * Il sentiero: si sale dal porto alla torre, dal basso verso l'alto. Ogni tappa
 * è una scena dipinta (src/content/scene.ts) e i livelli stanno esattamente
 * sopra i 5 dischi di pietra disegnati.
 */
export function Sentiero({ onLivello }: { onLivello: (l: Livello) => void }) {
  const stelle = useProfilo((p) => p.stelleLivelli);
  const corrente = livelloCorrente(stelle);
  const rifCorrente = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    rifCorrente.current?.scrollIntoView({ block: 'center' });
  }, []);

  const tappe = TAPPE.map((nome, t) => ({ nome, n: t + 1, livelli: SENTIERO.slice(t * 5, t * 5 + 5) }));
  const livelloAttuale = SENTIERO[corrente];

  return (
    <div className="pb-20">
      {/* In cima al viaggio: il titolo nel cielo, sopra la torre. */}
      <div className="cielo-stellato px-6 pt-10 pb-6 text-center">
        <h1 className="text-5xl font-semibold text-panna-50">Matemagica</h1>
        <p className="titolo mt-2 text-lg text-panna-100/80 italic">Piccole sfide, grandi viaggi nella mente</p>
      </div>

      {[...tappe].reverse().map((tappa) => {
        const scena = SCENE.find((s) => s.n === tappa.n);
        const dischi = scena?.dischi ?? DISCHI_RIPIEGO;
        const primo = tappa.livelli[0];
        const raggiunta = primo !== undefined && livelloAperto(primo.numero - 1, stelle);
        return (
          <section key={tappa.n} className="relative" aria-label={`Tappa ${tappa.n}: ${tappa.nome}`}>
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: `1 / ${scena?.rapporto ?? 1.4}` }}>
              {scena ? (
                <img
                  src={scena.file}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-cover transition-[filter] duration-700 ${
                    raggiunta ? '' : 'brightness-[0.55] saturate-[0.45]'
                  }`}
                />
              ) : (
                <div className={`cielo-stellato absolute inset-0 ${raggiunta ? '' : 'opacity-60'}`} />
              )}

              {/* Sfumature nel blu della notte: le scene si fondono una nell'altra. */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-notte-900/80 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-notte-900/80 to-transparent" />
              <div className="absolute top-3 left-3 rounded-full bg-panna-100/95 px-3.5 py-1 text-sm text-inchiostro shadow">
                <span className="font-bold">Tappa {tappa.n}</span> · <span className="titolo italic">{tappa.nome}</span>
              </div>
              {!raggiunta && (
                <div className="absolute inset-x-0 top-1/3 flex justify-center">
                  <p className="titolo rounded-2xl bg-notte-950/70 px-4 py-2 text-center text-panna-100 backdrop-blur-sm">
                    Si apre finendo la tappa {tappa.n - 1}
                  </p>
                </div>
              )}

              {tappa.livelli.map((l, k) => {
                const d = dischi[k];
                if (!d) return null;
                const i = l.numero - 1;
                const aperto = livelloAperto(i, stelle);
                const s = stelle[l.id] ?? 0;
                const eCorrente = i === corrente;
                const fatto = s > 0;
                return (
                  <div
                    key={l.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%`, width: `${d.r * 200 * 1.08}%` }}
                  >
                    {eCorrente && (
                      <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 animate-[galleggia_2s_ease-in-out_infinite] whitespace-nowrap rounded-xl bg-panna-50 px-3 py-1 text-center text-inchiostro shadow-lg">
                        <span className="titolo text-base font-semibold">Gioca!</span>
                        <span className="block text-[11px] text-inchiostro-chiaro">{GIOCHI[l.gioco].titolo}</span>
                        <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-panna-50" />
                      </div>
                    )}
                    <button
                      ref={eCorrente ? rifCorrente : undefined}
                      disabled={!aperto}
                      onClick={() => {
                        suona('tap');
                        onLivello(l);
                      }}
                      aria-label={`Livello ${l.numero}: ${GIOCHI[l.gioco].titolo}${aperto ? '' : ', chiuso'}`}
                      className={[
                        'titolo relative flex aspect-[2.3/1] w-full items-center justify-center rounded-[50%] text-[clamp(1rem,4.5vw,1.5rem)] font-semibold transition-transform active:scale-90',
                        eCorrente
                          ? 'animate-respiro bg-oro-400/95 text-inchiostro shadow-[0_0_0_3px_var(--color-oro-600),0_0_28px_var(--color-oro-400)]'
                          : fatto
                            ? 'bg-oro-400/85 text-inchiostro shadow-[0_0_0_2px_var(--color-oro-600)]'
                            : aperto
                              ? 'bg-panna-100/80 text-inchiostro'
                              : 'bg-notte-950/35 text-panna-100/80',
                      ].join(' ')}
                    >
                      {aperto ? l.numero : <Icona nome="lucchetto" className="h-[45%] w-[45%]" />}
                    </button>
                    {fatto && (
                      <div className="mt-0.5 flex justify-center text-[clamp(0.7rem,3vw,1rem)] drop-shadow">
                        <Stelline n={s} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Il grande pulsante, come nel riferimento: riprende dal livello a cui sei arrivato. */}
      {livelloAttuale && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-6">
          <Bottone freccia className="pointer-events-auto w-full max-w-xs" onClick={() => onLivello(livelloAttuale)}>
            Continua
          </Bottone>
        </div>
      )}
    </div>
  );
}
