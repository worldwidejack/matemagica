import { useRef, useState, type PointerEvent } from 'react';
import { suona } from '@/audio/sfx';
import type { ArcadeGame, ArcadeViewProps } from '@/engine/cartuccia';
import { formano, genera, tempo, type RoundCoppie } from './logica';

const numero = (n: number) => <span className="text-3xl font-black text-oro-400">{n}</span>;

/** Il testo della regola sopra la griglia: cambia da una griglia all'altra. */
function Regola({ round }: { round: RoundCoppie }) {
  const n = numero(round.obiettivo);
  switch (round.tipo) {
    case 'somma':
      return (
        <>
          Unisci due numeri che <b className="text-oro-400">sommati</b> fanno {n}
        </>
      );
    case 'prodotto':
      return (
        <>
          Unisci due numeri che <b className="text-oro-400">moltiplicati</b> fanno {n}
        </>
      );
    case 'differenza':
      return (
        <>
          Unisci due numeri che <b className="text-oro-400">sottratti</b> fanno {n}
        </>
      );
    case 'multiplo':
      return (
        <>
          Unisci due numeri che <b className="text-oro-400">sommati</b> fanno un <b className="text-oro-400">multiplo di</b> {n}
        </>
      );
    case 'primi':
      return (
        <>
          Unisci due numeri <b className="text-oro-400">primi</b> che <b className="text-oro-400">sommati</b> fanno {n}
        </>
      );
  }
}

/** Una riga di aiuto sotto la regola, per le regole nuove. */
function nota(r: RoundCoppie): string | null {
  switch (r.tipo) {
    case 'differenza':
      return 'il più grande meno il più piccolo';
    case 'multiplo':
      return `${[1, 2, 3, 4, 5].map((k) => k * r.obiettivo).join(', ')}…`;
    case 'primi':
      return 'primo: si divide solo per 1 e per sé stesso · 1 non è primo';
    default:
      return null;
  }
}

type Fatto = 'fatto';
type Punto = { x: number; y: number };

/**
 * «Oltre la porta» (14/11): i numeri si uniscono tirando una linea col dito.
 * Si parte da un numero, si trascina, la linea si aggancia al numero più vicino;
 * si lascia: se la coppia è giusta la linea diventa d'oro e i due numeri scoppiano,
 * se è sbagliata la linea si spezza rossa e torna indietro. Si controlla al rilascio,
 * non all'aggancio: così si può passare sopra altri numeri senza sbagliare.
 */
