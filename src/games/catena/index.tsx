import type { ArcadeGame, ArcadeViewProps } from '@/engine/cartuccia';
import { genera, rivelazione, testoPasso, type RoundCatena } from './logica';

function Vista({ round, onAnswer, locked, revealing, given, correct }: ArcadeViewProps<RoundCatena, number>) {
  const feedback = correct !== null;
  const voci = [String(round.inizio), ...round.passi.map(testoPasso)];

  if (revealing) {
    // Le voci compaiono una alla volta nello stesso punto: solo CSS, nessun timer.
    return (
      <div className="flex flex-col items-center gap-8">
        <p className="text-panna-100/60">Tieni il conto…</p>
        <div className="relative h-32 w-full">
          {voci.map((v, i) => (
            <span
              key={i}
              className="animate-lampo absolute inset-0 flex items-center justify-center text-7xl titolo font-semibold tabular-nums opacity-0"
              style={{ animationDelay: `${i * round.msPasso}ms`, animationDuration: `${round.msPasso}ms` }}
            >
              <span className={i === 0 ? 'text-panna-50' : 'text-oro-400'}>{v}</span>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          {voci.map((_, i) => (
            <span
              key={i}
              className="animate-accendi h-2 w-2 rounded-full bg-white/15"
              style={{ animationDelay: `${i * round.msPasso}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-2xl">
        {feedback ? (
          <span className="text-lg text-panna-100/80">
            {round.inizio} {round.passi.map((p) => ` → ${testoPasso(p)}`).join('')} ={' '}
            <b className="text-oro-400">{round.risultato}</b>
          </span>
        ) : (
          'Quanto fa?'
        )}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {round.opzioni.map((o) => {
          const giusta = feedback && o === round.risultato;
          const sbagliata = feedback && given === o && !correct;
          return (
            <button
              key={o}
              disabled={locked}
              onClick={() => onAnswer(o)}
              className={[
                'rounded-3xl border-2 py-7 text-4xl titolo font-semibold tabular-nums active:scale-95',
                giusta
                  ? 'animate-pop border-oro-600 bg-oro-400 text-inchiostro'
                  : sbagliata
                    ? 'border-pericolo-400 bg-pericolo-400 text-panna-50'
                    : 'border-panna-200 bg-panna-100 text-inchiostro',
              ].join(' ')}
            >
              {o}
            </button>
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
  hint: 'Le operazioni passano una alla volta: tieni il conto a mente e scegli il risultato.',
  generate: genera,
  View: Vista,
  check: (r, a) => a === r.risultato,
  timeFor: () => 4500,
  revealFor: rivelazione,
  roundPerPartita: 10,
};
