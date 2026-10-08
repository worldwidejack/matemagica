import { useEffect, useRef } from 'react';
import { suona } from '@/audio/sfx';
import { SCENE, type Disco } from '@/content/scene';
import { SENTIERO, TAPPE, TAPPE_TOTALI, nomeTappa, type Livello } from '@/content/sentiero';
import { rngConSeme } from '@/engine/caso';
import { GIOCHI } from '@/games/registro';
import { useProfilo } from '@/profilo/store';
import { Bottone, Icona, IconaGioco, Stelline } from './kit';
import { livelloAperto, livelloCorrente } from './progressi';
import { SfidaDelGiorno } from './SfidaDelGiorno';

/** Le tappe tra le stelle sono un po' più basse delle scene dipinte. */
const RAPPORTO_CIELO = 1.35;

/**
 * Oltre la torre ogni tappa è una costellazione: i 5 livelli sono le sue
 * stelle, in posizioni fisse per tappa (seme = numero della tappa).
 */
function cieloDi(n: number): { dischi: Disco[]; stelle: { x: number; y: number; r: number; brilla: boolean }[] } {
  const rng = rngConSeme(n * 7919);
  const lato = rng() < 0.5 ? 1 : -1;
  const dischi = Array.from({ length: 5 }, (_, k) => ({
    x: 0.5 + lato * (k % 2 === 0 ? -1 : 1) * (0.12 + rng() * 0.16),
    y: 0.86 - k * 0.165 + (rng() - 0.5) * 0.04,
    r: 0.085 - k * 0.004,
  }));
  const stelle = Array.from({ length: 70 }, () => ({ x: rng(), y: rng(), r: 0.6 + rng() * 1.6, brilla: rng() < 0.3 }));
  return { dischi, stelle };
}

/** Lucine che brillano nel cielo delle scene dipinte (solo nella parte alta). */
function lucineDi(n: number): { x: number; y: number; ritardo: number }[] {
  const rng = rngConSeme(n * 104729);
  return Array.from({ length: 9 }, () => ({ x: 0.05 + rng() * 0.9, y: 0.03 + rng() * 0.22, ritardo: rng() * 4 }));
}

function Costellazione({ n, dischi, stelle }: { n: number; dischi: Disco[]; stelle: ReturnType<typeof cieloDi>['stelle'] }) {
  const punti = dischi.map((d) => `${d.x * 100},${d.y * 100 * RAPPORTO_CIELO}`).join(' ');
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-notte-950 via-notte-900 to-notte-950">
      <svg viewBox={`0 0 100 ${100 * RAPPORTO_CIELO}`} className="absolute inset-0 h-full w-full" aria-hidden>
        {/* Nebbia di via lattea, diversa per ogni tappa. */}
        <ellipse
          cx={30 + (n % 5) * 10}
          cy={40 + (n % 3) * 20}
          rx="70"
          ry="18"
          transform={`rotate(${-30 + (n % 7) * 9} 50 67)`}
          fill="var(--color-notte-700)"
          opacity="0.35"
        />
        {stelle.map((s, i) => (
          <circle
            key={i}
            cx={s.x * 100}
            cy={s.y * 100 * RAPPORTO_CIELO}
            r={s.r * 0.18}
            fill={i % 7 === 0 ? 'var(--color-oro-300)' : 'var(--color-panna-50)'}
            className={s.brilla ? 'animate-brilla' : ''}
            style={s.brilla ? { animationDelay: `${(i % 9) * 0.45}s` } : undefined}
            opacity={0.85}
          />
        ))}
        <polyline points={punti} fill="none" stroke="var(--color-oro-300)" strokeWidth="0.35" strokeDasharray="1.2 1.4" opacity="0.6" />
      </svg>
    </div>
  );
}

/**
 * Il sentiero: si sale dal porto alla torre, dal basso verso l'alto. Ogni tappa
 * è una scena dipinta (src/content/scene.ts) e i livelli stanno esattamente
 * sopra i 5 dischi di pietra disegnati.
 */
