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
import { Testa } from './Testa';
import { Bottone, Oggetto } from '@/ui/kit';
import { suona, vibra } from '@/audio/sfx';
import { quesitoNuovo, rngConSeme, type Rng } from './caso';
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
  pulitiTotali: number;
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
  quesiti,
  etichetta,
  inPalestra,
  seme,
  condividi,
  onFine,
  onEsci,
}: PlayProps & { game: PuzzleGame<R, A> }) {
  // Con un seme (sfida del giorno) i rompicapo sono gli stessi per tutti.
  const rng = useRef<Rng>(seme !== undefined ? rngConSeme(seme) : Math.random);
  /** I rompicapo già usciti in questa partita: nessuno torna due volte. */
  const visti = useRef(new Set<string>());
  const totale = Math.min(quesiti ?? ROMPICAPO.roundPredefiniti, game.roundPerPartita ?? ROMPICAPO.roundPredefiniti);
  const [fase, setFase] = useState<'pronto' | 'gioco' | 'fine'>('pronto');
  const [st, setSt] = useState<Stato<R> | null>(null);
  const [fine, setFine] = useState<{ fine: FinePartita; riepilogo: RiepilogoPartita } | null>(null);
  const campo = useRef<HTMLDivElement>(null);
  /** Cresce a ogni partita: con l'indice, azzera la vista del gioco a ogni rompicapo. */
  const [nPartita, setNPartita] = useState(0);

  const nuovoStato = useCallback(
    (d: number, indice: number, prima?: Stato<R>): Stato<R> => ({
      round: quesitoNuovo(() => game.generate(d, rng.current), visti.current),
      d,
      indice,
      esiti: prima?.esiti ?? [],
      punteggio: prima?.punteggio ?? 0,
      aiutiTotali: prima?.aiutiTotali ?? 0,
      sbagliTotali: prima?.sbagliTotali ?? 0,
      pulitiTotali: prima?.pulitiTotali ?? 0,
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
    if (seme !== undefined) rng.current = rngConSeme(seme);
    visti.current = new Set();
    setSt(nuovoStato(dentroLimiti(diffIniziale(bravura), limiti), 0));
    setFase('gioco');
  }, [bravura, limiti, nuovoStato, seme]);

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
      pulitiTotali: s.pulitiTotali + (esito === 'risolto' && pulito ? 1 : 0),
      diffRisolti: esito === 'risolto' ? [...s.diffRisolti, s.d] : s.diffRisolti,
      d: dentroLimiti(diffDopoRompicapo(s.d, esito === 'risolto', pulito), limiti),
    };
  };

  const onTry = (a: A) => {
    if (!st || st.chiuso) return;
    if (game.check(st.round, a)) {
      suona('giusto', 0.5);
      vibra(20);
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
      puliti: st.pulitiTotali,
      risolti,
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
        condividi={condividi?.(fine.fine)}
        onAncora={via}
        onEsci={() => onEsci(true)}
      />
    );
  }

  if (fase === 'pronto' || !st) {
    return (
      <Pronto
        gioco={game.id}
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
      <Testa
        tacche={st.esiti.map((e) => (e === 'risolto' ? 'giusta' : e === 'saltato' ? 'saltata' : undefined))}
        corrente={st.indice}
        totale={totale}
        punteggio={st.punteggio}
        guadagno={st.chiuso === 'risolto' ? { punti: st.guadagno, chiave: st.indice } : undefined}
        onEsci={() => onEsci(false)}
      />

      <main className="flex flex-1 flex-col justify-center py-2">
        <View key={`${nPartita}-${st.indice}`} round={st.round} onTry={onTry} locked={st.chiuso !== null} sbagli={st.sbagliQui} risolto={st.chiuso !== null} />
      </main>

      {st.aiutiQui > 0 && st.chiuso === null && (
        <div className="mb-3 flex flex-col gap-2">
          {aiuti.slice(0, st.aiutiQui).map((a, i) => (
            <p key={i} className="animate-pop flex items-center gap-3 rounded-2xl bg-panna-50 px-3.5 py-2.5 leading-snug font-semibold text-inchiostro">
              <Oggetto nome="lampadina" className="h-9" />
              <span>{a}</span>
            </p>
          ))}
        </div>
      )}

      {st.chiuso !== null ? (
        <div className="animate-pop flex flex-col gap-3">
          <div
            className={`rounded-2xl px-4 py-3 bg-panna-50 text-inchiostro`}
          >
            <p className={`font-bold ${st.chiuso === 'risolto' ? 'text-oro-700' : 'text-inchiostro-chiaro'}`}>
              {st.chiuso === 'risolto' ? (st.sbagliQui === 0 && st.aiutiQui === 0 ? 'Perfetto!' : 'Risolto!') : 'La soluzione'}
            </p>
            <p className="mt-1 text-inchiostro">{game.soluzione(st.round)}</p>
          </div>
          <Bottone freccia onClick={avanti} className="mb-1.5 w-full">
            {st.indice + 1 < totale ? 'Avanti' : 'Fine'}
          </Bottone>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={aiuto}
            disabled={st.aiutiQui >= aiuti.length}
            className="titolo mb-1.5 flex flex-1 items-center justify-center gap-2 rounded-full bg-panna-50 py-2.5 text-lg font-bold text-inchiostro shadow-[0_5px_0_rgb(21_19_46/0.2)] transition-transform duration-100 active:translate-y-1 active:shadow-[0_1px_0_rgb(21_19_46/0.2)] disabled:opacity-55"
          >
            <Oggetto nome="lampadina" className="h-7" />
            Aiuto
            {aiuti.length > 0 && <span className="rounded-full bg-inchiostro/10 px-2 py-0.5 text-sm tabular-nums">{aiuti.length - st.aiutiQui}</span>}
          </button>
          <button onClick={salta} className="titolo mb-1.5 rounded-full bg-inchiostro/25 px-6 py-2.5 text-lg font-bold text-panna-50 active:scale-95">
            Salta
          </button>
        </div>
      )}
    </div>
  );
}
