import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { menoMovimento } from '@/anim/orologio';
import type { PuzzleGame, PuzzleViewProps } from '@/engine/cartuccia';
import { suona } from '@/audio/sfx';
import { FORME, aiuti, genera, scriviNumero, soluzione, type Bilancia, type Piatto, type RoundBilancia } from './logica';

const controlla = (r: RoundBilancia, n: number) => n === r.pesi[r.chiesta];

/** Le pesiere: da 1, 2, 5, 10 (le risposte vanno da 1 a 15). Da d 7 anche i palloncini, che tirano su. */
const POSITIVI = [1, 2, 5, 10];
const PALLONCINI = [-1, -2, -5];
/** Quanti pesi stanno sul piatto: due righe da tre. */
const MAX_PESI = 6;
/** Il dito copre il peso: lo si tiene un po' più su. */
const SOPRA_IL_DITO = 30;

type Peso = { id: number; v: number };
type Presa = { da: 'vassoio' | 'piatto'; id: number | null; v: number; pid: number; x0: number; y0: number; gx: number; gy: number; mosso: boolean };

// ── Gli indizi: come prima ───────────────────────────────────────────────

/**
 * `compatta`: con più bilance e piatti pieni la schermata sforava i 375×812:
 * forme e piatti più bassi (ora anche con due bilance, perché sotto c'è la prova).
 */
function PiattoVista({ piatto, compatta }: { piatto: Piatto; compatta: boolean }) {
  const pezzi = piatto.forme.flatMap((n, i) => Array.from({ length: n }, (_, k) => ({ k: `${i}-${k}`, f: FORME[i] })));
  return (
    <div
      className={[
        'flex flex-1 flex-wrap items-end justify-center rounded-b-[2rem] border-b-4 border-panna-200 bg-panna-100/90 pt-1.5 pb-1',
        compatta ? 'min-h-11 gap-0.5 px-1.5' : 'min-h-16 gap-1.5 px-2 pt-2',
      ].join(' ')}
    >
      {pezzi.map((p) => (
        <span key={p.k} className={`${compatta ? 'text-[1.3rem]' : 'text-[1.9rem]'} leading-none`}>
          {p.f}
        </span>
      ))}
      {piatto.peso > 0 && (
        <span
          className={`rounded-lg bg-oro-500 font-black text-inchiostro tabular-nums ${compatta ? 'px-1.5 py-0.5 text-base' : 'px-2.5 py-1 text-xl'}`}
        >
          {piatto.peso}
        </span>
      )}
    </div>
  );
}

function BilanciaVista({ b, compatta }: { b: Bilancia; compatta: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full items-end gap-3">
        <PiattoVista piatto={b.sinistra} compatta={compatta} />
        <PiattoVista piatto={b.destra} compatta={compatta} />
      </div>
      <div className={`w-11/12 rounded-full bg-panna-200 ${compatta ? 'h-1' : 'h-1.5'}`} />
      <div
        className={`h-0 w-0 border-x-transparent border-b-panna-200 ${compatta ? 'border-x-[9px] border-b-[10px]' : 'border-x-[16px] border-b-[22px]'}`}
      />
    </div>
  );
}

// ── La prova: pesi da trascinare, fermo da sfilare ───────────────────────

/** Una pesiera: quadrata e di un colore per taglio; i palloncini sono tondi e lilla. */
function stilePeso(v: number): string {
  if (v < 0) return 'rounded-full border-lilla bg-lilla text-inchiostro';
  if (v === 1) return 'rounded-xl border-panna-200 bg-panna-100 text-inchiostro';
  if (v === 2) return 'rounded-xl border-pesca bg-pesca text-inchiostro';
  if (v === 5) return 'rounded-xl border-oro-600 bg-oro-400 text-inchiostro';
  return 'rounded-xl border-turchese-400 bg-turchese-300 text-inchiostro';
}

function Pesiera({ v, lato, fantasma }: { v: number; lato: number; fantasma?: boolean }) {
  return (
    <span
      className={['titolo flex items-center justify-center border-2 text-xl font-semibold tabular-nums select-none', stilePeso(v), fantasma ? 'shadow-[0_10px_22px_var(--color-notte-950)]' : ''].join(' ')}
      style={{ width: lato, height: lato }}
    >
      {scriviNumero(v)}
    </span>
  );
}