export function Sentiero({
  onLivello,
  onSfida,
  onSalto,
}: {
  onLivello: (l: Livello) => void;
  onSfida: () => void;
  /** Test per saltare a una tappa chiusa. */
  onSalto: (tappa: number) => void;
}) {
  const stelle = useProfilo((p) => p.stelleLivelli);
  const corrente = livelloCorrente(stelle);
  const rifCorrente = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    rifCorrente.current?.scrollIntoView({ block: 'center' });
  }, []);

  // Si vedono le 8 tappe del paese e, oltre la torre, le costellazioni fino a una dopo quella raggiunta.
  const tappaCorrente = Math.floor(corrente / 5) + 1;
  const quanteTappe = Math.min(TAPPE_TOTALI, Math.max(TAPPE.length, tappaCorrente + 1));
  const tappe = Array.from({ length: quanteTappe }, (_, t) => ({
    nome: nomeTappa(t + 1),
    n: t + 1,
    livelli: SENTIERO.slice(t * 5, t * 5 + 5),
  }));
  const livelloAttuale = SENTIERO[corrente];

  return (
    <div className="pb-20">
      <div className="pointer-events-none fixed top-[calc(env(safe-area-inset-top)+3.9rem)] z-20 w-full max-w-md px-3">
        <div className="pointer-events-auto inline-block">
          <SfidaDelGiorno compatta onGioca={onSfida} />
        </div>
      </div>
      {/* In cima al viaggio: il titolo nel cielo, sopra la torre. */}
      <div className="cielo-stellato px-6 pt-10 pb-6 text-center">
        <h1 className="text-5xl font-semibold text-panna-50">Matemagica</h1>
        <p className="titolo mt-2 text-lg text-panna-100/80 italic">Piccole sfide, grandi viaggi nella mente</p>
        {quanteTappe < TAPPE_TOTALI && (
          <p className="mt-3 text-sm text-panna-100/55">Il sentiero continua tra le stelle, una costellazione dopo l'altra.</p>
        )}
      </div>

      {[...tappe].reverse().map((tappa) => {
        const scena = SCENE.find((s) => s.n === tappa.n);
        const cielo = scena ? null : cieloDi(tappa.n);
        const dischi = scena?.dischi ?? cielo?.dischi ?? [];
        const primo = tappa.livelli[0];
        const raggiunta = primo !== undefined && livelloAperto(primo.numero - 1, stelle);
        return (
          <section key={tappa.n} className="relative" aria-label={`Tappa ${tappa.n}: ${tappa.nome}`}>
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: `1 / ${scena?.rapporto ?? RAPPORTO_CIELO}` }}>
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
                cielo && (
                  <div className={raggiunta ? '' : 'opacity-60'}>
                    <Costellazione n={tappa.n} dischi={cielo.dischi} stelle={cielo.stelle} />
                  </div>
                )
              )}
              {scena && raggiunta && (
                <div className="pointer-events-none absolute inset-0" aria-hidden>
                  {lucineDi(tappa.n).map((l, i) => (
                    <span
                      key={i}
                      className="animate-brilla absolute h-1 w-1 rounded-full bg-panna-50 shadow-[0_0_6px_2px_var(--color-oro-300)]"
                      style={{ left: `${l.x * 100}%`, top: `${l.y * 100}%`, animationDelay: `${l.ritardo}s` }}
                    />
                  ))}
                </div>
              )}

              {/* Sfumature nel blu della notte: le scene si fondono una nell'altra. */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-notte-900/80 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-notte-900/80 to-transparent" />
              <div className="absolute top-3 left-3 rounded-full bg-panna-100/95 px-3.5 py-1 text-sm text-inchiostro shadow">
                <span className="font-bold">Tappa {tappa.n}</span> · <span className="titolo italic">{tappa.nome}</span>
                {tappa.n > TAPPE.length && <span className="ml-1">✦</span>}
              </div>
              {!raggiunta && (
                <div className="absolute inset-x-0 top-1/3 flex flex-col items-center gap-2">
                  <p className="titolo rounded-2xl bg-notte-950/70 px-4 py-2 text-center text-panna-100 backdrop-blur-sm">
                    Si apre finendo la tappa {tappa.n - 1}
                  </p>
                  {/* Solo la prima tappa chiusa si può saltare: niente salti nel vuoto. */}
                  {tappa.n === tappaCorrente + 1 && (
                    <button
                      onClick={() => {
                        suona('tap');
                        onSalto(tappa.n);
                      }}
                      className="rounded-full bg-panna-100/90 px-4 py-1.5 text-sm font-bold text-inchiostro shadow active:scale-95"
                    >
                      Sei già bravo? Salta qui con un test
                    </button>
                  )}
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
                    className={`absolute -translate-x-1/2 -translate-y-1/2 ${eCorrente ? 'z-10' : ''}`}
                    style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%`, width: `${d.r * 200 * 1.08}%` }}
                  >
                    {eCorrente && (
                      <div className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 animate-[galleggia_2s_ease-in-out_infinite] whitespace-nowrap rounded-xl bg-panna-50 px-3 py-1 text-center text-inchiostro shadow-lg">
                        <span className="flex items-center gap-2">
                          <IconaGioco gioco={l.gioco} className="h-8 w-8" />
                          <span className="text-left">
                            <span className="titolo block text-base leading-tight font-semibold">Gioca!</span>
                            <span className="block text-[11px] text-inchiostro-chiaro">{GIOCHI[l.gioco].titolo}</span>
                          </span>
                        </span>
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
                        // Tra le stelle i dischi sono stelle: un alone d'oro li fa vedere sul blu.
                        cielo && !fatto && !eCorrente ? 'shadow-[0_0_0_1.5px_var(--color-oro-300),0_0_18px_var(--color-oro-300)]' : '',
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
