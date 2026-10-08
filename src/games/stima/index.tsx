import type { ArcadeGame, ArcadeViewProps } from '@/engine/cartuccia';
import { formatta, genera, tempo, type RoundStima } from './logica';

function Vista({ round, onAnswer, locked, given, correct }: ArcadeViewProps<RoundStima, number>) {
  const feedback = correct !== null;
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <p className="text-[clamp(2.4rem,12vw,3.8rem)] leading-none titolo font-semibold tabular-nums">{round.testo}</p>
        <p className={`mt-3 text-xl ${feedback ? 'text-panna-100/80' : 'text-panna-100/50'}`}>
          {feedback ? `= ${formatta(Math.round(round.valore * 10) / 10)}` : '≈ quanto, più o meno?'}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {round.opzioni.map((o, i) => {
          const giusta = feedback && i === round.giusta;
          const sbagliata = feedback && given === i && !correct;
          return (
            <button
              key={o}
              disabled={locked}
              onClick={() => onAnswer(i)}
              className={[
                'rounded-3xl border-2 py-5 text-3xl titolo font-semibold tabular-nums active:scale-95',
                giusta
                  ? 'animate-pop border-oro-600 bg-oro-400 text-inchiostro'
                  : sbagliata
                    ? 'border-pericolo-400 bg-pericolo-400 text-panna-50'
                    : 'border-panna-200 bg-panna-100 text-inchiostro',
              ].join(' ')}
            >
              ≈ {formatta(o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const stimaLampo: ArcadeGame<RoundStima, number> = {
  id: 'stima',
  mode: 'arcade',
  title: 'Stima lampo',
  hint: 'Non c’è tempo per il calcolo esatto: scegli il valore più vicino. Arrotonda!',
  generate: genera,
  View: Vista,
  check: (r, i) => i === r.giusta,
  timeFor: (_r, d) => tempo(d),
  roundPerPartita: 15,
};
