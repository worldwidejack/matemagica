import { useState } from 'react';
import { suona } from '@/audio/sfx';
import type { PuzzleGame, PuzzleViewProps } from '@/engine/cartuccia';
import { aiuti, genera, opera, soluzione, testoPasso, verifica, type Op, type Passo, type RoundBersaglio } from './logica';

type Tessera = { id: number; n: number; nuova?: boolean };
type Mossa = { tessere: Tessera[]; passi: Passo[] };

const OPS: Op[] = ['+', '−', '×', '÷'];

function Vista({ round, onTry, locked }: PuzzleViewProps<RoundBersaglio, Passo[]>) {
  const iniziali = (): Tessera[] => round.numeri.map((n, id) => ({ id, n }));
  const [tessere, setTessere] = useState<Tessera[]>(iniziali);
  const [passi, setPassi] = useState<Passo[]>([]);
  const [storia, setStoria] = useState<Mossa[]>([]);
  const [scelta, setScelta] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [avviso, setAvviso] = useState<string | null>(null);

  const tocca = (t: Tessera) => {
    if (locked) return;
    setAvviso(null);
    if (scelta === null || op === null) {
      suona('tap');
      setScelta(scelta === t.id ? null : t.id);
      return;
    }
    if (scelta === t.id) return;
    const a = tessere.find((x) => x.id === scelta);
    if (!a) return;
    const r = opera(a.n, op, t.n);
    if (r === null) {
      suona('sbagliato');
      setAvviso(op === '÷' ? 'La divisione deve venire esatta.' : 'Solo numeri interi positivi.');
      return;
    }
    suona('giusto', 0.2);
    const passo: Passo = { a: a.n, op, b: t.n, r };
    const nuovoId = Math.max(...tessere.map((x) => x.id)) + 1;
    const nuove = [...tessere.filter((x) => x.id !== a.id && x.id !== t.id), { id: nuovoId, n: r, nuova: true }];
    setStoria([...storia, { tessere, passi }]);
    setTessere(nuove);
    setPassi([...passi, passo]);
    setScelta(null);
    setOp(null);
    if (r === round.bersaglio) onTry([...passi, passo]);
  };

  const annulla = () => {
    const ultima = storia[storia.length - 1];
    if (!ultima || locked) return;
    suona('tap');
    setTessere(ultima.tessere);
    setPassi(ultima.passi);
    setStoria(storia.slice(0, -1));
    setScelta(null);
    setOp(null);
  };

  const ricomincia = () => {
    if (locked) return;
    suona('tap');
    setTessere(iniziali());
    setPassi([]);
    setStoria([]);
    setScelta(null);
    setOp(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-panna-100/60">Arriva a</p>
        <p className="text-7xl titolo font-semibold tabular-nums text-oro-400 drop-shadow-[0_0_18px_var(--color-oro-500)]">
          {round.bersaglio}
        </p>
      </div>

      <div className="flex min-h-20 flex-wrap justify-center gap-3">
        {tessere.map((t) => (
          <button
            key={t.id}
            onClick={() => tocca(t)}
            disabled={locked}
            className={[
              'h-20 min-w-20 rounded-2xl px-3 text-3xl titolo font-semibold tabular-nums active:scale-95',
              t.nuova ? 'animate-pop' : '',
              scelta === t.id
                ? 'bg-oro-400 text-inchiostro shadow-[0_0_20px_var(--color-oro-400)]'
                : t.n === round.bersaglio
                  ? 'bg-oro-400 text-inchiostro'
                  : 'bg-panna-100 text-inchiostro',
            ].join(' ')}
          >
            {t.n}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {OPS.map((o) => (
          <button
            key={o}
            onClick={() => {
              if (locked || scelta === null) return;
              suona('tap');
              setOp(op === o ? null : o);
            }}
            disabled={locked || scelta === null}
            className={[
              'rounded-2xl py-3 text-3xl font-bold active:scale-95 disabled:opacity-30',
              op === o ? 'bg-oro-400 text-inchiostro' : 'bg-panna-200 text-inchiostro',
            ].join(' ')}
          >
            {o}
          </button>
        ))}
      </div>

      <p className="h-5 text-center text-sm text-panna-100/55">
        {avviso ??
          (scelta === null ? 'Tocca un numero…' : op === null ? '…poi un’operazione…' : '…poi l’altro numero.')}
      </p>

      {passi.length > 0 && (
        <div className="flex flex-col items-center gap-1 text-panna-100/70 tabular-nums">
          {passi.map((p, i) => (
            <span key={i}>{testoPasso(p)}</span>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-3">
        <button onClick={annulla} disabled={locked || storia.length === 0} className="rounded-full bg-panna-100/15 px-4 py-2 text-panna-100 disabled:opacity-30">
          ↶ Annulla
        </button>
        <button onClick={ricomincia} disabled={locked || passi.length === 0} className="rounded-full bg-panna-100/15 px-4 py-2 text-panna-100 disabled:opacity-30">
          Ricomincia
        </button>
      </div>
    </div>
  );
}

export const numeroBersaglio: PuzzleGame<RoundBersaglio, Passo[]> = {
  id: 'bersaglio',
  mode: 'puzzle',
  title: 'Il Numero bersaglio',
  hint: 'Combina i numeri due alla volta con + − × ÷ fino ad arrivare al bersaglio. Non serve usarli tutti.',
  generate: genera,
  View: Vista,
  check: verifica,
  aiuti,
  soluzione,
};
