import { useRef, useState, type PointerEvent as PE } from 'react';
import type { ArcadeGame, ArcadeViewProps } from '@/engine/cartuccia';
import { menoMovimento } from '@/anim/orologio';
import { suona } from '@/audio/sfx';
import { genera, rivelazione, testoPasso, type RoundCatena } from './logica';
import './stile.css';

type Punto = { x: number; y: number };
/** Un anello preso col dito: dove stava (home), dov'è il gancio, quanto si è mosso il dito. */
type Presa = { i: number; v: number; pid: number; ox: number; oy: number; home: Punto; hook: Punto; dx: number; dy: number };
type Agganciato = { v: number; dx: number; dy: number };

/** Da quanti px dal gancio l'anello comincia a esserne attratto. */
const RAGGIO = 100;
/** Entro quanti px (centro anello, centro gancio) il rilascio aggancia. */
const ACCETTA = 62;
/** Quanto si rimpicciolisce l'anello quando è sul gancio: fa parte della catena. */
const SCALA_AGGANCIO = 0.66;

/**
 * La calamita: vale per tutti gli anelli allo stesso modo, conta solo la distanza dal
 * gancio, mai se la risposta è giusta. Più sei vicino, più l'anello viene tirato.
 */
function posizione(p: Presa): { dx: number; dy: number; f: number; vicino: boolean } {
  const cx = p.home.x + p.dx;
  const cy = p.home.y + p.dy;
  const d = Math.hypot(p.hook.x - cx, p.hook.y - cy);
  const t = d < RAGGIO ? 1 - d / RAGGIO : 0;
  const f = Math.min(1, t * t * 1.15);
  return { dx: cx + (p.hook.x - cx) * f - p.home.x, dy: cy + (p.hook.y - cy) * f - p.home.y, f, vicino: d < ACCETTA };
}

