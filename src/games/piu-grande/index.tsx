import type { ArcadeGame, ArcadeViewProps } from '@/engine/cartuccia';
import { genera, giusta, tempo, type Lato, type RoundPiuGrande } from './logica';

function Vista({ round, onAnswer, locked, given, correct }: ArcadeViewProps<RoundPiuGrande, Lato>) {
  const feedback = correct !== null;
  const vincente: Lato = round.a.valore > round.b.valore ? 'a' : 'b';

  const carta = (lato: Lato) => {
    const e = round[lato];
    const scelta = given === lato;
    const giustaQui = feedback && lato === vincente;
    const sbagliataQui = feedback && scelta && !correct;
    return (
      <button
        key={lato}
        disabled={locked}
        onClick={() => onAnswer(lato)}
        className={[
          'flex min-h-36 flex-col items-center justify-center rounded-3xl border-2 px-4 py-6 transition-transform duration-100',
          'active:scale-95',
          giustaQui
            ? 'animate-pop border-oro-400 bg-oro-500/20 shadow-[0_0_30px_var(--color-oro-500)]'
            : sbagliataQui
              ? 'border-pericolo-400 bg-pericolo-400/15'
              : 'border-notte-600 bg-notte-700',
        ].join(' ')}
      >
        <span className="text-[clamp(2.2rem,11vw,3.5rem)] leading-none font-bold tabular-nums">{e.testo}</span>
        <span className={`mt-2 h-7 text-xl tabular-nums ${feedback ? 'text-white/80' : 'text-transparent'}`}>
          = {e.valore}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-white/60">Quale è più grande?</p>
      {carta('a')}
      {carta('b')}
    </div>
  );
}

export const piuGrande: ArcadeGame<RoundPiuGrande, Lato> = {
  id: 'piu-grande',
  mode: 'arcade',
  title: 'Chi è più grande?',
  hint: 'Tocca l’espressione che vale di più. Stimare va benissimo.',
  generate: genera,
  View: Vista,
  check: giusta,
  timeFor: (_round, d) => tempo(d),
};
