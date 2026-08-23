import type { MiniGame, RoundViewProps } from '@/shell/types';

/**
 * Cartuccia 1 — la regola dei segni.
 *
 * Non si chiede il risultato: si chiede solo il SEGNO. È l'unica domanda che si
 * può leggere e rispondere in meno di due secondi, e due secondi è il ritmo che
 * rende il gioco arcade invece che un compito in classe.
 */

export type SegniOp = '×' | '÷';

export type SegniRound = {
  factors: number[];
  /** ops[i] sta fra factors[i] e factors[i+1]; lunghezza = factors.length - 1 */
  ops: SegniOp[];
  negative: boolean;
};

export type SegniAnswer = 'pos' | 'neg';

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function generateRound(difficulty: number): SegniRound {
  const count = Math.min(2 + Math.floor(difficulty / 2.5), 5);
  const maxMagnitude = difficulty < 3 ? 9 : 12;
  const allowDivision = difficulty >= 4;

  const factors: number[] = [];
  for (let i = 0; i < count; i++) {
    const magnitude = randInt(2, maxMagnitude);
    factors.push(Math.random() < 0.5 ? -magnitude : magnitude);
  }

  const ops: SegniOp[] = [];
  for (let i = 0; i < count - 1; i++) {
    ops.push(allowDivision && Math.random() < 0.35 ? '÷' : '×');
  }

  // La regola: conta i segni meno. Dispari → negativo. La divisione non cambia nulla.
  const negativeCount = factors.filter((f) => f < 0).length;
  return { factors, ops, negative: negativeCount % 2 === 1 };
}

export function checkAnswer(round: SegniRound, a: SegniAnswer): boolean {
  return (a === 'neg') === round.negative;
}

export function difficultyCurve(combo: number): number {
  return Math.min(combo * 0.55, 8);
}

function Term({ value }: { value: number }) {
  const negative = value < 0;
  return (
    <span className="whitespace-nowrap">
      <span className="text-white/30">(</span>
      <span className={negative ? 'text-danger-400' : 'text-teal-300'}>
        {negative ? '−' : '+'}
      </span>
      <span className="text-white">{Math.abs(value)}</span>
      <span className="text-white/30">)</span>
    </span>
  );
}

function RoundView({ round, onAnswer, locked, given, correct }: RoundViewProps<SegniRound, SegniAnswer>) {
  const answer: SegniAnswer = round.negative ? 'neg' : 'pos';

  const buttonClass = (option: SegniAnswer, base: string) => {
    if (!locked) return `${base} active:scale-95`;
    if (option === answer) return `${base} ring-4 ring-teal-300 brightness-125`;
    if (option === given && correct === false) return `${base} opacity-40 saturate-50`;
    return `${base} opacity-30`;
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center">
      <div
        data-testid="espressione"
        className={`flex flex-1 flex-wrap content-center items-center justify-center gap-x-2 gap-y-2 font-bold ${
          round.factors.length > 3 ? 'text-3xl' : 'text-4xl'
        }`}
      >
        {round.factors.map((f, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-white/35">{round.ops[i - 1]}</span>}
            <Term value={f} />
          </span>
        ))}
      </div>

      <div className="pb-6 text-xs uppercase tracking-[0.2em] text-white/30">che segno viene?</div>

      <div className="grid w-full grid-cols-2 gap-3">
        <button
          disabled={locked}
          onClick={() => onAnswer('pos')}
          className={buttonClass(
            'pos',
            'rounded-2xl bg-teal-500 py-7 text-3xl font-bold text-night-900 shadow-lg shadow-teal-500/20 transition',
          )}
        >
          +
        </button>
        <button
          disabled={locked}
          onClick={() => onAnswer('neg')}
          className={buttonClass(
            'neg',
            'rounded-2xl bg-magenta-400 py-7 text-3xl font-bold text-night-900 shadow-lg shadow-magenta-400/20 transition',
          )}
        >
          −
        </button>
      </div>
    </div>
  );
}

export const segniGame: MiniGame<SegniRound, SegniAnswer> = {
  id: 'segni',
  title: 'La Regola dei Segni',
  hint: 'Non serve il risultato: conta solo quanti meno ci sono. Dispari → negativo.',
  generateRound,
  checkAnswer,
  difficultyCurve,
  RoundView,
};
