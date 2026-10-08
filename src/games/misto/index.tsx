import type { FC } from 'react';
import type { ArcadeGame, ArcadeViewProps, GameId } from '@/engine/cartuccia';
import type { Rng } from '@/engine/caso';
import { piuGrande } from '../piu-grande';
import { coppieMagiche } from '../coppie';
import { catena } from '../catena';
import { stimaLampo } from '../stima';

/**
 * Lampo misto: i giochi arcade mescolati, un quesito ciascuno. È una cartuccia
 * come le altre: il motore non sa che dentro ci sono quattro giochi.
 *
 * Ogni quesito porta con sé la vista e il controllo del suo gioco, così i tipi
 * dei quattro giochi restano separati.
 */
type Pezzo = {
  gioco: GameId;
  titolo: string;
  round: unknown;
  View: FC<ArcadeViewProps<unknown, unknown>>;
  check: (a: unknown) => boolean;
  tempo: number;
  rivelazione: number;
};

function pezzo<R, A>(g: ArcadeGame<R, A>, d: number, rng: Rng): Pezzo {
  const round = g.generate(d, rng);
  return {
    gioco: g.id,
    titolo: g.title,
    round,
    // Sicuro: la vista riceve sempre il quesito generato dal suo stesso gioco.
    View: g.View as unknown as FC<ArcadeViewProps<unknown, unknown>>,
    check: (a) => g.check(round, a as A),
    tempo: g.timeFor(round, d),
    rivelazione: g.revealFor?.(round) ?? 0,
  };
}

/** Coppie è una griglia intera: esce più di rado degli altri (1 su 7). */
const MAZZO = [
  (d: number, rng: Rng) => pezzo(piuGrande, d, rng),
  (d: number, rng: Rng) => pezzo(stimaLampo, d, rng),
  (d: number, rng: Rng) => pezzo(catena, d, rng),
  (d: number, rng: Rng) => pezzo(piuGrande, d, rng),
  (d: number, rng: Rng) => pezzo(stimaLampo, d, rng),
  (d: number, rng: Rng) => pezzo(catena, d, rng),
  (d: number, rng: Rng) => pezzo(coppieMagiche, d, rng),
];

/** L'ultimo gioco uscito: il motore chiama `generate` un quesito alla volta. */
let ultimo: GameId | null = null;

function genera(d: number, rng: Rng): Pezzo {
  // Mai lo stesso gioco due volte di fila: il bello è il cambio di passo.
  for (let t = 0; t < 10; t++) {
    const f = MAZZO[Math.floor(rng() * MAZZO.length)];
    if (!f) continue;
    const p = f(d, rng);
    if (p.gioco !== ultimo || t === 9) {
      ultimo = p.gioco;
      return p;
    }
  }
  return pezzo(piuGrande, d, rng);
}

function Vista(props: ArcadeViewProps<Pezzo, unknown>) {
  const { round, ...resto } = props;
  const V = round.View;
  return (
    <div className="flex flex-col gap-3">
      <p className="animate-pop self-center rounded-full bg-panna-100/15 px-3 py-0.5 text-xs font-bold tracking-[0.18em] text-oro-300 uppercase">
        {round.titolo}
      </p>
      <V round={round.round} {...resto} />
    </div>
  );
}

export const lampoMisto: ArcadeGame<Pezzo, unknown> = {
  id: 'misto',
  mode: 'arcade',
  title: 'Lampo misto',
  hint: 'Un quesito per gioco, sempre diverso: tieni il passo!',
  generate: genera,
  View: Vista,
  check: (r, a) => r.check(a),
  timeFor: (r) => r.tempo,
  revealFor: (r) => r.rivelazione,
  roundPerPartita: 15,
};
