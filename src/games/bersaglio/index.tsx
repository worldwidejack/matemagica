import { useRef, useState, type PointerEvent } from 'react';
import { suona } from '@/audio/sfx';
import type { PuzzleGame, PuzzleViewProps } from '@/engine/cartuccia';
import { aiuti, genera, opera, soluzione, testoPasso, verifica, type Op, type Passo, type RoundBersaglio } from './logica';

type Tessera = { id: number; n: number; nuova?: boolean };
type Mossa = { tessere: Tessera[]; passi: Passo[] };
type Punto = { x: number; y: number };

/** I quattro angoli del bersaglio: alto sinistra +, alto destra −, basso sinistra ×, basso destra ÷. */
const ANGOLI: { op: Op; dove: string }[] = [
  { op: '+', dove: 'rounded-tl-[28px]' },
  { op: '−', dove: 'rounded-tr-[28px]' },
  { op: '×', dove: 'rounded-bl-[28px]' },
  { op: '÷', dove: 'rounded-br-[28px]' },
];
/** Lato del quadrato delle operazioni che si apre sotto il numero bersaglio. */
const CROCE = 148;

/** − e ÷ si fanno sempre col più grande davanti: chi trascina non deve pensare all'ordine. */
function passoDi(a: number, op: Op, b: number): Passo | null {
  const [x, y] = op === '−' || op === '÷' ? [Math.max(a, b), Math.min(a, b)] : [a, b];
  const r = opera(x, op, y);
  return r === null ? null : { a: x, op, b: y, r };
}

/**
 * «Oltre la porta» (14/11): si trascina un numero sopra un altro. Sotto il dito si
 * apre un quadrato con le quattro operazioni negli angoli; dove lasci, i due numeri
 * si fondono nel risultato. Si va avanti a fondere fino al bersaglio.
 */
