import { useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { menoMovimento } from '@/anim/orologio';
import { suona, vibra } from '@/audio/sfx';
import type { ArcadeGame, ArcadeViewProps } from '@/engine/cartuccia';
import { ANELLO, colpiBuoni, genera, giusta, spaccoMostrato, tempo, type RoundDivisori, type Spacco } from './logica';
import './stile.css';

/**
 * «I due divisori», il gesto: lo scalpello sull'anello.
 *
 * Il cristallo (il numero) sta al centro; tutt'intorno un anello di tacche numerate da 2
 * a 19. Il pollice prende lo scalpello sull'anello e lo fa girare fino a una tacca (si
 * mira), poi lo spinge verso il centro: arrivato al cristallo, colpisce. Se il numero
 * della tacca divide il cristallo, si spacca nei due pezzi (7 e 13); se no regge,
 * scheggia, e costa un errore. Lasciare prima di colpire non costa niente.
 * Lo scalpello non dice mai l'altro pezzo: il conto lo fa la testa.
 */

const LATO = 340;
const C = LATO / 2;
const R_CRISTALLO = 70;
const R_ANELLO = 142;
const R_TACCA = 17;
/** Sotto, fra il 19 e il 2, il posto dove lo scalpello riposa. */
const VUOTO = 40;
const PASSO = (360 - VUOTO) / ANELLO.length;
/** Sopra questo raggio si mira; sotto, la tacca è bloccata e lo scalpello avanza. */
const R_MIRA = 120;
/** Qui lo scalpello tocca il cristallo e colpisce. */
const R_COLPO = 78;
/** Strada minima verso il centro perché il colpo valga (niente colpi per sbaglio). */
const CORSA_MIN = 24;

const angoloTacca = (k: number) => (180 + VUOTO / 2 + PASSO * (k + 0.5)) % 360;
const rad = (g: number) => (g * Math.PI) / 180;
/** Angoli dall'alto in senso orario, come un orologio. */
const punto = (g: number, r: number) => ({ x: C + r * Math.sin(rad(g)), y: C - r * Math.cos(rad(g)) });

/** La tacca più vicina all'angolo, o null nel vuoto in basso. */
function taccaDa(g: number): number | null {
  const rel = (((g - 180 - VUOTO / 2) % 360) + 360) % 360;
  if (rel > 360 - VUOTO) return null;
  return Math.max(0, Math.min(ANELLO.length - 1, Math.floor(rel / PASSO)));
}

const ESAGONO = Array.from({ length: 6 }, (_, i) => punto(30 + i * 60, R_CRISTALLO));
const FACCE = ['var(--color-panna-50)', 'var(--color-panna-100)', 'var(--color-panna-200)', 'var(--color-pesca)', 'var(--color-panna-200)', 'var(--color-panna-100)'];

type Presa = { pid: number; rIn: number; spinta: boolean };

function Cristallo({ n }: { n: number }) {
  const cifre = String(n).length;
  return (
    <g>
      {ESAGONO.map((p, i) => {
        const q = ESAGONO[(i + 1) % 6]!;
        return <polygon key={i} points={`${C},${C} ${p.x},${p.y} ${q.x},${q.y}`} fill={FACCE[i]} />;
      })}
      <polygon points={ESAGONO.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--color-oro-600)" strokeWidth={3} strokeLinejoin="round" />
      <text x={C} y={C} textAnchor="middle" dominantBaseline="central" className="titolo" fontSize={cifre >= 4 ? 40 : 50} fill="var(--color-inchiostro)">
        {n}
      </text>
    </g>
  );
}

function Vista({ round, onAnswer, locked, given, correct }: ArcadeViewProps<RoundDivisori, Spacco>) {
  const { n } = round;
  const [tacca, setTacca] = useState<number | null>(null);
  /** Quanto lo scalpello è entrato: 0 sull'anello, 1 sul cristallo. */
  const [spinta, setSpinta] = useState(0);
  const [aiuto, setAiuto] = useState(false);
  const [meno] = useState(menoMovimento);
  const presa = useRef<Presa | null>(null);
  const taccaRef = useRef<number | null>(null);
  const colpito = useRef(false);
  // Gli stessi due fatti in uno stato, per il disegno (i ref non si leggono nel render).
  const [colpo, setColpo] = useState(false);
  const [tenuto, setTenuto] = useState(false);

  const feedback = correct !== null;
  const bloccato = locked || feedback || colpo;

  function svgDa(e: PointerEvent<SVGSVGElement>) {
    const b = e.currentTarget.getBoundingClientRect();
    const s = LATO / Math.max(1, b.width);
    const x = (e.clientX - b.left) * s - C;
    const y = (e.clientY - b.top) * s - C;
    const g = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
    return { r: Math.hypot(x, y), g };
  }

  function mira(g: number) {
    const k = taccaDa(g);
    if (k === null || k === taccaRef.current) return;
    taccaRef.current = k;
    setTacca(k);
    suona('tap', 0.2);
  }

  function giu(e: PointerEvent<SVGSVGElement>) {
    if (bloccato) return;
    const { r, g } = svgDa(e);
    if (r < R_CRISTALLO + 6) {
      setAiuto(true);
      return;
    }
    if (r < R_COLPO + 12) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    presa.current = { pid: e.pointerId, rIn: r, spinta: false };
    setTenuto(true);
    if (r >= R_MIRA) mira(g);
    suona('tap');
  }

  function muovi(e: PointerEvent<SVGSVGElement>) {
    const p = presa.current;
    if (!p || p.pid !== e.pointerId || bloccato) return;
    const { r, g } = svgDa(e);
    if (r >= R_MIRA) {
      p.spinta = false;
      p.rIn = Math.max(p.rIn, r);
      setSpinta(0);
      mira(g);
      return;
    }
    const k = taccaRef.current;
    if (k === null) return;
    p.spinta = true;
    setSpinta(Math.min(1, (R_MIRA - r) / (R_MIRA - R_COLPO)));
    if (r <= R_COLPO && p.rIn - r >= CORSA_MIN) {
      const a = ANELLO[k]!;
      colpito.current = true;
      presa.current = null;
      setColpo(true);
      setTenuto(false);
      setSpinta(1);
      vibra(25);
      onAnswer({ a, b: n / a });
    }
  }

  function su(e: PointerEvent<SVGSVGElement>) {
    if (presa.current?.pid !== e.pointerId) return;
    presa.current = null;
    setTenuto(false);
    if (!colpito.current) setSpinta(0);
  }

  // ── Disegno ──
  const g = tacca === null ? 180 : angoloTacca(tacca);
  const punta = 98 - 24 * spinta;
  const buoni = new Set(colpiBuoni(n));
  const spaccato = feedback && correct === true && given !== null;
  const rotto = feedback && !spaccato;
  const [p0, q0] = spaccoMostrato(n);
  const asse = feedback && given === null ? 180 : g;

  // Direzione perpendicolare alla crepa: lì volano le due metà.
  const px = Math.cos(rad(asse));
  const py = Math.sin(rad(asse));
  const meta = (verso: 1 | -1): CSSProperties =>
    ({ '--dx': `${verso * px * 26}px`, '--dy': `${verso * py * 26}px`, '--rot': `${verso * 6}deg` }) as CSSProperties;

  // La crepa a zigzag lungo l'asse dello scalpello, attraverso il centro.
  const crepa = [-1, -0.6, -0.25, 0.1, 0.45, 0.8, 1].map((t, i) => {
    const lungo = t * (R_CRISTALLO + 4);
    const lato = i % 2 === 0 ? 0 : i % 4 === 1 ? 7 : -7;
    const ux = Math.sin(rad(asse));
    const uy = -Math.cos(rad(asse));
    return `${C + ux * lungo + px * lato},${C + uy * lungo + py * lato}`;
  });

  let riga: string;
  if (spaccato && given) {
    const altri = [...buoni].filter((x) => x !== given.a && x !== given.b);
    riga = `${n} = ${given.a} × ${given.b}` + (altri.length ? ` · anche col ${altri.slice(0, 3).join(', ')}` : '');
  } else if (rotto) {
    riga = `${given === null ? 'Tempo!' : 'Regge!'} ${n} = ${p0} × ${q0}`;
  } else if (aiuto) {
    riga = 'Gira lo scalpello sull\'anello, poi spingilo dentro il cristallo';
  } else if (tacca !== null) {
    riga = `Scalpello sul ${ANELLO[tacca]}: spingi verso il centro`;
  } else {
    riga = 'Gira lo scalpello, poi colpisci verso il centro';
  }

  const s1 = punto(g, punta);
  const s2 = punto(g - 5, punta + 26);
  const s3 = punto(g + 5, punta + 26);
  const manico = [punto(g - 3.2, punta + 26), punto(g + 3.2, punta + 26), punto(g + 2.6, punta + 50), punto(g - 2.6, punta + 50)];
  const lameNascoste = feedback;

  return (
    <div className="flex w-full flex-col items-center gap-2 select-none">
      <p className="titolo text-center text-lg text-panna-100">Con quale numero si spacca?</p>
      <svg
        viewBox={`0 0 ${LATO} ${LATO}`}
        className="aspect-square w-full max-w-[340px] touch-none"
        style={{ touchAction: 'none' }}
        onPointerDown={giu}
        onPointerMove={muovi}
        onPointerUp={su}
        onPointerCancel={su}
        role="img"
        aria-label={`Il cristallo ${n}: scegli con lo scalpello un numero che lo divide`}
      >
        <defs>
          <clipPath id="divisori-destra">
            <rect x={C} y={-40} width={LATO} height={LATO + 80} transform={`rotate(${asse} ${C} ${C})`} />
          </clipPath>
          <clipPath id="divisori-sinistra">
            <rect x={C - LATO} y={-40} width={LATO} height={LATO + 80} transform={`rotate(${asse} ${C} ${C})`} />
          </clipPath>
        </defs>

        {/* L'anello delle tacche */}
        <circle cx={C} cy={C} r={R_ANELLO} fill="none" stroke="var(--color-notte-600)" strokeWidth={3} strokeDasharray="2 10" />
        {ANELLO.map((a, k) => {
          const p = punto(angoloTacca(k), R_ANELLO);
          const scelta = k === tacca;
          const brilla = rotto && buoni.has(a);
          return (
            <g key={a}>
              <circle
                cx={p.x}
                cy={p.y}
                r={R_TACCA}
                fill={brilla ? 'var(--color-oro-400)' : scelta ? 'var(--color-panna-100)' : 'var(--color-notte-800)'}
                stroke={brilla ? 'var(--color-oro-600)' : scelta ? 'var(--color-oro-400)' : 'var(--color-notte-600)'}
                strokeWidth={scelta || brilla ? 3 : 2}
              />
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="titolo"
                fontSize={15}
                fill={brilla || scelta ? 'var(--color-inchiostro)' : 'var(--color-panna-100)'}
              >
                {a}
              </text>
            </g>
          );
        })}

        {/* Il cristallo: intero, oppure le due metà che si separano */}
        {spaccato && !meno ? <circle cx={C} cy={C} r={R_CRISTALLO + 10} fill="var(--color-oro-300)" className="divisori-lampo" /> : null}
        {spaccato && given ? (
          <>
            <g clipPath="url(#divisori-destra)">
              <g className={meno ? 'divisori-meta divisori-ferma' : 'divisori-meta'} style={meta(1)}>
                <Cristallo n={n} />
              </g>
            </g>
            <g clipPath="url(#divisori-sinistra)">
              <g className={meno ? 'divisori-meta divisori-ferma' : 'divisori-meta'} style={meta(-1)}>
                <Cristallo n={n} />
              </g>
            </g>
            <polyline points={crepa.join(' ')} fill="none" stroke="var(--color-oro-600)" strokeWidth={3} pathLength={1} className="divisori-crepa divisori-sparisci" />
            {[given.a, given.b].map((v, i) => {
              const verso = i === 0 ? 1 : -1;
              return (
                <g key={i} className="divisori-etichetta" style={{ animationDelay: '0.25s' }}>
                  <circle cx={C + verso * px * 62} cy={C + verso * py * 62} r={28} fill="var(--color-oro-400)" stroke="var(--color-oro-600)" strokeWidth={3} />
                  <text x={C + verso * px * 62} y={C + verso * py * 62} textAnchor="middle" dominantBaseline="central" className="titolo" fontSize={String(v).length > 2 ? 20 : 26} fill="var(--color-inchiostro)">
                    {v}
                  </text>
                </g>
              );
            })}
          </>
        ) : (
          <g className={rotto && !meno ? 'divisori-regge' : ''}>
            <Cristallo n={n} />
            {rotto ? (
              <>
                <polyline
                  points={crepa.slice(0, 3).join(' ')}
                  fill="none"
                  stroke="var(--color-pericolo-400)"
                  strokeWidth={3}
                  pathLength={1}
                  className="divisori-crepa-corta"
                />
                {!meno && given !== null ? (
                  <polygon
                    points={[punto(asse - 8, R_CRISTALLO - 4), punto(asse + 8, R_CRISTALLO - 4), punto(asse, R_CRISTALLO + 6)].map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="var(--color-panna-200)"
                    className="divisori-scheggia"
                    style={{ '--sx': `${Math.sin(rad(asse)) * 60}px`, '--sy': `${-Math.cos(rad(asse)) * 60}px` } as CSSProperties}
                  />
                ) : null}
              </>
            ) : null}
          </g>
        )}

        {/* Lo scalpello */}
        {!lameNascoste && tacca !== null ? (
          <g style={{ transition: tenuto || meno ? 'none' : 'all 0.15s' }}>
            <polygon points={manico.map((p) => `${p.x},${p.y}`).join(' ')} fill="var(--color-tramonto)" stroke="var(--color-inchiostro)" strokeWidth={2} strokeLinejoin="round" />
            <polygon points={`${s1.x},${s1.y} ${s2.x},${s2.y} ${s3.x},${s3.y}`} fill="var(--color-azzurro)" stroke="var(--color-inchiostro)" strokeWidth={2} strokeLinejoin="round" />
          </g>
        ) : null}
        {!lameNascoste && tacca === null ? (
          <g opacity={0.9}>
            <polygon points={[punto(176, 118), punto(184, 118), punto(180, 96)].map((p) => `${p.x},${p.y}`).join(' ')} fill="var(--color-azzurro)" stroke="var(--color-inchiostro)" strokeWidth={2} />
            <polygon points={[punto(177.5, 118), punto(182.5, 118), punto(182, 140), punto(178, 140)].map((p) => `${p.x},${p.y}`).join(' ')} fill="var(--color-tramonto)" stroke="var(--color-inchiostro)" strokeWidth={2} />
          </g>
        ) : null}
      </svg>
      <p className={`min-h-[3rem] px-2 text-center text-base ${rotto ? 'text-pericolo-400' : spaccato ? 'text-oro-400' : 'text-panna-200'}`}>{riga}</p>
    </div>
  );
}

export const dueDivisori: ArcadeGame<RoundDivisori, Spacco> = {
  id: 'divisori',
  mode: 'arcade',
  title: 'I due divisori',
  hint: 'Gira lo scalpello sul numero che divide il cristallo, poi colpisci verso il centro: si spacca in due.',
  generate: genera,
  View: Vista,
  check: giusta,
  timeFor: (r, d) => tempo(d, r),
  roundPerPartita: 10,
  fluido: true,
  reazione: (ok) => (ok ? 950 : 1700),
};
