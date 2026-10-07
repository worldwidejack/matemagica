import { useCallback, useRef, useState } from 'react';
import type { PuzzleGame } from './cartuccia';
import { SCOSSA, type FinePartita, type PlayProps } from './partita';
import { Pronto } from './Pronto';
import {
  ROMPICAPO,
  bravuraConLimiti,
  bravuraDopoPartita,
  dentroLimiti,
  diffDopoRompicapo,
  diffIniziale,
  puntiRompicapo,
  stelleRompicapo,
} from './regole';
import { Risultato } from './Risultato';
import { suona, vibra } from '@/audio/sfx';
import type { RiepilogoPartita } from '@/profilo/store';

type Esito = 'risolto' | 'saltato';

type Stato<R> = {
  round: R;
  d: number;
  indice: number;
  esiti: Esito[];
  punteggio: number;
  aiutiTotali: number;
  sbagliTotali: number;
  diffRisolti: number[];
  aiutiQui: number;
  sbagliQui: number;
  chiuso: Esito | null;
  guadagno: number;
};

/**
 * Il motore dei rompicapo: niente timer, niente vite. Si ragiona, si sbaglia
 * senza ansia, si chiede un aiuto. Possiede punti, aiuti, stelle e livello
 * adattivo per TUTTI i rompicapo; il gioco fornisce quesito, vista, controllo,
 * aiuti e spiegazione.
 */
