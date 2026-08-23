import { useState } from 'react';
import { WORLDS } from '@/content/worlds';
import { GameShell } from '@/shell/GameShell';
import { segniGame } from '@/games/segni';
import type { GameResult } from '@/shell/types';
import type { WorldId } from '@/state/types';

/**
 * M1 — casa provvisoria.
 *
 * In M2 questa schermata diventa la mappa vera (sentiero, nodi, sblocchi) e la
 * progressione finisce in localStorage. Per ora tiene il record in memoria:
 * serve solo a poter entrare e uscire da una partita.
 */
export default function App() {
  const [playing, setPlaying] = useState<WorldId | null>(null);
  const [best, setBest] = useState<Record<WorldId, number>>({});
  const [lastStars, setLastStars] = useState<Record<WorldId, number>>({});

  if (playing !== null) {
    const world = WORLDS.find((w) => w.id === playing);
    if (world) {
      return (
        <GameShell
          game={segniGame}
          starThresholds={world.starThresholds}
          bestScore={best[world.id] ?? 0}
          onFinish={(r: GameResult) => {
            setBest((b) => ({ ...b, [world.id]: Math.max(b[world.id] ?? 0, r.score) }));
            setLastStars((s) => ({ ...s, [world.id]: Math.max(s[world.id] ?? 0, r.stars) }));
          }}
          onExit={() => setPlaying(null)}
        />
      );
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-12 text-center">
      <Backdrop />

      <div className="relative flex w-full max-w-xs flex-col items-center gap-7">
        <Sigil />

        <div className="space-y-1">
          <h1 className="bg-gradient-to-b from-gold-400 to-gold-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
            Matemagica
          </h1>
          <p className="text-sm text-teal-300/70">Palestra mentale matematica</p>
        </div>

        <ul className="w-full space-y-2.5">
          {WORLDS.map((w, i) => {
            const playable = w.gameId === 'segni';
            const stars = lastStars[w.id] ?? 0;
            return (
              <li key={w.id}>
                <button
                  disabled={!playable}
                  onClick={() => setPlaying(w.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                    playable
                      ? 'border-teal-400/25 bg-night-800 active:scale-[0.98]'
                      : 'border-white/5 bg-night-800/40 opacity-45'
                  }`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                      playable ? 'bg-gold-500 text-night-900' : 'bg-night-600 text-white/40'
                    }`}
                  >
                    {playable ? i + 1 : '🔒'}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-white/85">{w.title}</span>
                    <span className="block text-[10px] uppercase tracking-widest text-white/30">
                      {playable ? 'gioca' : 'in arrivo'}
                    </span>
                  </span>
                  {playable && (
                    <span className="text-xs tracking-tight">
                      {[0, 1, 2].map((s) => (
                        <span key={s} className={s < stars ? '' : 'opacity-20 grayscale'}>
                          ⭐
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-[10px] uppercase tracking-widest text-white/25">M1 · il gioco esiste</p>
      </div>
    </main>
  );
}

/** Il sigillo geometrico: cerchio, triangolo, quadrato che ruotano piano. */
function Sigil() {
  return (
    <svg viewBox="0 0 120 120" className="size-24" aria-hidden="true">
      <defs>
        <linearGradient id="sigil-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-gold-400)" />
          <stop offset="100%" stopColor="var(--color-gold-600)" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transformOrigin: '60px 60px' }}
        className="motion-safe:animate-[spin_28s_linear_infinite]"
      >
        <circle cx="60" cy="60" r="52" stroke="url(#sigil-gold)" strokeWidth="1.5" opacity="0.55" />
        <polygon points="60,16 98,82 22,82" stroke="var(--color-teal-400)" strokeWidth="2" opacity="0.9" />
        <rect x="32" y="32" width="56" height="56" rx="4" stroke="var(--color-magenta-400)" strokeWidth="1.5" opacity="0.5" />
      </g>
      <circle cx="60" cy="60" r="5" fill="var(--color-gold-400)" />
    </svg>
  );
}

/** Sfondo: due aloni morbidi, niente immagini — placeholder-first (§1.4). */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-teal-500/15 blur-3xl" />
      <div className="absolute -bottom-32 right-[-20%] size-80 rounded-full bg-gold-500/10 blur-3xl" />
    </div>
  );
}
