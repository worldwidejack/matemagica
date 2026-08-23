import type { GameResult } from './types';

/** Schermata di fine partita. Vive nel guscio: uguale per ogni minigioco. */
export function ResultScreen({
  title,
  result,
  bestScore,
  onRetry,
  onExit,
}: {
  title: string;
  result: GameResult;
  bestScore: number;
  onRetry: () => void;
  onExit: () => void;
}) {
  const isRecord = result.score > bestScore;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-7 px-8 text-center">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-widest text-white/30">{title}</div>
        <h2 className="text-2xl font-bold text-white/80">
          {result.stars === 0 ? 'Ci sei quasi' : 'Fine partita'}
        </h2>
      </div>

      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 160}ms` }}
            className={`text-4xl ${
              i < result.stars ? 'animate-star-in' : 'opacity-15 grayscale'
            }`}
          >
            ⭐
          </span>
        ))}
      </div>

      <div className="space-y-1">
        <div className="text-5xl font-bold tabular-nums text-gold-400">{result.score}</div>
        {isRecord && result.score > 0 && (
          <div className="animate-pop text-xs font-semibold uppercase tracking-widest text-teal-300">
            nuovo record
          </div>
        )}
      </div>

      <dl className="flex gap-8 text-center">
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-white/30">combo max</dt>
          <dd className="text-lg font-semibold tabular-nums text-white/75">{result.maxCombo}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-white/30">round</dt>
          <dd className="text-lg font-semibold tabular-nums text-white/75">{result.rounds}</dd>
        </div>
      </dl>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={onRetry}
          className="rounded-2xl bg-gold-500 px-8 py-4 text-lg font-bold text-night-900 shadow-lg shadow-gold-500/20 transition active:scale-95"
        >
          Ancora
        </button>
        <button
          onClick={onExit}
          className="rounded-2xl border border-white/10 px-8 py-3 text-sm font-semibold text-white/50 transition active:scale-95"
        >
          Esci
        </button>
      </div>
    </div>
  );
}
