import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameResult, MiniGame } from './types';
import { SCORING, multiplierFor, pointsFor, starsFor, timeForRound } from './types';
import { ResultScreen } from './ResultScreen';

type Phase = 'ready' | 'playing' | 'over';

type Feedback = {
  /** cresce a ogni feedback: serve a rilanciare le animazioni */
  key: number;
  correct: boolean;
  gained: number;
};

type Props<R, A> = {
  game: MiniGame<R, A>;
  starThresholds: readonly [number, number, number];
  bestScore: number;
  onFinish: (r: GameResult) => void;
  onExit: () => void;
};

/**
 * Il guscio arcade. Possiede timer, vite, combo, punteggio, feedback e
 * schermata risultato — e li possiede per TUTTI i minigiochi.
 * La cartuccia riceve solo `round` e restituisce risposte.
 */
export function GameShell<R, A>({
  game,
  starThresholds,
  bestScore,
  onFinish,
  onExit,
}: Props<R, A>) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [round, setRound] = useState<R | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState<number>(SCORING.lives);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [given, setGiven] = useState<A | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [msLeft, setMsLeft] = useState(0);

  const deadlineRef = useRef(0);
  const budgetRef = useRef(1);
  const lockedRef = useRef(false);
  /** Record com'era PRIMA di questa partita: serve alla schermata risultato. */
  const bestAtStartRef = useRef(bestScore);
  const timeoutRef = useRef<number | null>(null);

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const nextRound = useCallback(
    (currentCombo: number) => {
      const difficulty = game.difficultyCurve(currentCombo);
      const budget = timeForRound(difficulty);
      budgetRef.current = budget;
      deadlineRef.current = performance.now() + budget;
      setMsLeft(budget);
      setRound(game.generateRound(difficulty));
      setGiven(null);
      setFeedback(null);
      lockedRef.current = false;
    },
    [game],
  );

  const start = useCallback(() => {
    clearPending();
    bestAtStartRef.current = bestScore;
    setScore(0);
    setLives(SCORING.lives);
    setCombo(0);
    setMaxCombo(0);
    setRounds(0);
    setPhase('playing');
    nextRound(0);
  }, [bestScore, clearPending, nextRound]);

  /** Unico punto in cui si risolve un round: risposta data o tempo scaduto. */
  const resolve = useCallback(
    (isCorrect: boolean, answer: A | null) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      setGiven(answer);
      setRounds((r) => r + 1);

      const left = Math.max(0, deadlineRef.current - performance.now());

      if (isCorrect) {
        const gained = pointsFor(combo, left);
        const newCombo = combo + 1;
        setScore((s) => s + gained);
        setCombo(newCombo);
        setMaxCombo((m) => Math.max(m, newCombo));
        setFeedback({ key: Date.now(), correct: true, gained });
        timeoutRef.current = window.setTimeout(() => nextRound(newCombo), 480);
        return;
      }

      setCombo(0);
      setFeedback({ key: Date.now(), correct: false, gained: 0 });
      const remaining = lives - 1;
      setLives(remaining);
      if (remaining <= 0) {
        timeoutRef.current = window.setTimeout(() => setPhase('over'), 900);
      } else {
        timeoutRef.current = window.setTimeout(() => nextRound(0), 900);
      }
    },
    [combo, lives, nextRound],
  );

  const handleAnswer = useCallback(
    (a: A) => {
      if (round === null) return;
      resolve(game.checkAnswer(round, a), a);
    },
    [game, resolve, round],
  );

  /** Il timer: un solo rAF, che aggiorna la barra e fa scadere il round. */
  useEffect(() => {
    if (phase !== 'playing') return;
    let raf = 0;
    const tick = () => {
      const left = Math.max(0, deadlineRef.current - performance.now());
      setMsLeft(left);
      if (left <= 0 && !lockedRef.current) resolve(false, null);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, resolve]);

  useEffect(() => clearPending, [clearPending]);

  const result = useMemo<GameResult>(
    () => ({ score, maxCombo, rounds, stars: starsFor(score, starThresholds) }),
    [score, maxCombo, rounds, starThresholds],
  );

  useEffect(() => {
    if (phase === 'over') onFinish(result);
    // onFinish va chiamata una volta sola, alla transizione
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === 'ready') {
    return <ReadyScreen game={game} bestScore={bestScore} onStart={start} onExit={onExit} />;
  }

  if (phase === 'over') {
    return (
      <ResultScreen
        title={game.title}
        result={result}
        bestScore={bestAtStartRef.current}
        onRetry={start}
        onExit={onExit}
      />
    );
  }

  const ratio = Math.max(0, Math.min(1, msLeft / budgetRef.current));
  const urgent = ratio < 0.3;
  const multiplier = multiplierFor(combo);

  return (
    <div className="relative flex min-h-dvh flex-col bg-night-900">
      {/* flash a tutto schermo: è metà del juice, e costa una div */}
      {feedback && (
        <div
          key={feedback.key}
          aria-hidden="true"
          className={`pointer-events-none fixed inset-0 z-20 animate-flash ${
            feedback.correct ? 'bg-teal-400/25' : 'bg-danger-400/25'
          }`}
        />
      )}

      <header className="flex items-center justify-between px-5 pt-5">
        <button
          onClick={onExit}
          className="rounded-lg px-2 py-1 text-xs uppercase tracking-widest text-white/35 active:text-white/70"
        >
          ← esci
        </button>
        <Lives count={lives} lostKey={feedback && !feedback.correct ? feedback.key : 0} />
      </header>

      <div className="px-5 pt-4">
        <div className="flex items-end justify-between">
          <div className="relative">
            <div className="text-[10px] uppercase tracking-widest text-white/30">punti</div>
            <div className="text-3xl font-bold tabular-nums text-white">{score}</div>
            {feedback?.correct && (
              <div
                key={feedback.key}
                className="animate-float-up pointer-events-none absolute -top-1 left-full ml-2 whitespace-nowrap text-lg font-bold text-teal-300"
              >
                +{feedback.gained}
              </div>
            )}
          </div>
          {combo > 0 && (
            <div key={combo} className="animate-pop text-right">
              <div className="text-[10px] uppercase tracking-widest text-white/30">combo</div>
              <div className="text-2xl font-bold tabular-nums text-gold-400">
                {combo}
                {multiplier > 1 && <span className="ml-1 text-teal-300">×{multiplier}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-night-700">
          <div
            className={`h-full rounded-full transition-colors ${
              urgent ? 'bg-danger-400' : 'bg-teal-400'
            }`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </div>

      <main
        key={feedback && !feedback.correct ? `shake-${feedback.key}` : 'calm'}
        className={`flex min-h-0 flex-1 flex-col px-5 pb-8 pt-2 ${
          feedback && !feedback.correct ? 'animate-shake' : ''
        }`}
      >
        {round !== null && (
          <game.RoundView
            round={round}
            onAnswer={handleAnswer}
            locked={feedback !== null}
            given={given}
            correct={feedback ? feedback.correct : null}
          />
        )}
      </main>
    </div>
  );
}

function Lives({ count, lostKey }: { count: number; lostKey: number }) {
  return (
    <div key={lostKey} className="flex gap-1.5">
      {Array.from({ length: SCORING.lives }, (_, i) => (
        <span
          key={i}
          className={`text-lg transition-opacity ${i < count ? 'opacity-100' : 'opacity-20 grayscale'}`}
        >
          ❤️
        </span>
      ))}
    </div>
  );
}

function ReadyScreen<R, A>({
  game,
  bestScore,
  onStart,
  onExit,
}: {
  game: MiniGame<R, A>;
  bestScore: number;
  onStart: () => void;
  onExit: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-8 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gold-400">{game.title}</h1>
        <p className="text-pretty text-sm leading-relaxed text-white/55">{game.hint}</p>
      </div>

      <div className="flex items-center gap-6 text-xs uppercase tracking-widest text-white/35">
        <span>❤️ {SCORING.lives} vite</span>
        {bestScore > 0 && <span>record {bestScore}</span>}
      </div>

      <button
        onClick={onStart}
        className="w-full max-w-xs rounded-2xl bg-gold-500 px-8 py-4 text-lg font-bold text-night-900 shadow-lg shadow-gold-500/20 transition active:scale-95"
      >
        Gioca
      </button>

      <button
        onClick={onExit}
        className="text-xs uppercase tracking-widest text-white/30 active:text-white/60"
      >
        ← indietro
      </button>
    </div>
  );
}