function Vista({ round, onHit, onMiss, onAnswer, locked, correct }: ArcadeViewProps<RoundCoppie, Fatto>) {
  const campo = useRef<HTMLDivElement>(null);
  const gettoni = useRef(new Map<number, HTMLDivElement>());
  const centri = useRef(new Map<number, Punto>());
  const raggio = useRef(30);
  const [tiro, setTiro] = useState<{ da: number; dito: Punto; aggancio: number | null; id: number; centri: Map<number, Punto> } | null>(null);
  const [tolte, setTolte] = useState<Set<number>>(() => new Set());
  const [scoppiano, setScoppiano] = useState<Set<number>>(() => new Set());
  const [linee, setLinee] = useState<{ a: Punto; b: Punto; giusta: boolean; k: number }[]>([]);
  const [rosse, setRosse] = useState<{ ids: [number, number]; k: number } | null>(null);
  const [aiuto, setAiuto] = useState(false);
  const k = useRef(0);

  const misura = () => {
    const c = campo.current?.getBoundingClientRect();
    if (!c) return;
    centri.current.clear();
    gettoni.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      centri.current.set(id, { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 });
      raggio.current = r.width / 2;
    });
  };
  const qui = (e: PointerEvent<HTMLDivElement>): Punto => {
    const c = campo.current?.getBoundingClientRect();
    return { x: e.clientX - (c?.left ?? 0), y: e.clientY - (c?.top ?? 0) };
  };
  const vicino = (p: Punto, salta: number | null, entro: number): number | null => {
    let meglio: number | null = null;
    let dmin = entro;
    centri.current.forEach((q, id) => {
      if (id === salta || scoppiano.has(id)) return;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < dmin) {
        dmin = d;
        meglio = id;
      }
    });
    return meglio;
  };

  const giu = (e: PointerEvent<HTMLDivElement>) => {
    if (locked || tiro) return;
    misura();
    const p = qui(e);
    const da = vicino(p, null, raggio.current * 1.15);
    if (da === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setTiro({ da, dito: p, aggancio: null, id: e.pointerId, centri: new Map(centri.current) });
    setAiuto(false);
    suona('tap');
  };
  const muovi = (e: PointerEvent<HTMLDivElement>) => {
    if (!tiro || tiro.id !== e.pointerId) return;
    const p = qui(e);
    const aggancio = vicino(p, tiro.da, raggio.current * 1.05);
    if (aggancio !== null && aggancio !== tiro.aggancio) suona('tap', 0.2);
    setTiro({ ...tiro, dito: p, aggancio });
  };
  const su = (e: PointerEvent<HTMLDivElement>) => {
    if (!tiro || tiro.id !== e.pointerId) return;
    setTiro(null);
    const { da, aggancio } = tiro;
    if (aggancio === null) {
      // Un tocco senza linea: si spiega il gesto.
      const p0 = centri.current.get(da);
      if (p0 && Math.hypot(tiro.dito.x - p0.x, tiro.dito.y - p0.y) < raggio.current) setAiuto(true);
      return;
    }
    if (locked) return;
    const a = round.celle.find((c) => c.id === da);
    const b = round.celle.find((c) => c.id === aggancio);
    const pa = centri.current.get(da);
    const pb = centri.current.get(aggancio);
    if (!a || !b || !pa || !pb) return;
    const n = ++k.current;
    if (formano(round, a.n, b.n)) {
      setLinee((l) => [...l, { a: pa, b: pb, giusta: true, k: n }]);
      const ora = new Set(scoppiano).add(a.id).add(b.id);
      setScoppiano(ora);
      if (ora.size >= round.coppie * 2) onAnswer('fatto');
      else onHit();
      window.setTimeout(() => {
        setTolte((t) => new Set(t).add(a.id).add(b.id));
        setLinee((l) => l.filter((x) => x.k !== n));
      }, 420);
    } else {
      setLinee((l) => [...l, { a: pa, b: pb, giusta: false, k: n }]);
      setRosse({ ids: [a.id, b.id], k: n });
      onMiss();
      window.setTimeout(() => {
        setLinee((l) => l.filter((x) => x.k !== n));
        setRosse((r) => (r?.k === n ? null : r));
      }, 520);
    }
  };

  const colonne = round.celle.length > 9 ? 'grid-cols-4' : 'grid-cols-3';
  const pDa = tiro?.centri.get(tiro.da);
  const pA = tiro?.aggancio != null ? tiro.centri.get(tiro.aggancio) : tiro?.dito;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-center text-xl text-balance">
          <Regola round={round} />
        </p>
        {nota(round) && <p className="text-center text-sm text-balance text-panna-100/60">{nota(round)}</p>}
      </div>
      <div
        ref={campo}
        onPointerDown={giu}
        onPointerMove={muovi}
        onPointerUp={su}
        onPointerCancel={su}
        className={`relative mx-auto grid w-full ${colonne} touch-none gap-x-4 gap-y-3 px-1 select-none ${round.celle.length > 9 ? '' : 'max-w-[290px]'}`}
      >
        {round.celle.map((c) => {
          const via = tolte.has(c.id);
          const scoppia = scoppiano.has(c.id);
          const acceso = tiro && (tiro.da === c.id || tiro.aggancio === c.id);
          const errore = rosse?.ids.includes(c.id);
          return (
            <div
              key={c.id}
              ref={(el) => {
                if (el) gettoni.current.set(c.id, el);
                else gettoni.current.delete(c.id);
              }}
              className={[
                'relative z-10 flex aspect-square items-center justify-center rounded-full border-2 text-[clamp(1.3rem,6.5vw,2rem)] titolo font-semibold tabular-nums',
                via ? 'invisible' : scoppia ? 'scoppia' : '',
                scoppia || acceso
                  ? 'border-oro-600 bg-oro-400 text-inchiostro shadow-[0_0_18px_var(--color-oro-400)]'
                  : errore
                    ? 'border-pericolo-600 bg-pericolo-400 text-panna-50'
                    : 'border-panna-200 bg-panna-100 text-inchiostro shadow-[0_3px_0_var(--color-panna-200)]',
                correct === false && !via && !scoppia ? 'opacity-50' : '',
                'transition-[background-color,box-shadow] duration-100',
              ].join(' ')}
            >
              {c.n}
            </div>
          );
        })}
        <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible" aria-hidden>
          {linee.map((l) => (
            <line
              key={l.k}
              x1={l.a.x}
              y1={l.a.y}
              x2={l.b.x}
              y2={l.b.y}
              strokeLinecap="round"
              strokeWidth={l.giusta ? 9 : 7}
              stroke={l.giusta ? 'var(--color-oro-400)' : 'var(--color-pericolo-400)'}
              className={l.giusta ? 'animate-flash' : 'linea-via'}
              style={{ strokeDasharray: Math.hypot(l.b.x - l.a.x, l.b.y - l.a.y) }}
            />
          ))}
          {pDa && pA && (
            <line
              x1={pDa.x}
              y1={pDa.y}
              x2={pA.x}
              y2={pA.y}
              strokeLinecap="round"
              strokeWidth={tiro?.aggancio != null ? 9 : 6}
              stroke="var(--color-oro-300)"
              strokeDasharray={tiro?.aggancio != null ? undefined : '2 12'}
            />
          )}
        </svg>
      </div>
      <p className={`text-center text-sm ${aiuto ? 'font-bold text-oro-300' : 'text-panna-100/70'}`}>
        {aiuto
          ? 'Tieni il dito giù e tira una linea fino al compagno'
          : `${(round.coppie * 2 - scoppiano.size) / 2} coppie da trovare · ${
              round.tipo === 'multiplo' ? 'qualche numero resta da solo' : 'attento ai numeri senza compagno'
            }`}
      </p>
    </div>
  );
}

export const coppieMagiche: ArcadeGame<RoundCoppie, Fatto> = {
  id: 'coppie',
  mode: 'arcade',
  title: 'Coppie magiche',
  hint: 'Tira una linea col dito fra le coppie che rispettano la regola scritta sopra la griglia: può cambiare da una griglia all’altra. Occhio: alcuni numeri non hanno compagno.',
  generate: genera,
  View: Vista,
  check: () => true,
  timeFor: (r, d) => tempo(r, d),
  roundPerPartita: 5,
  fluido: true,
  reazione: (giusta) => (giusta ? 450 : 1100),
};
