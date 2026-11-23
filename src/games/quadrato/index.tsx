import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { menoMovimento } from '@/anim/orologio';
import { suona } from '@/audio/sfx';
import type { PuzzleGame, PuzzleViewProps } from '@/engine/cartuccia';
import { rngConSeme } from '@/engine/caso';
import { aiuti, corretta, genera, linee, soluzione, testoNumero, type RoundQuadrato } from './logica';

/** La risposta: la griglia intera, riga per riga (date comprese). */
export type Risposta = number[];

type Tessera = { id: number; n: number };
type Presa = { t: number; da: number | null; pid: number; x0: number; y0: number; gx: number; gy: number; mosso: boolean };

/** Il dito copre la tessera: la si tiene un po' più su. */
const SOPRA_IL_DITO = 34;

/**
 * Le tessere del vassoio: i numeri mancanti più qualche esca plausibile (±1, ±2 dai
 * mancanti), mescolate con un ordine che dipende solo dal quesito: stesso quesito,
 * stesso vassoio, a ogni render.
 */
function tessereDi(r: RoundQuadrato): Tessera[] {
  const mancanti = r.soluzione.filter((_, i) => !r.date[i]);
  const seme = r.soluzione.reduce((h, x, i) => (Math.imul(h, 31) + x * 7 + (r.date[i] ? 1 : 0) + i) | 0, 17);
  const rng = rngConSeme(seme);
  const mescola = <T,>(v: T[]): T[] => {
    const a = [...v];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  };
  const gia = new Set(mancanti);
  const candidate: number[] = [];
  for (const m of mescola(mancanti)) {
    for (const s of mescola([-2, -1, 1, 2])) {
      const v = m + s;
      if (gia.has(v) || candidate.includes(v) || (!r.negativi && v < 1)) continue;
      candidate.push(v);
    }
  }
  const esche = Math.max(2, Math.ceil(mancanti.length / 3));
  return mescola([...mancanti, ...mescola(candidate).slice(0, esche)]).map((n, id) => ({ id, n }));
}