export function PuzzleShell<R, A>({
  game,
  bravura,
  record,
  limiti,
  etichetta,
  inPalestra,
  onFine,
  onEsci,
}: PlayProps & { game: PuzzleGame<R, A> }) {
  const totale = game.roundPerPartita ?? ROMPICAPO.roundPredefiniti;
  const [fase, setFase] = useState<'pronto' | 'gioco' | 'fine'>('pronto');
  const [st, setSt] = useState<Stato<R> | null>(null);
  const [fine, setFine] = useState<{ fine: FinePartita; riepilogo: RiepilogoPartita } | null>(null);
  const campo = useRef<HTMLDivElement>(null);
  /** Cresce a ogni partita: con l'indice, azzera la vista del gioco a ogni rompicapo. */
  const [nPartita, setNPartita] = useState(0);

  const nuovoStato = useCallback(
    (d: number, indice: number, prima?: Stato<R>): Stato<R> => ({
      round: game.generate(d, Math.random),
      d,
      indice,
      esiti: prima?.esiti ?? [],
      punteggio: prima?.punteggio ?? 0,
      aiutiTotali: prima?.aiutiTotali ?? 0,
      sbagliTotali: prima?.sbagliTotali ?? 0,
      diffRisolti: prima?.diffRisolti ?? [],
      aiutiQui: 0,
      sbagliQui: 0,
      chiuso: null,
      guadagno: 0,
    }),
    [game],
  );

  const via = useCallback(() => {
    suona('tap');
    setFine(null);
    setNPartita((n) => n + 1);
    setSt(nuovoStato(dentroLimiti(diffIniziale(bravura), limiti), 0));
    setFase('gioco');
  }, [bravura, limiti, nuovoStato]);

  const chiudiRompicapo = (s: Stato<R>, esito: Esito): Stato<R> => {
    const pulito = s.aiutiQui === 0 && s.sbagliQui === 0;
    const guadagno = esito === 'risolto' ? puntiRompicapo(s.d, s.aiutiQui, s.sbagliQui) : 0;
    return {
      ...s,
      chiuso: esito,
      guadagno,
      punteggio: s.punteggio + guadagno,
      esiti: [...s.esiti, esito],
      aiutiTotali: s.aiutiTotali + s.aiutiQui,
      sbagliTotali: s.sbagliTotali + s.sbagliQui,
      diffRisolti: esito === 'risolto' ? [...s.diffRisolti, s.d] : s.diffRisolti,
      d: dentroLimiti(diffDopoRompicapo(s.d, esito === 'risolto', pulito), limiti),
    };
  };

  const onTry = (a: A) => {
    if (!st || st.chiuso) return;
    if (game.check(st.round, a)) {
      suona('giusto', 0.5);
      setSt(chiudiRompicapo(st, 'risolto'));
      return;
    }
    suona('sbagliato');
    vibra(100);
    campo.current?.animate(SCOSSA, { duration: 400, easing: 'ease-in-out' });
    setSt({ ...st, sbagliQui: st.sbagliQui + 1 });
  };

  const aiuto = () => {
    if (!st || st.chiuso) return;
    if (st.aiutiQui >= game.aiuti(st.round).length) return;
    suona('tap');
    setSt({ ...st, aiutiQui: st.aiutiQui + 1 });
  };

  const salta = () => {
    if (!st || st.chiuso) return;
    suona('tap');
    setSt(chiudiRompicapo(st, 'saltato'));
  };

  const avanti = () => {
    if (!st) return;
    if (st.indice + 1 < totale) {
      suona('tap');
      setSt(nuovoStato(st.d, st.indice + 1, st));
      return;
    }
    const risolti = st.esiti.filter((e) => e === 'risolto').length;
    const esito = {
      punteggio: st.punteggio,
      risolti,
      saltati: totale - risolti,
      aiutiTotali: st.aiutiTotali,
      sbagliTotali: st.sbagliTotali,
      totale,
    };
    const f: FinePartita = {
      punteggio: st.punteggio,
      stelle: stelleRompicapo(esito),
      bravuraDopo: bravuraConLimiti(bravura, bravuraDopoPartita(bravura, st.diffRisolti), st.diffRisolti, limiti),
      dati: [
        { etichetta: 'Risolti', valore: `${risolti}/${totale}` },
        { etichetta: 'Aiuti', valore: String(st.aiutiTotali) },
      ],
    };
    suona('fine');
    setFine({ fine: f, riepilogo: onFine(f) });
    setFase('fine');
  };

  if (fase === 'fine' && fine) {
    return (
      <Risultato
        titolo={game.title}
        etichetta={etichetta}
        fine={fine.fine}
        riepilogo={fine.riepilogo}
        inPalestra={inPalestra}
        onAncora={via}
        onEsci={() => onEsci(true)}
      />
    );
  }

  if (fase === 'pronto' || !st) {
    return (
      <Pronto
        titolo={game.title}
        hint={game.hint}
        etichetta={etichetta}
        bravura={bravura}
        record={record}
        tipo="puzzle"
        onVia={via}
        onEsci={() => onEsci(false)}
      />
    );
  }

  const aiuti = game.aiuti(st.round);
  const View = game.View;

  return (
    <div ref={campo} className="relative flex min-h-full flex-col px-4 pt-3 pb-4">
      <header className="flex items-center justify-between text-lg">
        <button onClick={() => onEsci(false)} className="text-2xl text-white/50" aria-label="Esci">
          ✕
        </button>
        <div className="flex gap-2" aria-label={`Rompicapo ${st.indice + 1} di ${totale}`}>
          {Array.from({ length: totale }, (_, i) => {
            const e = st.esiti[i];
            const colore =
              e === 'risolto'
                ? 'bg-turchese-400'
                : e === 'saltato'
                  ? 'bg-white/25'
                  : i === st.indice
                    ? 'bg-oro-400 animate-respiro'
                    : 'bg-notte-600';
            return <span key={i} className={`h-3 w-3 rounded-full ${colore}`} />;
          })}
        </div>
        <div className="relative min-w-16 text-right font-bold tabular-nums text-oro-400">
          {st.punteggio}
          {st.chiuso === 'risolto' && (
            <span key={`pti-${st.indice}`} className="animate-sali absolute top-6 right-0 text-base text-turchese-300">
              +{st.guadagno}
            </span>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center py-2">
        <View key={`${nPartita}-${st.indice}`} round={st.round} onTry={onTry} locked={st.chiuso !== null} sbagli={st.sbagliQui} risolto={st.chiuso !== null} />
      </main>

      {st.aiutiQui > 0 && st.chiuso === null && (
        <div className="mb-3 flex flex-col gap-2">
          {aiuti.slice(0, st.aiutiQui).map((a, i) => (
            <p key={i} className="animate-pop rounded-2xl bg-turchese-500/15 px-4 py-3 text-turchese-300">
              💡 {a}
            </p>
          ))}
        </div>
      )}

      {st.chiuso !== null ? (
        <div className="animate-pop flex flex-col gap-3">
          <div
            className={`rounded-2xl px-4 py-3 ${st.chiuso === 'risolto' ? 'bg-turchese-500/15' : 'bg-notte-700'}`}
          >
            <p className={`font-bold ${st.chiuso === 'risolto' ? 'text-turchese-300' : 'text-white/70'}`}>
              {st.chiuso === 'risolto' ? (st.sbagliQui === 0 && st.aiutiQui === 0 ? 'Perfetto!' : 'Risolto!') : 'La soluzione'}
            </p>
            <p className="mt-1 text-white/85">{game.soluzione(st.round)}</p>
          </div>
          <button
            onClick={avanti}
            className="rounded-2xl bg-oro-500 py-4 text-xl font-bold text-notte-900 shadow-[0_0_30px_var(--color-oro-500)] active:scale-95"
          >
            {st.indice + 1 < totale ? 'Avanti' : 'Fine'}
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={aiuto}
            disabled={st.aiutiQui >= aiuti.length}
            className="flex-1 rounded-2xl bg-notte-700 py-3 font-bold text-turchese-300 disabled:opacity-40"
          >
            💡 Aiuto {aiuti.length > 0 ? `(${aiuti.length - st.aiutiQui})` : ''}
          </button>
          <button onClick={salta} className="rounded-2xl bg-notte-800 px-5 py-3 text-white/60">
            Salta
          </button>
        </div>
      )}
    </div>
  );
}
