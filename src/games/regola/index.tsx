import { useEffect, useRef, useState, type PointerEvent as PE } from 'react';
import type { PuzzleGame, PuzzleViewProps } from '@/engine/cartuccia';
import { ascolta, menoMovimento } from '@/anim/orologio';
import { suona } from '@/audio/sfx';
import { aiuti, genera, soluzione, type RoundRegola } from './logica';
import './stile.css';

type Punto = { x: number; y: number };
/** Una colonna del rullo: quante cifre (o segni) ha e quali. */
type Colonna = { m: number; simboli: string[] };
/** La maniglia presa col dito: dov'è a riposo, dov'è la casella, quanto si è mosso il dito. */
type Presa = { pid: number; ox: number; oy: number; home: Punto; casella: Punto; scala: number; dx: number; dy: number };
type Posata = { dx: number; dy: number; scala: number };
type Trascino = { i: number; pid: number; y0: number; p0: number; v: number; yUlt: number; tUlt: number };

/** Altezza di una cifra nel rullo, px. Se ne vedono tre. */
const RIGA = 40;
/** Entro quanti px (centro maniglia, centro casella) il rilascio mette il numero nella casella. */
const ACCETTA = 74;
/** Quanto resta il numero dentro la casella sbagliata prima di rimbalzare fuori, ms. */
const SOSTA = 650;

const CIFRE: Colonna = { m: 10, simboli: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] };
const SEGNO: Colonna = { m: 2, simboli: ['+', '−'] };

const mod = (a: number, m: number) => ((a % m) + m) % m;
const nCifre = (n: number) => String(Math.abs(n)).length;