function centro(el: Element): Punto {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * «Oltre la porta» (21/11): le operazioni arrivano come anelli di una catena che si
 * allunga; in fondo resta un gancio aperto. Le risposte sono anelli sciolti che
 * galleggiano: se ne trascina uno al gancio (la calamita lo tira da vicino) e al
 * rilascio si aggancia, e quella è la risposta. Giusto: la catena si tende e brilla
 * d'oro. Sbagliato: l'anello si spezza e cade, si accende quello giusto.
 */
function Vista({ round, onAnswer, locked, revealing, given, correct }: ArcadeViewProps<RoundCatena, number>) {
  const feedback = correct !== null;
  const calmo = menoMovimento();
  const voci = [String(round.inizio), ...round.passi.map(testoPasso)];

  const [presa, setPresa] = useState<Presa | null>(null);
  const [agganciato, setAgganciato] = useState<Agganciato | null>(null);
  const dato = useRef(false);
  const posti = useRef(new Map<number, HTMLDivElement>());
  const gancio = useRef<HTMLDivElement>(null);

  const attiva = presa ? posizione(presa) : null;

  const giu = (i: number, v: number) => (e: PE<HTMLDivElement>) => {
    if (locked || revealing || feedback || dato.current || presa) return;
    const posto = posti.current.get(i);
    if (!posto || !gancio.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPresa({ i, v, pid: e.pointerId, ox: e.clientX, oy: e.clientY, home: centro(posto), hook: centro(gancio.current), dx: 0, dy: 0 });
    suona('tap');
  };
  const muovi = (e: PE<HTMLDivElement>) => {
    if (!presa || presa.pid !== e.pointerId) return;
    setPresa({ ...presa, dx: e.clientX - presa.ox, dy: e.clientY - presa.oy });
  };
  const su = (e: PE<HTMLDivElement>) => {
    if (!presa || presa.pid !== e.pointerId) return;
    const p = presa;
    setPresa(null);
    if (!posizione(p).vicino) return; // lontano dal gancio: l'anello torna al suo posto
    dato.current = true;
    setAgganciato({ v: p.v, dx: p.hook.x - p.home.x, dy: p.hook.y - p.home.y });
    onAnswer(p.v);
  };
  const annulla = (e: PE<HTMLDivElement>) => {
    if (presa && presa.pid === e.pointerId) setPresa(null);
  };

  const oro = feedback && correct;
  const sbagliata = feedback && !correct;

  return (
    <div className="flex flex-col gap-5">
      {/* Sopra: la voce che passa (rivelazione), il comando, oppure il conto svelato. */}
      <div className="relative flex h-[112px] items-center justify-center">
        {revealing ? (
          <>
            <p className="absolute top-0 w-full text-center text-panna-100/60">Tieni il conto…</p>
            {voci.map((v, i) => (
              <span
                key={i}
                className="animate-lampo absolute inset-x-0 top-6 bottom-0 flex items-center justify-center text-7xl titolo font-semibold tabular-nums opacity-0"
                style={{ animationDelay: `${i * round.msPasso}ms`, animationDuration: `${round.msPasso}ms` }}
              >
                <span className={i === 0 ? 'text-panna-50' : 'text-oro-400'}>{v}</span>
              </span>
            ))}
          </>
        ) : feedback ? (
          <p className="text-center text-lg text-panna-100/80">
            {round.inizio} {round.passi.map((p) => ` → ${testoPasso(p)}`).join('')} = <b className="text-oro-400">{round.risultato}</b>
          </p>
        ) : (
          <p className="text-center text-2xl">Aggancia il risultato</p>
        )}
      </div>

      {/* La catena: tanti anelli quante voci, tutti vuoti (il conto resta a mente), poi il gancio. */}
      <div className={`flex h-[44px] items-center justify-center ${oro ? 'catena-tesa' : ''}`} aria-hidden>
        {voci.map((_, i) => {
          const largo = i % 2 === 0;
          return (
            <div
              key={i}
              className={`catena-anello ${i > 0 ? '-ml-2.5' : ''}`}
              style={{ animationDelay: `${i * round.msPasso}ms` }}
            >
              <div
                className={`catena-brilla rounded-full border-[5px] transition-colors duration-200 ${largo ? 'h-[30px] w-[44px]' : 'h-[40px] w-[28px]'} ${
                  oro ? 'border-oro-400 shadow-[0_0_14px_var(--color-oro-500)]' : 'border-panna-200/80'
                }`}
                style={oro ? { animationDelay: `${i * 45}ms` } : { animation: 'none' }}
              />
            </div>
          );
        })}
        <div
          ref={gancio}
          className={`-ml-2.5 h-[44px] w-[48px] transition-[opacity,scale] duration-300 ${revealing ? 'opacity-0' : 'opacity-100'} ${
            attiva?.vicino ? 'scale-110' : ''
          } ${sbagliata ? 'catena-scossa' : ''}`}
        >
          <svg viewBox="0 0 48 44" className="h-full w-full" fill="none">
            <path
              d="M6 8H34A14 14 0 0 1 34 36H6"
              stroke={oro || attiva?.vicino ? 'var(--color-oro-400)' : 'var(--color-oro-500)'}
              strokeWidth="6"
              strokeLinecap="round"
              style={{ filter: oro ? 'drop-shadow(0 0 6px var(--color-oro-500))' : undefined }}
            />
          </svg>
        </div>
      </div>

      {/* Gli anelli sciolti: arrivano a rivelazione finita e galleggiano. */}
      <div className={`grid grid-cols-4 gap-2 transition-opacity duration-300 ${revealing ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
        {round.opzioni.map((o, i) => {
          const mia = presa?.i === i;
          const agganciata = agganciato?.v === o;
          const giusta = feedback && o === round.risultato;
          const spezzata = sbagliata && given === o && agganciata;
          const sposta = agganciata
            ? { dx: agganciato.dx, dy: agganciato.dy, s: SCALA_AGGANCIO }
            : mia && attiva
              ? { dx: attiva.dx, dy: attiva.dy, s: 1.08 - (1.08 - SCALA_AGGANCIO) * attiva.f }
              : null;
          const corpo = String(o).length > 3 ? 'text-xl' : 'text-[26px]';
          return (
            <div
              key={o}
              ref={(el) => {
                if (el) posti.current.set(i, el);
                else posti.current.delete(i);
              }}
              className="relative flex h-[84px] items-center justify-center"
              style={{ zIndex: sposta ? 40 : undefined }}
            >
              <div
                onPointerDown={giu(i, o)}
                onPointerMove={muovi}
                onPointerUp={su}
                onPointerCancel={annulla}
                className="touch-none select-none"
                style={{
                  transform: sposta ? `translate(${sposta.dx}px, ${sposta.dy}px) scale(${sposta.s})` : undefined,
                  transition: mia ? 'none' : calmo ? 'transform 120ms linear' : 'transform 300ms cubic-bezier(.3,1.6,.5,1)',
                  cursor: locked || feedback ? 'default' : 'grab',
                }}
                aria-label={`Risposta ${o}`}
              >
                <div className={spezzata ? 'catena-cade' : ''}>
                  <div className={!mia && !feedback ? 'catena-galleggia' : ''} style={{ animationDelay: `${-i * 0.85}s` }}>
                    <div
                      className={[
                        'flex h-[68px] w-[68px] items-center justify-center rounded-full border-[7px] titolo font-semibold tabular-nums',
                        corpo,
                        giusta
                          ? 'animate-pop border-oro-400 bg-oro-400/25 text-oro-300 shadow-[0_0_26px_var(--color-oro-500)]'
                          : spezzata
                            ? 'border-pericolo-400 bg-pericolo-600/40 text-panna-50'
                            : mia
                              ? 'border-oro-300 bg-notte-700 text-panna-50 shadow-[0_12px_24px_var(--color-notte-950)]'
                              : 'border-panna-100 bg-notte-700 text-panna-50 shadow-[0_5px_0_var(--color-notte-950)]',
                      ].join(' ')}
                    >
                      {o}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const catena: ArcadeGame<RoundCatena, number> = {
  id: 'catena',
  mode: 'arcade',
  title: 'Catena',
  hint: 'Le operazioni passano una alla volta: tieni il conto a mente e aggancia il risultato.',
  generate: genera,
  View: Vista,
  check: (r, a) => a === r.risultato,
  timeFor: () => 4500,
  revealFor: rivelazione,
  roundPerPartita: 10,
  fluido: true,
  reazione: (giusta) => (giusta ? 750 : 1300),
};
