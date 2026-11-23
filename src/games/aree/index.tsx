import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { menoMovimento } from '@/anim/orologio';
import { suona, vibra } from '@/audio/sfx';
import type { PuzzleGame, PuzzleViewProps } from '@/engine/cartuccia';
import { aiuti, genera, giusta, MISURA_H, MISURA_W, misuraMostrata, passo, soluzione, testo, type Misura, type Punto, type RoundAree } from './logica';
import './stile.css';

/**
 * «Quanto è grande?», il gesto: il rettangolo elastico.
 *
 * Sopra, la figura sulla carta a quadretti. Sotto, sulla stessa carta, un rettangolo d'oro
 * ancorato all'angolo in basso a sinistra: lo si allarga e lo si alza tirando la maniglia
 * del suo angolo (scatta di quadretto in quadretto, o di mezzo da d = 5). Quando pensi che
 * sia grande quanto la figura, lo spingi su con il dito: vola sulla figura e il motore
 * controlla. Il rettangolo dice solo le sue misure (3 × 4 = 12), mai quella della figura.
 */

const U = 26;
const PAD = 14;
const COLONNE = MISURA_W;
const LARGO = PAD * 2 + COLONNE * U; // 340
const RIGHE_FIGURA = 6;
const Y_FIGURA = PAD;
const Y_MISURA = PAD + (RIGHE_FIGURA + 1) * U; // 196
const Y_BASE = Y_MISURA + MISURA_H * U; // 300
const ALTO = Y_BASE + PAD; // 314
/** Quanto va spinto su il rettangolo perché valga come risposta. */
const SPINTA = 64;
/** Raggio della maniglia: presa stretta e presa larga (fuori dal rettangolo). */
const PRESA_STRETTA = 16;
const PRESA_LARGA = 28;

type Presa = { pid: number; modo: 'tira' | 'spingi'; dx: number; dy: number; y0: number };

const fmt = (x: number) => testo(x);