function Vista({ round, onTry, locked, sbagli, risolto }: PuzzleViewProps<RoundQuadrato, Risposta>) {
  const { lato, date, soluzione: sol } = round;
  const vuote = useMemo(() => date.flatMap((data, i) => (data ? [] : [i])), [date]);
  const tessere = useMemo(() => tessereDi(round), [round]);
  /** Dove sta ogni tessera: l'indice della casella, o null se è nel vassoio. */
  const [pos, setPos] = useState<(number | null)[]>(() => tessere.map(() => null));
  const [presa, setPresa] = useState<Presa | null>(null);
  const [inviato, setInviato] = useState(false);
  const [errore, setErrore] = useState(false);
  const [acceseStato, setAccese] = useState(0);
  const [meno] = useState(menoMovimento);
  const radice = useRef<HTMLDivElement>(null);
  const celle = useRef<(HTMLDivElement | null)[]>([]);
  const visti = useRef(sbagli);
  const onTryRif = useRef(onTry);
  useEffect(() => {
    onTryRif.current = onTry;
  });

  const cella = lato === 3 ? 72 : 56;
  const spazio = lato === 3 ? 8 : 4;
  const piena = vuote.every((i) => pos.includes(i));
  const chiave = pos.join(',');
  const bloccato = locked || risolto || inviato;
  const lineeVere = useMemo(() => linee(lato).filter((l) => l.vera), [lato]);

  // La tessera che sta in una casella.
  const inCasella = (i: number): number | undefined => {
    const t = pos.indexOf(i);
    return t < 0 ? undefined : t;
  };

  // Tutte le caselle piene: dopo un attimo parte il controllo (la griglia come la vuole `corretta`).
  useEffect(() => {
    if (!piena || risolto || locked || inviato) return;
    const timer = window.setTimeout(() => {
      setInviato(true);
      suona('tap');
      onTryRif.current(sol.map((x, i) => (date[i] ? x : (tessere[pos.indexOf(i)]?.n ?? 0))));
    }, 380);
    return () => window.clearTimeout(timer);
    // `chiave` rappresenta `pos`: cambiare una tessera riavvia l'attesa.
  }, [piena, risolto, locked, inviato, chiave, sol, date, tessere, pos]);

  // Sbagliato: scossa (la fa il motore) e tornano tutte nel vassoio. Non si dice quali erano giuste.
  useEffect(() => {
    if (sbagli <= visti.current) return;
    visti.current = sbagli;
    setErrore(true);
    const timer = window.setTimeout(
      () => {
        setPos(tessere.map(() => null));
        setErrore(false);
        setInviato(false);
      },
      menoMovimento() ? 150 : 520,
    );
    return () => window.clearTimeout(timer);
  }, [sbagli, tessere]);

  // Risolto: righe, colonne e diagonali si accendono una dopo l'altra.
  useEffect(() => {
    if (!risolto || meno) return;
    const passo = lato === 3 ? 150 : 125;
    const giro = window.setInterval(() => {
      setAccese((a) => {
        if (a + 1 >= lineeVere.length) window.clearInterval(giro);
        return a + 1;
      });
    }, passo);
    return () => window.clearInterval(giro);
  }, [risolto, meno, lineeVere.length, lato]);
  const accese = risolto && meno ? lineeVere.length : acceseStato;
  const lit = useMemo(() => new Set(lineeVere.slice(0, accese).flatMap((l) => l.celle)), [lineeVere, accese]);

  // ── Il gesto ──
  const prendi = (t: number, da: number | null) => (e: PointerEvent<HTMLElement>) => {
    if (bloccato || presa) return;
    const c = radice.current?.getBoundingClientRect();
    if (!c) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    suona('tap');
    setPresa({ t, da, pid: e.pointerId, x0: e.clientX, y0: e.clientY, gx: e.clientX - c.left, gy: e.clientY - c.top - SOPRA_IL_DITO, mosso: false });
  };

  const muovi = (e: PointerEvent<HTMLElement>) => {
    if (!presa || presa.pid !== e.pointerId) return;
    const c = radice.current?.getBoundingClientRect();
    if (!c) return;
    const mosso = presa.mosso || Math.hypot(e.clientX - presa.x0, e.clientY - presa.y0) > 8;
    setPresa({ ...presa, mosso, gx: e.clientX - c.left, gy: e.clientY - c.top - SOPRA_IL_DITO });
  };

  /** La casella vuota (o piena, da scambiare) più vicina al punto, se abbastanza vicina. */
  const casellaSotto = (cx: number, cy: number): number | null => {
    let migliore: number | null = null;
    let dmin = cella * 0.8;
    for (const i of vuote) {
      const r = celle.current[i]?.getBoundingClientRect();
      if (!r) continue;
      const d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
      if (d < dmin) {
        dmin = d;
        migliore = i;
      }
    }
    return migliore;
  };

  const lascia = (e: PointerEvent<HTMLElement>) => {
    if (!presa || presa.pid !== e.pointerId) return;
    const { t, da, mosso } = presa;
    setPresa(null);
    let verso: number | null;
    if (!mosso) {
      // Un tocco: dalla casella torna nel vassoio; dal vassoio va alla prima casella libera.
      verso = da !== null ? null : (vuote.find((i) => !pos.includes(i)) ?? null);
    } else {
      verso = casellaSotto(e.clientX, e.clientY - SOPRA_IL_DITO);
    }
    if (verso === da) return;
    suona('tap', 0.2);
    setPos((p) => {
      const n = [...p];
      const altra = verso === null ? -1 : p.indexOf(verso);
      n[t] = verso;
      // La tessera che c'era sopra prende il posto che lasci (la casella di prima, o il vassoio).
      if (altra >= 0) n[altra] = da;
      return n;
    });
  };

  const testo = lato === 3 ? 'text-3xl' : 'text-2xl';
  const tesseraStile =
    'titolo flex items-center justify-center rounded-2xl border-2 border-oro-600 bg-oro-400 font-semibold text-inchiostro tabular-nums select-none';

  return (
    <div ref={radice} className="relative flex select-none flex-col gap-3">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm leading-5 text-panna-100/70">Righe, colonne e diagonali: stessa somma.</p>
        {round.sommaData && (
          <p className="rounded-full bg-oro-400/15 px-3 py-0.5 text-sm font-bold text-oro-300">
            Somma magica: <span className="tabular-nums">{testoNumero(round.somma)}</span>
          </p>
        )}
      </div>

      <div className="mx-auto grid" style={{ gridTemplateColumns: `repeat(${lato}, ${cella}px)`, gap: spazio }}>
        {sol.map((x, i) => {
          const base = `titolo flex items-center justify-center rounded-2xl font-semibold tabular-nums ${testo}`;
          const stile = { width: cella, height: cella };
          if (date[i]) {
            return (
              <div
                key={i}
                className={`${base} ${lit.has(i) ? 'bg-oro-400 text-inchiostro' : 'bg-panna-100 text-inchiostro'} shadow-[0_4px_0_var(--color-panna-200)] transition-colors duration-150`}
                style={stile}
              >
                {testoNumero(x)}
              </div>
            );
          }
          const t = inCasella(i);
          const tessera = t !== undefined ? tessere[t] : undefined;
          const mostrata = tessera?.n ?? (risolto ? x : undefined);
          const sopra = presa?.t === t && t !== undefined;
          return (
            <div
              key={i}
              ref={(el) => {
                celle.current[i] = el;
              }}
              className={[
                base,
                'border-2 transition-colors duration-150',
                lit.has(i)
                  ? 'border-oro-400 bg-oro-400 text-inchiostro'
                  : mostrata !== undefined
                    ? errore
                      ? 'border-pericolo-400 bg-pericolo-400/10'
                      : 'border-solid border-oro-600 bg-notte-950/40'
                    : 'border-dashed border-panna-100/35 bg-notte-950/20',
              ].join(' ')}
              style={stile}
            >
              {mostrata !== undefined && t !== undefined && !risolto ? (
                <div
                  role="button"
                  aria-label={`Riprendi il ${testoNumero(mostrata)}`}
                  onPointerDown={prendi(t, i)}
                  onPointerMove={muovi}
                  onPointerUp={lascia}
                  onPointerCancel={lascia}
                  className={`${tesseraStile} ${testo} touch-none`}
                  style={{ width: cella - 6, height: cella - 6, opacity: sopra ? 0.25 : 1, cursor: bloccato ? 'default' : 'grab' }}
                >
                  {testoNumero(mostrata)}
                </div>
              ) : mostrata !== undefined ? (
                <span className={lit.has(i) ? 'animate-pop' : 'text-oro-300'}>{testoNumero(mostrata)}</span>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Il vassoio: ogni tessera ha il suo posto, anche quando è in una casella (niente salti sotto il dito). */}
      <div
        className="mx-auto flex max-w-[19.5rem] flex-wrap items-center justify-center gap-1"
        style={{ opacity: risolto ? 0.3 : 1, transition: 'opacity 300ms' }}
      >
        {tessere.map((t) => {
          const fuori = pos[t.id] !== null;
          const inMano = presa?.t === t.id;
          return (
            <div
              key={t.id}
              role="button"
              aria-label={`Tessera ${testoNumero(t.n)}`}
              onPointerDown={fuori ? undefined : prendi(t.id, null)}
              onPointerMove={muovi}
              onPointerUp={lascia}
              onPointerCancel={lascia}
              className={`${tesseraStile} touch-none text-xl`}
              style={{
                width: 48,
                height: 44,
                visibility: fuori ? 'hidden' : 'visible',
                opacity: inMano ? 0.25 : 1,
                cursor: bloccato ? 'default' : 'grab',
              }}
            >
              {testoNumero(t.n)}
            </div>
          );
        })}
      </div>

      {presa && (
        <div
          aria-hidden
          className={`${tesseraStile} ${testo} pointer-events-none absolute z-50 shadow-[0_10px_22px_var(--color-notte-950)]`}
          style={{ left: presa.gx, top: presa.gy, width: 56, height: 52, transform: 'translate(-50%, -50%) scale(1.1)' }}
        >
          {testoNumero(tessere[presa.t]?.n ?? 0)}
        </div>
      )}
    </div>
  );
}

export const quadratoMagico: PuzzleGame<RoundQuadrato, Risposta> = {
  id: 'quadrato',
  mode: 'puzzle',
  title: 'Il Quadrato magico',
  hint: 'Righe, colonne e diagonali fanno la stessa somma: trascina le tessere nelle caselle vuote.',
  generate: genera,
  View: Vista,
  check: corretta,
  aiuti,
  soluzione,
  fluido: true,
};