function centro(el: Element): Punto {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Il numero scritto dal rullo: le cifre lette dall'alto, col segno se la colonna c'è. */
function valoreDi(pos: readonly number[], colonne: readonly Colonna[]): number {
  let segno = 1;
  let cifre = '';
  pos.forEach((p, i) => {
    const c = colonne[i]!;
    const d = mod(Math.round(p), c.m);
    if (c === SEGNO) segno = d === 1 ? -1 : 1;
    else cifre += String(d);
  });
  return segno * (Number(cifre) || 0);
}

const scrivi = (n: number) => (n < 0 ? `−${-n}` : String(n));

/**
 * «Oltre la porta» (21/11): il rullo del contachilometri. Una colonna per cifra, si fa
 * scorrere ognuna col dito (inerzia leggera, poi scatta sulla cifra). Il numero che
 * ne esce sta nella maniglia: si trascina dentro la casella vuota della sequenza.
 * Se è sbagliato rimbalza fuori e torna nel rullo; se è giusto la casella si accende
 * e un'onda passa lungo la sequenza. Il rullo non sa quale sia la risposta.
 */
function Vista({ round, onTry, locked, sbagli, risolto }: PuzzleViewProps<RoundRegola, number>) {
  const calmo = menoMovimento();
  const maxT = Math.max(...round.termini.map(nCifre));
  // Una colonna più del termine più grande: il numero di colonne non tradisce la risposta.
  const nC = Math.max(maxT + 1, nCifre(round.risposta));
  const negativo = round.termini.some((t) => t < 0) || round.risposta < 0;
  const colonne: Colonna[] = [...(negativo ? [SEGNO] : []), ...Array.from({ length: nC }, () => CIFRE)];

  const [pos, setPos] = useState<number[]>(() => colonne.map(() => 0));
  const anim = useRef({ pos: colonne.map(() => 0), bers: colonne.map((): number | null => null), drag: colonne.map(() => false) });
  const trascino = useRef<Trascino | null>(null);
  const ferma = useRef<(() => void) | null>(null);
  const ultimo = useRef(0);
  const sosta = useRef<number | null>(null);

  const [presa, setPresa] = useState<Presa | null>(null);
  const [posata, setPosata] = useState<Posata | null>(null);
  const posto = useRef<HTMLDivElement>(null);
  const maniglia = useRef<HTMLDivElement>(null);
  const casella = useRef<HTMLSpanElement>(null);

  useEffect(
    () => () => {
      ferma.current?.();
      if (sosta.current !== null) window.clearTimeout(sosta.current);
    },
    [],
  );

  const valore = valoreDi(pos, colonne);
  const chiusa = locked || risolto;

  // ── Il rullo ──
  const avvia = () => {
    if (ferma.current) return;
    ultimo.current = 0;
    ferma.current = ascolta((ora) => {
      const dt = ultimo.current === 0 ? 16 : Math.min(50, ora - ultimo.current);
      ultimo.current = ora;
      const a = anim.current;
      let vivo = false;
      a.pos.forEach((p, i) => {
        const b = a.bers[i];
        if (a.drag[i] || b === null || b === undefined) return;
        const prima = Math.round(p);
        const nuova = p + (b - p) * (1 - Math.exp(-dt / 70));
        if (Math.abs(b - nuova) < 0.003) {
          a.pos[i] = b;
          a.bers[i] = null;
        } else {
          a.pos[i] = nuova;
          vivo = true;
        }
        if (Math.round(a.pos[i]!) !== prima) suona('tap', 0.05);
      });
      setPos([...a.pos]);
      if (!vivo) {
        ferma.current?.();
        ferma.current = null;
      }
    });
  };

  const giuColonna = (i: number) => (e: PE<HTMLDivElement>) => {
    if (chiusa || posata || presa || trascino.current) return;
    const a = anim.current;
    e.currentTarget.setPointerCapture(e.pointerId);
    a.drag[i] = true;
    a.bers[i] = null;
    trascino.current = { i, pid: e.pointerId, y0: e.clientY, p0: a.pos[i]!, v: 0, yUlt: e.clientY, tUlt: e.timeStamp };
  };
  const muoviColonna = (e: PE<HTMLDivElement>) => {
    const t = trascino.current;
    if (!t || t.pid !== e.pointerId) return;
    const a = anim.current;
    const ora = e.timeStamp;
    const prima = Math.round(a.pos[t.i]!);
    // Dito in su = la colonna sale = cifre più alte.
    a.pos[t.i] = t.p0 - (e.clientY - t.y0) / RIGA;
    const dt = ora - t.tUlt;
    if (dt > 0) {
      t.v = 0.5 * t.v + 0.5 * (-(e.clientY - t.yUlt) / RIGA / dt);
      t.yUlt = e.clientY;
      t.tUlt = ora;
    }
    if (Math.round(a.pos[t.i]!) !== prima) suona('tap', 0.05);
    setPos([...a.pos]);
  };
  const suColonna = (e: PE<HTMLDivElement>) => {
    const t = trascino.current;
    if (!t || t.pid !== e.pointerId) return;
    trascino.current = null;
    const a = anim.current;
    a.drag[t.i] = false;
    // Dito fermo prima di lasciare: niente lancio. Altrimenti l'inerzia porta qualche cifra più in là.
    const lancio = e.timeStamp - t.tUlt > 90 || calmo ? 0 : Math.max(-6, Math.min(6, t.v * 160));
    a.bers[t.i] = Math.round(a.pos[t.i]! + lancio);
    if (calmo) {
      a.pos[t.i] = a.bers[t.i]!;
      a.bers[t.i] = null;
      setPos([...a.pos]);
    } else avvia();
  };

  // ── La maniglia ──
  const giuManiglia = (e: PE<HTMLDivElement>) => {
    if (chiusa || posata || presa || !posto.current || !casella.current || !maniglia.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const w = maniglia.current.getBoundingClientRect().width;
    const scala = Math.max(0.6, Math.min(1, casella.current.getBoundingClientRect().width / w));
    setPresa({ pid: e.pointerId, ox: e.clientX, oy: e.clientY, home: centro(posto.current), casella: centro(casella.current), scala, dx: 0, dy: 0 });
    suona('tap');
  };
  const muoviManiglia = (e: PE<HTMLDivElement>) => {
    if (!presa || presa.pid !== e.pointerId) return;
    setPresa({ ...presa, dx: e.clientX - presa.ox, dy: e.clientY - presa.oy });
  };
  const suManiglia = (e: PE<HTMLDivElement>) => {
    if (!presa || presa.pid !== e.pointerId) return;
    const p = presa;
    setPresa(null);
    const d = Math.hypot(p.casella.x - (p.home.x + p.dx), p.casella.y - (p.home.y + p.dy));
    if (d >= ACCETTA) return; // lasciata lontano: torna nel rullo
    setPosata({ dx: p.casella.x - p.home.x, dy: p.casella.y - p.home.y, scala: p.scala });
    // Se è sbagliato il numero resta un attimo nella casella, poi rimbalza fuori.
    sosta.current = window.setTimeout(() => setPosata(null), SOSTA);
    onTry(valore);
  };
  const annullaManiglia = (e: PE<HTMLDivElement>) => {
    if (presa && presa.pid === e.pointerId) setPresa(null);
  };

  const vicino = presa
    ? Math.hypot(presa.casella.x - (presa.home.x + presa.dx), presa.casella.y - (presa.home.y + presa.dy)) < ACCETTA
    : false;
  const sposta = posata ?? (presa ? { dx: presa.dx, dy: presa.dy, scala: 1.06 } : null);

  const corpoBox = maxT <= 2 ? 'text-2xl' : maxT <= 3 ? 'text-xl' : 'text-lg';
  const n = round.termini.length + 1;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-panna-100/60">Gira il rullo, poi porta il numero nella casella</p>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {round.termini.map((t, i) => (
          <span
            key={i}
            className={`rounded-2xl bg-panna-100 px-2.5 py-2.5 text-center ${corpoBox} min-w-[44px] titolo font-semibold tabular-nums text-inchiostro ${risolto ? 'regola-onda' : ''}`}
            style={risolto ? { animationDelay: `${i * 70}ms` } : undefined}
          >
            {t}
          </span>
        ))}
        <span key={sbagli} className={sbagli > 0 && !risolto ? 'regola-scossa' : ''}>
          <span
            ref={casella}
            className={`block min-w-[44px] rounded-2xl border-2 px-2.5 py-2.5 text-center ${corpoBox} titolo font-semibold tabular-nums transition-colors duration-150 ${
              risolto
                ? 'regola-onda border-oro-400 bg-oro-400/15 text-oro-400'
                : vicino
                  ? 'border-oro-400 bg-oro-400/20 text-oro-400'
                  : 'border-dashed border-oro-500/60 text-oro-400/60'
            }`}
            style={risolto ? { animationDelay: `${(n - 1) * 70}ms` } : undefined}
          >
            {risolto ? round.risposta : '?'}
          </span>
        </span>
      </div>

      {/* La maniglia: il numero che il rullo sta scrivendo. Si trascina nella casella. */}
      <div ref={posto} className="flex h-[52px] items-center justify-center" style={{ zIndex: sposta ? 40 : undefined, position: 'relative' }}>
        <div
          ref={maniglia}
          onPointerDown={giuManiglia}
          onPointerMove={muoviManiglia}
          onPointerUp={suManiglia}
          onPointerCancel={annullaManiglia}
          className={`flex h-[48px] min-w-[104px] touch-none items-center justify-center gap-2 rounded-full border-2 px-5 text-2xl titolo font-semibold tabular-nums select-none ${
            presa || posata
              ? 'border-oro-600 bg-oro-400 text-inchiostro shadow-[0_10px_22px_var(--color-notte-950)]'
              : 'border-oro-600/60 bg-oro-400 text-inchiostro shadow-[0_5px_0_var(--color-oro-600)]'
          }`}
          style={{
            transform: sposta ? `translate(${sposta.dx}px, ${sposta.dy}px) scale(${sposta.scala})` : undefined,
            transition: presa ? 'none' : calmo ? 'transform 120ms linear' : posata ? 'transform 160ms ease-out' : 'transform 520ms cubic-bezier(.3,1.7,.5,1)',
            opacity: risolto ? 0 : 1,
            cursor: chiusa ? 'default' : 'grab',
          }}
          aria-label={`Numero ${scrivi(valore)}: trascinalo nella casella`}
        >
          <span aria-hidden className={`text-base ${presa || posata || calmo ? '' : 'animate-respiro'}`}>
            ▲
          </span>
          {scrivi(valore)}
        </div>
      </div>

      {/* Il rullo: una colonna per cifra. */}
      <div className={`flex justify-center gap-1.5 transition-opacity duration-300 ${risolto ? 'pointer-events-none opacity-40' : ''}`}>
        {colonne.map((c, i) => {
          const p = pos[i] ?? 0;
          const base = Math.round(p);
          return (
            <div
              key={i}
              onPointerDown={giuColonna(i)}
              onPointerMove={muoviColonna}
              onPointerUp={suColonna}
              onPointerCancel={suColonna}
              className={`relative max-w-[46px] min-w-0 flex-1 touch-none overflow-hidden rounded-xl select-none ${c === SEGNO ? 'bg-panna-200' : 'bg-panna-100'}`}
              style={{ height: 3 * RIGA, cursor: chiusa ? 'default' : 'ns-resize' }}
              role="slider"
              aria-label={c === SEGNO ? 'Segno' : `Cifra ${i + 1}`}
              aria-valuenow={mod(base, c.m)}
              aria-valuemin={0}
              aria-valuemax={c.m - 1}
            >
              {[-2, -1, 0, 1, 2].map((k) => {
                const idx = base + k;
                const y = (idx - p) * RIGA;
                return (
                  <span
                    key={idx}
                    className="absolute inset-x-0 flex items-center justify-center text-2xl titolo font-semibold tabular-nums text-inchiostro"
                    style={{
                      top: RIGA,
                      height: RIGA,
                      transform: `translateY(${y}px)`,
                      opacity: Math.max(0, 1 - Math.abs(idx - p) * 0.55),
                    }}
                  >
                    {c.simboli[mod(idx, c.m)]}
                  </span>
                );
              })}
              <div aria-hidden className="pointer-events-none absolute inset-x-0 border-y-2 border-oro-500/70" style={{ top: RIGA, height: RIGA }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const trovaLaRegola: PuzzleGame<RoundRegola, number> = {
  id: 'regola',
  mode: 'puzzle',
  title: 'Trova la regola',
  hint: 'Ogni sequenza nasconde una regola. Scoprila, scrivi il numero sul rullo e portalo nella casella vuota.',
  generate: genera,
  View: Vista,
  check: (r, n) => n === r.risposta,
  aiuti,
  soluzione,
  fluido: true,
};