function Vista({ round, onTry, locked, sbagli, risolto }: PuzzleViewProps<RoundAree, Misura>) {
  const s = passo(round.mezzi);
  const [mis, setMis] = useState<Misura>({ w: 2, h: 2 });
  const [su, setSu] = useState(0);
  const [volo, setVolo] = useState(false);
  const [tenuto, setTenuto] = useState<'tira' | 'spingi' | null>(null);
  const [errore, setErrore] = useState(false);
  const [mandata, setMandata] = useState<Misura | null>(null);
  const [meno] = useState(menoMovimento);
  const presa = useRef<Presa | null>(null);
  const misRif = useRef(mis);
  const visti = useRef(sbagli);
  const onTryRif = useRef(onTry);
  useEffect(() => {
    onTryRif.current = onTry;
    misRif.current = mis;
  });

  const bloccato = locked || risolto || volo;
  const vinta = risolto && mandata !== null && giusta(round, mandata);

  // Sbagliato: il motore scuote; il rettangolo torna giù con le stesse misure.
  useEffect(() => {
    if (sbagli <= visti.current) return;
    visti.current = sbagli;
    setErrore(true);
    const t = window.setTimeout(
      () => {
        setVolo(false);
        setSu(0);
      },
      menoMovimento() ? 150 : 500,
    );
    return () => window.clearTimeout(t);
  }, [sbagli]);

  // ── Geometria ──
  const ox = Math.floor((COLONNE - round.W) / 2);
  const oy = Math.floor((RIGHE_FIGURA - round.H) / 2);
  const X = (x: number) => PAD + (ox + x) * U;
  const Y = (y: number) => Y_FIGURA + (oy + round.H - y) * U;
  const tratto = (p: readonly Punto[]) => p.map(([x, y], i) => `${i ? 'L' : 'M'}${X(x)},${Y(y)}`).join(' ') + ' Z';

  function svgDa(e: PointerEvent<SVGSVGElement>) {
    const b = e.currentTarget.getBoundingClientRect();
    const k = LARGO / Math.max(1, b.width);
    return { x: (e.clientX - b.left) * k, y: (e.clientY - b.top) * k };
  }

  const angolo = (m: Misura) => ({ x: PAD + m.w * U, y: Y_BASE - m.h * U });

  function tira(x: number, y: number) {
    const w = Math.min(MISURA_W, Math.max(s, Math.round((x - PAD) / U / s) * s));
    const h = Math.min(MISURA_H, Math.max(s, Math.round((Y_BASE - y) / U / s) * s));
    const m = misRif.current;
    if (w === m.w && h === m.h) return;
    const nuova = { w, h };
    misRif.current = nuova;
    setMis(nuova);
    setErrore(false);
    suona('tap', 0.2);
  }

  function giu(e: PointerEvent<SVGSVGElement>) {
    if (bloccato) return;
    const { x, y } = svgDa(e);
    if (y < Y_MISURA - U / 2) return;
    const m = misRif.current;
    const a = angolo(m);
    const d = Math.hypot(x - a.x, y - a.y);
    const nelCorpo = x >= PAD - 10 && x <= a.x + 10 && y >= a.y - 10 && y <= Y_BASE + 10;
    let modo: Presa['modo'];
    let dx = 0;
    let dy = 0;
    if (d <= PRESA_STRETTA || (!nelCorpo && d <= PRESA_LARGA)) {
      modo = 'tira';
      dx = a.x - x;
      dy = a.y - y;
    } else if (nelCorpo) {
      modo = 'spingi';
    } else {
      modo = 'tira'; // sulla carta vuota: l'angolo salta sotto il dito
      tira(x, y);
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    presa.current = { pid: e.pointerId, modo, dx, dy, y0: y };
    setTenuto(modo);
    if (modo === 'spingi') suona('tap', 0.3);
  }

  function muovi(e: PointerEvent<SVGSVGElement>) {
    const p = presa.current;
    if (!p || p.pid !== e.pointerId || bloccato) return;
    const { x, y } = svgDa(e);
    if (p.modo === 'tira') {
      tira(x + p.dx, y + p.dy);
      return;
    }
    const alzato = Math.max(0, p.y0 - y);
    setSu(alzato);
    if (alzato >= SPINTA) {
      presa.current = null;
      setTenuto(null);
      setVolo(true);
      setErrore(false);
      const m = misRif.current;
      setMandata(m);
      vibra(20);
      suona('tap');
      window.setTimeout(() => onTryRif.current(m), menoMovimento() ? 0 : 260);
    }
  }

  function lascia(e: PointerEvent<SVGSVGElement>) {
    if (presa.current?.pid !== e.pointerId) return;
    presa.current = null;
    setTenuto(null);
    if (!volo) setSu(0);
  }

  // ── Disegno ──
  const area = mis.w * mis.h;
  const mostrata = risolto && !vinta ? misuraMostrata(round) : mis;
  const a = angolo(mostrata);
  // In volo il rettangolo sale fino a coprire la figura (centrato sulla sua zona).
  const centroFigura = Y_FIGURA + (oy + round.H / 2) * U;
  const centroMisura = Y_BASE - (mostrata.h * U) / 2;
  const salita = volo && !risolto ? centroMisura - centroFigura : risolto ? 0 : su;

  let riga: string;
  if (risolto) riga = vinta ? `Sì! ${fmt(round.area)} quadretti, come ${fmt(mis.w)} × ${fmt(mis.h)}` : `Erano ${fmt(round.area)} quadretti`;
  else if (volo) riga = `${fmt(mis.w)} × ${fmt(mis.h)} = ${fmt(area)}…`;
  else if (errore) riga = 'Non è grande uguale: riprova';
  else if (tenuto === 'tira') riga = `${fmt(mis.w)} × ${fmt(mis.h)} = ${fmt(area)}`;
  else if (tenuto === 'spingi') riga = 'Spingilo su, sulla figura';
  else riga = round.mezzi ? "Tira l'angolo (anche di mezzo quadretto), poi spingilo su" : "Tira l'angolo del rettangolo, poi spingilo sulla figura";

  const righeGriglia: ReactNode[] = [];
  for (let c = 0; c <= COLONNE; c++) {
    const x = PAD + c * U;
    righeGriglia.push(<line key={`v${c}`} x1={x} y1={Y_FIGURA} x2={x} y2={Y_FIGURA + RIGHE_FIGURA * U} />);
    righeGriglia.push(<line key={`w${c}`} x1={x} y1={Y_MISURA} x2={x} y2={Y_BASE} />);
  }
  for (let r = 0; r <= RIGHE_FIGURA; r++) righeGriglia.push(<line key={`h${r}`} x1={PAD} y1={Y_FIGURA + r * U} x2={LARGO - PAD} y2={Y_FIGURA + r * U} />);
  for (let r = 0; r <= MISURA_H; r++) righeGriglia.push(<line key={`k${r}`} x1={PAD} y1={Y_MISURA + r * U} x2={LARGO - PAD} y2={Y_MISURA + r * U} />);

  const figura = tratto(round.contorno) + (round.buco ? ' ' + tratto(round.buco) : '');
  const vertici = [...round.contorno, ...(round.buco ?? [])];
  const transizione = meno || tenuto ? 'none' : 'transform 0.26s var(--ease-rimbalzo), opacity 0.2s ease-out';

  return (
    <div className="flex w-full flex-col items-center gap-2 select-none">
      <p className="titolo text-center text-lg text-panna-100">Fai un rettangolo grande uguale</p>
      <svg
        viewBox={`0 0 ${LARGO} ${ALTO}`}
        className="w-full max-w-[340px] touch-none rounded-2xl"
        style={{ touchAction: 'none', aspectRatio: `${LARGO} / ${ALTO}`, background: 'var(--color-panna-50)' }}
        onPointerDown={giu}
        onPointerMove={muovi}
        onPointerUp={lascia}
        onPointerCancel={lascia}
        role="img"
        aria-label="Una figura sulla carta a quadretti e, sotto, un rettangolo da allargare fino a quando è grande uguale"
      >
        <g stroke="var(--color-azzurro)" strokeWidth={1}>
          {righeGriglia}
        </g>
        <line x1={PAD} y1={Y_MISURA - U / 2} x2={LARGO - PAD} y2={Y_MISURA - U / 2} stroke="var(--color-lilla)" strokeWidth={1.5} strokeDasharray="4 6" />

        {/* La figura */}
        <path d={figura} fill="var(--color-turchese-300)" fillRule="evenodd" stroke="var(--color-inchiostro)" strokeWidth={2.5} strokeLinejoin="round" />
        {vertici.map(([x, y], i) => (
          <circle key={i} cx={X(x)} cy={Y(y)} r={3} fill="var(--color-inchiostro)" />
        ))}

        {/* Risolto: il rettangolo che la contiene e i pezzi che avanzano */}
        {risolto && (
          <g className={meno ? undefined : 'aree-svela'}>
            <rect x={X(0)} y={Y(round.H)} width={round.W * U} height={round.H * U} fill="none" stroke="var(--color-oro-600)" strokeWidth={2} strokeDasharray="6 5" />
            {round.togli.map((p, i) => {
              const cx = p.poligono.reduce((t, q) => t + q[0], 0) / p.poligono.length;
              const cy = p.poligono.reduce((t, q) => t + q[1], 0) / p.poligono.length;
              return (
                <g key={i}>
                  <path d={tratto(p.poligono)} fill="var(--color-pericolo-400)" fillOpacity={0.35} stroke="var(--color-pericolo-600)" strokeWidth={1.5} strokeLinejoin="round" />
                  <text x={X(cx)} y={Y(cy)} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={800} fill="var(--color-inchiostro)">
                    {fmt(p.area)}
                  </text>
                </g>
              );
            })}
            <text x={X(round.W / 2)} y={Y(round.H / 2)} textAnchor="middle" dominantBaseline="central" className="titolo" fontSize={22} fill="var(--color-inchiostro)" stroke="var(--color-panna-50)" strokeWidth={4} paintOrder="stroke">
              {fmt(round.area)}
            </text>
          </g>
        )}

        {/* Il rettangolo-misura */}
        <g style={{ transform: `translateY(${-salita}px)`, transition: transizione, opacity: volo && !risolto ? 0.6 : 1 }}>
          <rect
            x={PAD}
            y={a.y}
            width={mostrata.w * U}
            height={mostrata.h * U}
            rx={3}
            fill={vinta ? 'var(--color-turchese-400)' : 'var(--color-oro-400)'}
            fillOpacity={risolto && !vinta ? 0.35 : 0.78}
            stroke={vinta ? 'var(--color-verde-scuro)' : 'var(--color-oro-600)'}
            strokeWidth={2.5}
            strokeDasharray={risolto && !vinta ? '6 5' : undefined}
          />
          {!risolto && (
            <g className={tenuto === 'tira' ? 'aree-maniglia-presa' : undefined}>
              <circle cx={a.x} cy={a.y} r={13} fill="var(--color-panna-50)" stroke="var(--color-oro-600)" strokeWidth={3} />
              <circle cx={a.x} cy={a.y} r={4} fill="var(--color-oro-600)" />
            </g>
          )}
          {!risolto && mostrata.w * U >= 40 && mostrata.h * U >= 24 && (
            <text x={PAD + (mostrata.w * U) / 2 - 6} y={Y_BASE - (mostrata.h * U) / 2} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={800} fill="var(--color-inchiostro)">
              {fmt(mostrata.w)} × {fmt(mostrata.h)}
            </text>
          )}
        </g>
      </svg>
      <p className={`min-h-6 text-center text-base ${errore && !risolto ? 'text-pericolo-400' : 'text-panna-100'}`} aria-live="polite">
        {riga}
      </p>
    </div>
  );
}

export const quantoGrande: PuzzleGame<RoundAree, Misura> = {
  id: 'aree',
  mode: 'puzzle',
  title: 'Quanto è grande?',
  hint: 'Costruisci sotto un rettangolo grande quanto la figura: il rettangolo che la contiene, meno quello che avanza.',
  generate: genera,
  View: Vista,
  check: giusta,
  aiuti,
  soluzione,
  roundPerPartita: 6,
  fluido: true,
};