const SCOSSA_TRAVE: Keyframe[] = [0, 2.6, -2.6, 2, -1.6, 0.8, 0].map((g) => ({ transform: `rotate(${g}deg)` }));
const OSCILLA_TRAVE: Keyframe[] = [0, -7, 5, -3, 1.6, -0.6, 0].map((g) => ({ transform: `rotate(${g}deg)` }));

const MANOPOLA = 56;

function Vista({ round, onTry, locked, risolto }: PuzzleViewProps<RoundBilancia, number>) {
  const forma = FORME[round.chiesta];
  const compatta = round.bilance.length >= 2;
  const taglie = round.sottoZero ? [...POSITIVI, ...PALLONCINI] : POSITIVI;
  const lato = taglie.length > 4 ? 44 : 52;
  const vero = round.pesi[round.chiesta] ?? 0;

  const [piatto, setPiatto] = useState<Peso[]>([]);
  const [presa, setPresa] = useState<Presa | null>(null);
  const [prova, setProva] = useState(false);
  const [x, setX] = useState(0);
  const [trascina, setTrascina] = useState(false);
  const [avviso, setAvviso] = useState(false);
  const prossimo = useRef(1);
  const radice = useRef<HTMLDivElement>(null);
  const zona = useRef<HTMLDivElement>(null);
  const trave = useRef<HTMLDivElement>(null);
  const traccia = useRef<HTMLDivElement>(null);
  const inizioManopola = useRef(0);
  const timer = useRef<number[]>([]);
  const totale = piatto.reduce((s, p) => s + p.v, 0);

  useEffect(
    () => () => {
      timer.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );
  const dopo = (ms: number, f: () => void) => {
    timer.current.push(window.setTimeout(f, ms));
  };

  const bloccato = locked || risolto || prova;

  // ── Pesi ──
  const aggiungi = (v: number) => {
    setPiatto((p) => (p.length >= MAX_PESI ? p : [...p, { id: prossimo.current++, v }]));
  };
  const togli = (id: number) => setPiatto((p) => p.filter((q) => q.id !== id));

  const dentroIlPiatto = (cx: number, cy: number) => {
    const r = zona.current?.getBoundingClientRect();
    if (!r) return false;
    const m = 14;
    return cx > r.left - m && cx < r.right + m && cy > r.top - m && cy < r.bottom + m;
  };

  const prendi = (da: Presa['da'], v: number, id: number | null) => (e: PointerEvent<HTMLElement>) => {
    if (bloccato || presa) return;
    const c = radice.current?.getBoundingClientRect();
    if (!c) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setAvviso(false);
    suona('tap');
    setPresa({ da, id, v, pid: e.pointerId, x0: e.clientX, y0: e.clientY, gx: e.clientX - c.left, gy: e.clientY - c.top - SOPRA_IL_DITO, mosso: false });
  };

  const muovi = (e: PointerEvent<HTMLElement>) => {
    if (!presa || presa.pid !== e.pointerId) return;
    const c = radice.current?.getBoundingClientRect();
    if (!c) return;
    const mosso = presa.mosso || Math.hypot(e.clientX - presa.x0, e.clientY - presa.y0) > 8;
    setPresa({ ...presa, mosso, gx: e.clientX - c.left, gy: e.clientY - c.top - SOPRA_IL_DITO });
  };

  const lascia = (e: PointerEvent<HTMLElement>) => {
    if (!presa || presa.pid !== e.pointerId) return;
    const p = presa;
    setPresa(null);
    const dentro = dentroIlPiatto(e.clientX, e.clientY - SOPRA_IL_DITO);
    if (p.da === 'vassoio') {
      // Un tocco sul vassoio mette il peso sul piatto; trascinato conta dove lo lasci.
      if (!p.mosso || dentro) aggiungi(p.v);
    } else if (p.id !== null && (!p.mosso || !dentro)) {
      // Un tocco, o fuori dal piatto: il peso torna nel vassoio.
      togli(p.id);
    }
  };

  // ── Il fermo ──
  const maxX = () => (traccia.current?.clientWidth ?? 280) - MANOPOLA - 12;

  const giuManopola = (e: PointerEvent<HTMLDivElement>) => {
    if (bloccato) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    inizioManopola.current = e.clientX - x;
    setTrascina(true);
    setAvviso(false);
  };
  const muoviManopola = (e: PointerEvent<HTMLDivElement>) => {
    if (!trascina) return;
    setX(Math.max(0, Math.min(maxX(), e.clientX - inizioManopola.current)));
  };

  /** Solo ora la bilancia di prova si muove e il motore controlla. */
  const sfila = () => {
    if (piatto.length === 0) {
      // Un piatto vuoto non pesa mai quanto la forma: niente tentativo, il fermo torna.
      setX(0);
      setAvviso(true);
      return;
    }
    setX(maxX());
    setProva(true);
    suona('tap');
    const fermo = menoMovimento();
    if (controlla(round, totale)) {
      trave.current?.animate(OSCILLA_TRAVE, { duration: fermo ? 1 : 950, easing: 'ease-out' });
      dopo(fermo ? 250 : 980, () => onTry(totale));
    } else {
      // Sbagliato: sempre la stessa scossa, qualunque sia l'errore. Il fermo torna al suo posto.
      onTry(totale);
      trave.current?.animate(SCOSSA_TRAVE, { duration: fermo ? 1 : 460, easing: 'ease-in-out' });
      dopo(fermo ? 300 : 520, () => {
        setX(0);
        setProva(false);
      });
    }
  };

  const lasciaManopola = () => {
    if (!trascina) return;
    setTrascina(false);
    if (x < maxX() * 0.8) {
      setX(0);
      return;
    }
    sfila();
  };

  const aperto = risolto || prova;
  const mostrato = risolto && piatto.length === 0 ? vero : totale;

  return (
    <div ref={radice} className={`relative flex select-none flex-col ${compatta ? 'gap-2' : 'gap-3'}`}>
      {round.sottoZero ? (
        <p className="text-center text-sm leading-5 text-panna-100/80">
          🎈 Qui una forma può pesare <b className="font-black text-oro-400">meno di zero</b>: tira su.
        </p>
      ) : (
        <p className="text-center text-sm leading-5 text-panna-100/70">Tutte le bilance sono in equilibrio.</p>
      )}
      <div className={`flex flex-col ${compatta ? 'gap-1' : 'gap-1.5'}`}>
        {round.bilance.map((b, i) => (
          <BilanciaVista key={i} b={b} compatta={compatta} />
        ))}
      </div>

      {/* La bilancia di prova: ferma finché non si sfila il fermo. */}
      <div className="flex flex-col items-center border-t-2 border-dashed border-panna-100/20 pt-2">
        <div ref={trave} className="w-full" style={{ transformOrigin: '50% 100%' }}>
          <div className="flex w-full items-end gap-3">
            <div className="flex min-h-14 flex-1 flex-col items-center justify-end rounded-b-[2rem] border-b-4 border-panna-200 bg-panna-100/90 px-2 pt-1 pb-1">
              <span className="text-4xl leading-none">{forma}</span>
              <span className="text-xs font-black text-oro-700">quanto pesa?</span>
            </div>
            <div
              ref={zona}
              className={[
                'flex flex-1 flex-wrap content-end items-end justify-center gap-1 rounded-b-[2rem] border-b-4 px-1.5 pt-1 pb-1',
                piatto.length > 3 ? 'min-h-[6.5rem]' : 'min-h-14',
                piatto.length === 0 && !risolto ? 'border-dashed border-panna-100/50 bg-panna-100/20' : 'border-panna-200 bg-panna-100/90',
              ].join(' ')}
            >
              {piatto.length === 0 && risolto ? (
                <span className="titolo rounded-xl bg-oro-400 px-3 py-1 text-2xl font-semibold text-inchiostro tabular-nums">{scriviNumero(vero)}</span>
              ) : piatto.length === 0 ? (
                <span className="self-center pb-1 text-xs font-bold text-panna-100/60">metti i pesi qui</span>
              ) : (
                piatto.map((p) => (
                  <div
                    key={p.id}
                    role="button"
                    aria-label={`Togli il peso ${scriviNumero(p.v)}`}
                    onPointerDown={prendi('piatto', p.v, p.id)}
                    onPointerMove={muovi}
                    onPointerUp={lascia}
                    onPointerCancel={lascia}
                    className="touch-none"
                    style={{ opacity: presa?.id === p.id ? 0.25 : 1, cursor: bloccato ? 'default' : 'grab' }}
                  >
                    <Pesiera v={p.v} lato={44} />
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mx-auto h-1.5 w-11/12 rounded-full bg-panna-200" />
        </div>
        {/* Il fermo che tiene la trave: sparisce quando lo sfili. */}
        <div className="relative flex h-3.5 w-11/12 items-start justify-between px-[8%]" aria-hidden>
          {[0, 1].map((i) => (
            <span
              key={i}
              className="h-3.5 w-2 origin-top rounded-b bg-notte-600"
              style={{ transform: aperto ? 'scaleY(0)' : 'scaleY(1)', transition: 'transform 220ms ease-out' }}
            />
          ))}
          <div className="absolute top-0 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[9px] border-b-[12px] border-x-transparent border-b-panna-200" />
        </div>
      </div>

      <div className="flex items-stretch gap-2">
        <div className="flex w-20 flex-col items-center justify-center rounded-2xl bg-notte-950/50 py-1">
          <span className="text-[0.65rem] leading-3 font-bold tracking-wide text-panna-100/60 uppercase">sul piatto</span>
          <span className="titolo text-2xl leading-7 font-semibold text-oro-400 tabular-nums">{scriviNumero(mostrato)}</span>
        </div>
        <div ref={traccia} className="relative flex h-14 flex-1 items-center overflow-hidden rounded-full border-2 border-panna-100/25 bg-notte-950/50 p-1">
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 text-sm font-bold text-panna-100/60">
            {avviso ? 'Prima metti dei pesi' : aperto ? '' : 'Sfila il fermo ›››'}
          </span>
          <div
            role="button"
            aria-label="Sfila il fermo per provare"
            onPointerDown={giuManopola}
            onPointerMove={muoviManopola}
            onPointerUp={lasciaManopola}
            onPointerCancel={lasciaManopola}
            className="flex touch-none items-center justify-center rounded-full border-2 border-oro-600 bg-oro-400 text-2xl shadow-[0_3px_0_var(--color-oro-600)]"
            style={{
              width: MANOPOLA,
              height: MANOPOLA - 12,
              transform: `translateX(${x}px)`,
              marginLeft: risolto && x === 0 ? 'auto' : undefined,
              transition: trascina ? 'none' : 'transform 260ms cubic-bezier(.3,1.4,.5,1)',
              cursor: bloccato ? 'default' : 'grab',
              opacity: bloccato && !aperto ? 0.5 : 1,
            }}
          >
            {aperto ? '🔓' : '🔒'}
          </div>
        </div>
      </div>

      {/* Il vassoio: i pesi si ricreano all'infinito. */}
      <div className="flex flex-wrap items-center justify-center gap-1" style={{ opacity: bloccato ? 0.5 : 1 }}>
        {taglie.map((v) => (
          <div
            key={v}
            role="button"
            aria-label={`Peso ${scriviNumero(v)}`}
            onPointerDown={prendi('vassoio', v, null)}
            onPointerMove={muovi}
            onPointerUp={lascia}
            onPointerCancel={lascia}
            className="touch-none"
            style={{ cursor: bloccato ? 'default' : 'grab' }}
          >
            <Pesiera v={v} lato={lato} />
          </div>
        ))}
      </div>

      {presa && (
        <div aria-hidden className="pointer-events-none absolute z-50" style={{ left: presa.gx, top: presa.gy, transform: 'translate(-50%, -50%) scale(1.12)' }}>
          <Pesiera v={presa.v} lato={lato} fantasma />
        </div>
      )}
    </div>
  );
}

export const laBilancia: PuzzleGame<RoundBilancia, number> = {
  id: 'bilancia',
  mode: 'puzzle',
  title: 'La Bilancia',
  hint: 'Le bilance sono in equilibrio: metti i pesi sul piatto, poi sfila il fermo per provare.',
  generate: genera,
  View: Vista,
  check: controlla,
  aiuti,
  soluzione,
  fluido: true,
};