function Vista({ round, onTry, locked }: PuzzleViewProps<RoundBersaglio, Passo[]>) {
  const iniziali = (): Tessera[] => round.numeri.map((n, id) => ({ id, n }));
  const [tessere, setTessere] = useState<Tessera[]>(iniziali);
  const [passi, setPassi] = useState<Passo[]>([]);
  const [storia, setStoria] = useState<Mossa[]>([]);
  const [avviso, setAvviso] = useState<string | null>(null);
  const [presa, setPresa] = useState<{ id: number; d: Punto; su: number | null; op: Op | null; pid: number; centri: Map<number, Punto> } | null>(null);
  const tavolo = useRef<HTMLDivElement>(null);
  const el = useRef(new Map<number, HTMLDivElement>());
  const centri = useRef(new Map<number, Punto>());
  const inizio = useRef<Punto>({ x: 0, y: 0 });

  const giu = (t: Tessera) => (e: PointerEvent<HTMLDivElement>) => {
    if (locked || presa) return;
    const c = tavolo.current?.getBoundingClientRect();
    if (!c) return;
    centri.current.clear();
    el.current.forEach((x, id) => {
      const r = x.getBoundingClientRect();
      centri.current.set(id, { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 });
    });
    e.currentTarget.setPointerCapture(e.pointerId);
    inizio.current = { x: e.clientX, y: e.clientY };
    setPresa({ id: t.id, d: { x: 0, y: 0 }, su: null, op: null, pid: e.pointerId, centri: new Map(centri.current) });
    setAvviso(null);
    suona('tap');
  };

  const muovi = (e: PointerEvent<HTMLDivElement>) => {
    if (!presa || presa.pid !== e.pointerId) return;
    const d = { x: e.clientX - inizio.current.x, y: e.clientY - inizio.current.y };
    const mio = centri.current.get(presa.id);
    if (!mio) return;
    const dito = { x: mio.x + d.x, y: mio.y + d.y };
    // Il bersaglio più vicino; per lasciarlo bisogna allontanarsi di più (niente sfarfallio).
    let su = presa.su;
    const dSu = su !== null ? centri.current.get(su) : undefined;
    if (!dSu || Math.hypot(dSu.x - dito.x, dSu.y - dito.y) > CROCE * 0.62) {
      su = null;
      let dmin = 62;
      centri.current.forEach((q, id) => {
        if (id === presa.id) return;
        const dd = Math.hypot(q.x - dito.x, q.y - dito.y);
        if (dd < dmin) {
          dmin = dd;
          su = id;
        }
      });
    }
    let op: Op | null = null;
    const q = su !== null ? centri.current.get(su) : undefined;
    if (q) {
      const dx = dito.x - q.x;
      const dy = dito.y - q.y;
      if (Math.abs(dx) > 7 || Math.abs(dy) > 7) op = dy < 0 ? (dx < 0 ? '+' : '−') : dx < 0 ? '×' : '÷';
    }
    if (op !== presa.op && op !== null) suona('tap', 0.15);
    setPresa({ ...presa, d, su, op });
  };

  const su = (e: PointerEvent<HTMLDivElement>) => {
    if (!presa || presa.pid !== e.pointerId) return;
    const { id, su: bersaglio, op, d } = presa;
    setPresa(null);
    if (Math.hypot(d.x, d.y) < 8) {
      setAvviso('Trascina un numero sopra un altro');
      return;
    }
    const a = tessere.find((x) => x.id === id);
    const b = tessere.find((x) => x.id === bersaglio);
    if (!a || !b || op === null) {
      return;
    }
    const passo = passoDi(a.n, op, b.n);
    if (passo === null) {
      suona('sbagliato');
      setAvviso(op === '÷' ? 'La divisione deve venire esatta.' : 'Solo numeri interi positivi.');
      return;
    }
    suona('giusto', 0.2);
    const nuovoId = Math.max(...tessere.map((x) => x.id)) + 1;
    // Il risultato nasce al posto del numero su cui sei atterrato.
    const nuove = tessere
      .filter((x) => x.id !== a.id)
      .map((x) => (x.id === b.id ? { id: nuovoId, n: passo.r, nuova: true } : { ...x, nuova: false }));
    setStoria([...storia, { tessere, passi }]);
    setTessere(nuove);
    setPassi([...passi, passo]);
    if (passo.r === round.bersaglio) onTry([...passi, passo]);
  };

  const annulla = () => {
    const ultima = storia[storia.length - 1];
    if (!ultima || locked) return;
    suona('tap');
    setTessere(ultima.tessere);
    setPassi(ultima.passi);
    setStoria(storia.slice(0, -1));
  };

  const ricomincia = () => {
    if (locked) return;
    suona('tap');
    setTessere(iniziali());
    setPassi([]);
    setStoria([]);
  };

  const presaT = presa ? tessere.find((t) => t.id === presa.id) : undefined;
  const suT = presa?.su != null ? tessere.find((t) => t.id === presa.su) : undefined;
  const centroSu = presa?.su != null ? presa.centri.get(presa.su) : undefined;
  const anteprima = presaT && suT && presa?.op ? passoDi(presaT.n, presa.op, suT.n) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-panna-100/60">Arriva a</p>
        <p className="text-6xl titolo font-semibold tabular-nums text-oro-400 drop-shadow-[0_0_18px_var(--color-oro-500)]">
          {round.bersaglio}
        </p>
      </div>

      <div ref={tavolo} className="relative flex min-h-[176px] flex-wrap content-center justify-center gap-x-4 gap-y-5 py-2">
        {tessere.map((t) => {
          const mia = presa?.id === t.id;
          const sotto = presa?.su === t.id;
          return (
            <div
              key={t.id}
              ref={(x) => {
                if (x) el.current.set(t.id, x);
                else el.current.delete(t.id);
              }}
              onPointerDown={giu(t)}
              onPointerMove={muovi}
              onPointerUp={su}
              onPointerCancel={su}
              className={[
                'relative flex h-[72px] min-w-[72px] touch-none items-center justify-center rounded-2xl border-2 px-3 text-3xl titolo font-semibold tabular-nums select-none',
                t.nuova ? 'animate-pop' : '',
                mia
                  ? 'z-30 border-oro-600 bg-oro-400 text-inchiostro shadow-[0_10px_24px_var(--color-notte-950)]'
                  : sotto
                    ? 'z-10 border-oro-600 bg-panna-50 text-inchiostro'
                    : t.n === round.bersaglio
                      ? 'border-oro-600 bg-oro-400 text-inchiostro'
                      : 'border-panna-200 bg-panna-100 text-inchiostro shadow-[0_4px_0_var(--color-panna-200)]',
              ].join(' ')}
              style={{
                transform: mia && presa ? `translate(${presa.d.x}px, ${presa.d.y}px) scale(${presa.su !== null ? 0.62 : 1.06})` : undefined,
                transition: mia ? 'none' : 'transform 220ms cubic-bezier(.3,1.5,.5,1)',
                cursor: locked ? 'default' : 'grab',
              }}
            >
              {t.n}
            </div>
          );
        })}

        {centroSu && (
          <div
            aria-hidden
            className="nasce pointer-events-none absolute z-20 grid grid-cols-2 grid-rows-2 gap-1"
            style={{ left: centroSu.x, top: centroSu.y, width: CROCE, height: CROCE, transform: 'translate(-50%, -50%)' }}
          >
            {ANGOLI.map(({ op, dove }) => (
              <div
                key={op}
                className={[
                  'flex border-2 text-3xl font-black',
                  dove,
                  presa?.op === op
                    ? 'border-oro-600 bg-oro-400 text-inchiostro'
                    : 'border-panna-200/60 bg-notte-700/90 text-panna-100',
                  op === '+' || op === '−' ? 'items-start pt-2' : 'items-end pb-2',
                  op === '+' || op === '×' ? 'justify-start pl-3' : 'justify-end pr-3',
                ].join(' ')}
              >
                {op}
              </div>
            ))}
            <div className="absolute top-1/2 left-1/2 flex h-12 min-w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 border-oro-600 bg-panna-50 px-2 text-2xl titolo font-semibold text-inchiostro tabular-nums">
              {suT?.n}
            </div>
          </div>
        )}
      </div>

      <p className="h-5 text-center text-sm text-panna-100/70 tabular-nums">
        {anteprima
          ? `${anteprima.a} ${anteprima.op} ${anteprima.b}`
          : presa?.su != null
            ? 'Porta il dito su un angolo'
            : (avviso ?? (passi.length === 0 ? 'Trascina un numero sopra un altro' : ''))}
      </p>

      {passi.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-panna-100/70 tabular-nums">
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
  hint: 'Trascina un numero sopra un altro e scegli + − × ÷ nell’angolo: si fondono. Vai avanti fino ad arrivare al bersaglio. Non serve usarli tutti.',
  generate: genera,
  View: Vista,
  check: verifica,
  aiuti,
  soluzione,
  fluido: true,
};
