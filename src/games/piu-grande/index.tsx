import type { ArcadeGame, ArcadeViewProps } from '@/engine/cartuccia';
import { genera, giusta, risultato, tempo, type Lato, type RoundPiuGrande } from './logica';

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
          'flex min-h-36 flex-col items-center justify-center relative rounded-[1.75rem] px-4 py-6 transition-transform duration-100',
          'active:scale-95',
          giustaQui
            ? 'animate-pop bg-oro-400 text-inchiostro shadow-[0_5px_0_var(--color-oro-600)]'
            : sbagliataQui
              ? 'animate-trema bg-pericolo-400 text-panna-50'
              : 'ombra-dura bg-panna-50 text-inchiostro',
        ].join(' ')}
      >
        <span className="text-[clamp(2.2rem,11vw,3.5rem)] leading-none titolo font-bold tabular-nums">{e.testo}</span>
        <span className={`absolute inset-x-0 bottom-3 text-xl font-bold tabular-nums ${feedback ? 'opacity-80' : 'text-transparent'}`}>
          {risultato(e.valore)}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-panna-50/80">Quale è più grande?</p>
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
  timeFor: (round, d) => tempo(d, round),
};
