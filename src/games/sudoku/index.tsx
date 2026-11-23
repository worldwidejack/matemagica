import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { menoMovimento } from '@/anim/orologio';
import { suona, vibra } from '@/audio/sfx';
import type { PuzzleGame, PuzzleViewProps } from '@/engine/cartuccia';
import { aiuti, colonna, conflitti, corretta, genera, riga, soluzione, unitaDi, type RoundSudoku, type Unita } from './logica';
import './stile.css';

/**
 * «Mini sudoku», il gesto: la corolla.
 *
 * Si preme una casella vuota e attorno al dito si apre una corolla coi numeri (1-4 o 1-6,
 * l'1 in alto, poi in senso orario). Si scorre verso un petalo e si lascia: il numero resta
 * nella casella. Basta la direzione: non serve arrivare sul petalo. Un tocco breve su una
 * casella vuota lascia la corolla aperta (si tocca il numero); su una casella già riempita
 * la svuota. Nessun controllo mentre si riempie: a griglia piena, dopo 400 ms, si prova.
 */

/** La risposta: la griglia intera, riga per riga (indizi compresi). */
export type Risposta = number[];

const MISURE = {
  4: { cella: 64, g: 4, G: 12, testo: 'text-3xl' },
  6: { cella: 52, g: 3, G: 9, testo: 'text-2xl' },
} as const;
const PETALO = 48;
/** Distanza minima dall'inizio perché la corolla legga una direzione. */
const MOSSO = 10;

type Aperta = {
  cella: number;
  /** Centro della corolla: nello schermo (per il gesto) e dentro la vista (per il disegno). */
  vx: number;
  vy: number;
  x: number;
  y: number;
  x0: number;
  y0: number;
  pid: number;
  scelto: number | null;
  mosso: boolean;
  /** Dopo un tocco breve: resta aperta e si tocca il numero. */
  ferma: boolean;
};

type Errore = ReturnType<typeof conflitti>;

function Vista({ round, onTry, locked, sbagli, risolto }: PuzzleViewProps<RoundSudoku, Risposta>) {
  const { n, date, soluzione: sol, segni } = round;
  const m = MISURE[n];
  const anello = n === 6 ? 62 : 56;
  const esteso = anello + PETALO / 2 + 6;

  const [valori, setValori] = useState<number[]>(() => sol.map((x, i) => (date[i] ? x : 0)));
  const [aperta, setAperta] = useState<Aperta | null>(null);
  const [errore, setErrore] = useState<Errore | null>(null);
  const [luce, setLuce] = useState(0);
  const [toccato, setToccato] = useState(false);
  const [meno] = useState(menoMovimento);
  const radice = useRef<HTMLDivElement>(null);
  const griglia = useRef<HTMLDivElement>(null);
  const corolla = useRef<HTMLDivElement>(null);
  const inviata = useRef('');
  const visti = useRef(sbagli);
  const valoriRif = useRef(valori);
  const onTryRif = useRef(onTry);
  useEffect(() => {
    onTryRif.current = onTry;
    valoriRif.current = valori;
  });

  const bloccato = locked || risolto;
  const piena = valori.every((x) => x > 0);
  const chiave = valori.join('');
  const giusta = risolto && corretta(round, valori);
  const unita = useMemo(() => unitaDi(round), [round]);

  // ── Geometria: tutto a coordinate nostre, così caselle, segni e cornici combaciano ──
  const pos = (k: number, lato: number) => k * (m.cella + m.g) + Math.floor(k / lato) * (m.G - m.g);
  const xDi = (i: number) => pos(colonna(round, i), round.rw);
  const yDi = (i: number) => pos(riga(round, i), round.rh);
  const largo = pos(n - 1, round.rw) + m.cella;
  const alto = pos(n - 1, round.rh) + m.cella;
  const cornice = (celle: number[], pad: number) => {
    const xs = celle.map(xDi);
    const ys = celle.map(yDi);
    const x = Math.min(...xs) - pad;
    const y = Math.min(...ys) - pad;
    return { left: x, top: y, width: Math.max(...xs) + m.cella + pad - x, height: Math.max(...ys) + m.cella + pad - y };
  };

  // Griglia piena: dopo un attimo si prova (una volta per ogni griglia diversa).
  useEffect(() => {
    if (!piena || bloccato || aperta || chiave === inviata.current) return;
    const t = window.setTimeout(() => {
      inviata.current = chiave;
      suona('tap');
      onTryRif.current([...valoriRif.current]);
    }, 400);
    return () => window.clearTimeout(t);
  }, [piena, bloccato, aperta, chiave]);

  // Sbagliato: righe, colonne e riquadri in conflitto tremano e si vedono per 0,6 s. I numeri restano.
  useEffect(() => {
    if (sbagli <= visti.current) return;
    visti.current = sbagli;
    setErrore(conflitti(round, valoriRif.current));
    const t = window.setTimeout(() => setErrore(null), 600);
    return () => window.clearTimeout(t);
  }, [sbagli, round]);

  // Risolto: righe, poi colonne, poi riquadri si accendono in cascata.
  useEffect(() => {
    if (!giusta || meno) return;
    const passo = n === 6 ? 55 : 80;
    const giro = window.setInterval(() => {
      setLuce((l) => {
        if (l + 1 > unita.length) window.clearInterval(giro);
        return l + 1;
      });
    }, passo);
    return () => window.clearInterval(giro);
  }, [giusta, meno, n, unita.length]);
  const accese = giusta ? (meno ? unita.length : Math.min(luce, unita.length)) : 0;
  const lampo: Unita | undefined = giusta && !meno && luce >= 1 && luce <= unita.length ? unita[luce - 1] : undefined;
  const lit = useMemo(() => new Set(unita.slice(0, accese).flatMap((u) => u.celle)), [unita, accese]);

  // Corolla ferma: un tocco fuori la chiude.
  const ferma = aperta?.ferma ?? false;
  useEffect(() => {
    if (!ferma) return;
    const fuori = (e: globalThis.PointerEvent) => {
      if (corolla.current && e.target instanceof Node && corolla.current.contains(e.target)) return;
      setAperta(null);
    };
    document.addEventListener('pointerdown', fuori, true);
    return () => document.removeEventListener('pointerdown', fuori, true);
  }, [ferma]);

  // ── Il gesto ──
  function cellaDa(e: PointerEvent<HTMLElement>): number {
    const b = griglia.current?.getBoundingClientRect();
    if (!b) return -1;
    const px = e.clientX - b.left;
    const py = e.clientY - b.top;
    let migliore = -1;
    let dmin = m.cella / 2 + m.G;
    for (let i = 0; i < n * n; i++) {
      const d = Math.max(Math.abs(xDi(i) + m.cella / 2 - px), Math.abs(yDi(i) + m.cella / 2 - py));
      if (d < dmin) {
        dmin = d;
        migliore = i;
      }
    }
    return migliore;
  }

  function petaloDa(a: Aperta, cx: number, cy: number): number | null {
    const dx = cx - a.vx;
    const dy = cy - a.vy;
    if (Math.hypot(dx, dy) < anello * 0.5) return null;
    const g = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    return ((Math.round(g / (360 / n)) % n) + n) % n;
  }

  function metti(i: number, x: number) {
    setValori((v) => {
      if (v[i] === x) return v;
      const nuovi = [...v];
      nuovi[i] = x;
      return nuovi;
    });
    setToccato(true);
    suona('tap');
    vibra(15);
  }

  function giu(e: PointerEvent<HTMLDivElement>) {
    if (bloccato || (aperta && !aperta.ferma)) return;
    const i = cellaDa(e);
    if (i < 0 || date[i]) return;
    const g = griglia.current?.getBoundingClientRect();
    const r = radice.current?.getBoundingClientRect();
    if (!g || !r) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // La corolla non esce dallo schermo: ai bordi si sposta verso l'interno.
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const vx = Math.min(Math.max(g.left + xDi(i) + m.cella / 2, esteso + 4), vw - esteso - 4);
    const vy = Math.min(Math.max(g.top + yDi(i) + m.cella / 2, esteso + 4), vh - esteso - 4);
    setAperta({ cella: i, vx, vy, x: vx - r.left, y: vy - r.top, x0: e.clientX, y0: e.clientY, pid: e.pointerId, scelto: null, mosso: false, ferma: false });
    suona('tap');
    vibra(8);
  }

  function muovi(e: PointerEvent<HTMLDivElement>) {
    if (!aperta || aperta.ferma || aperta.pid !== e.pointerId) return;
    const mosso = aperta.mosso || Math.hypot(e.clientX - aperta.x0, e.clientY - aperta.y0) > MOSSO;
    const scelto = mosso ? petaloDa(aperta, e.clientX, e.clientY) : null;
    if (scelto !== aperta.scelto && scelto !== null) {
      suona('tap');
      vibra(6);
    }
    if (scelto !== aperta.scelto || mosso !== aperta.mosso) setAperta({ ...aperta, mosso, scelto });
  }

  function su(e: PointerEvent<HTMLDivElement>) {
    if (!aperta || aperta.ferma || aperta.pid !== e.pointerId) return;
    const { cella, scelto, mosso } = aperta;
    if (scelto !== null) {
      metti(cella, scelto + 1);
      setAperta(null);
    } else if (!mosso && valori[cella]) {
      // Un tocco breve su una casella tua: la svuota.
      metti(cella, 0);
      setAperta(null);
    } else if (!mosso) {
      setAperta({ ...aperta, ferma: true, pid: -1 });
    } else {
      setAperta(null);
    }
  }

  function annulla(e: PointerEvent<HTMLDivElement>) {
    if (aperta && !aperta.ferma && aperta.pid === e.pointerId) setAperta(null);
  }

  // ── Disegno ──
  const mostrati = risolto && !giusta ? sol : valori;
  const segnoSbagliato = new Set(errore?.segni ?? []);
  const angolo = (k: number) => ((-90 + (k * 360) / n) * Math.PI) / 180;

  return (
    <div ref={radice} className="relative flex select-none flex-col items-center gap-2" style={{ WebkitTouchCallout: 'none' }}>
      <div className="text-center text-sm leading-5 text-panna-100/75">
        <p>
          Righe, colonne e riquadri: da 1 a {n}, senza ripetere.
        </p>
        {segni.length > 0 && <p className="text-turchese-300">La punta di &lt; &gt; indica il numero più piccolo.</p>}
      </div>

      <div
        ref={griglia}
        role="grid"
        aria-label={`Sudoku ${n} per ${n}`}
        className="relative touch-none"
        style={{ width: largo, height: alto, touchAction: 'none' }}
        onPointerDown={giu}
        onPointerMove={muovi}
        onPointerUp={su}
        onPointerCancel={annulla}
      >
        {/* I riquadri: pannelli a scacchi dietro le caselle. */}
        {unita
          .filter((u) => u.tipo === 'riquadro')
          .map((u) => (
            <div
              key={`q${u.k}`}
              className={`absolute rounded-2xl ${(Math.floor(u.k / (n / round.rw)) + (u.k % (n / round.rw))) % 2 ? 'bg-notte-800/70' : 'bg-notte-950/60'}`}
              style={cornice(u.celle, Math.floor(m.G / 2) - 1)}
            />
          ))}

        {mostrati.map((x, i) => {
          const data = date[i];
          const acceso = lit.has(i);
          const doppia = errore?.doppie.has(i) ?? false;
          const svelata = risolto && !giusta && !data && valori[i] !== sol[i];
          const scelta = aperta?.cella === i;
          const stato = data
            ? acceso
              ? 'bg-oro-400 text-inchiostro'
              : 'bg-panna-100 text-inchiostro shadow-[0_3px_0_var(--color-panna-200)]'
            : acceso
              ? 'border-2 border-oro-400 bg-oro-400 text-inchiostro'
              : doppia
                ? 'border-2 border-pericolo-400 bg-pericolo-400/20 text-pericolo-400'
                : svelata
                  ? 'border-2 border-dashed border-turchese-300/60 text-turchese-300'
                  : x
                    ? 'border-2 border-oro-600 bg-notte-950/50 text-oro-300'
                    : 'border-2 border-dashed border-panna-100/30 bg-notte-950/20';
          return (
            <div
              key={i}
              aria-label={`${data ? 'Indizio' : 'Casella'} riga ${riga(round, i) + 1} colonna ${colonna(round, i) + 1}${x ? `: ${x}` : ', vuota'}`}
              className={`titolo absolute flex items-center justify-center rounded-xl font-semibold tabular-nums transition-colors duration-150 ${m.testo} ${stato} ${scelta ? 'ring-4 ring-oro-400/70' : ''}`}
              style={{ left: xDi(i), top: yDi(i), width: m.cella, height: m.cella, cursor: data || bloccato ? 'default' : 'pointer' }}
            >
              {x ? x : ''}
            </div>
          );
        })}

        {/* I segni < >: la punta guarda la casella più piccola. */}
        {segni.map((s, k) => {
          const stessaRiga = riga(round, s.a) === riga(round, s.b);
          const [p, q] = [s.a, s.b].map((i) => ({ x: xDi(i) + m.cella / 2, y: yDi(i) + m.cella / 2 }));
          const cx = (p!.x + q!.x) / 2;
          const cy = (p!.y + q!.y) / 2;
          // Direzione verso la piccola (a): 0 = destra, 90 = giù, 180 = sinistra, 270 = su.
          const giro = stessaRiga ? (p!.x < q!.x ? 180 : 0) : p!.y < q!.y ? 270 : 90;
          const rotto = segnoSbagliato.has(k);
          return (
            <svg
              key={`s${k}`}
              aria-label={`${stessaRiga ? 'Segno fra due caselle vicine' : 'Segno fra due caselle una sopra l’altra'}`}
              viewBox="-12 -12 24 24"
              className={`pointer-events-none absolute ${rotto && !meno ? 'sudoku-trema' : ''}`}
              style={{ left: cx - 12, top: cy - 12, width: 24, height: 24 }}
            >
              <circle r={11} fill="var(--color-notte-950)" stroke={rotto ? 'var(--color-pericolo-400)' : 'var(--color-turchese-300)'} strokeWidth={2} />
              <polyline
                points="3,-5 -3,0 3,5"
                transform={`rotate(${giro + 180})`}
                fill="none"
                stroke={rotto ? 'var(--color-pericolo-400)' : 'var(--color-turchese-300)'}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          );
        })}

        {/* Sbagliato: le unità in conflitto. */}
        {errore?.unita.map((u) => (
          <div
            key={`e${u.tipo}${u.k}`}
            className={`pointer-events-none absolute rounded-2xl border-[3px] border-pericolo-400 ${meno ? '' : 'sudoku-trema'}`}
            style={cornice(u.celle, 3)}
          />
        ))}

        {/* Risolto: la cornice che corre su righe, colonne e riquadri. */}
        {lampo && (
          <div
            key={`l${lampo.tipo}${lampo.k}`}
            className="sudoku-lampo pointer-events-none absolute rounded-2xl border-[3px] border-oro-300"
            style={cornice(lampo.celle, 3)}
          />
        )}
      </div>

      <p className="min-h-5 text-center text-sm text-panna-100/60">{toccato || bloccato ? '' : 'Tieni premuta una casella vuota e scorri sul numero.'}</p>

      {aperta && (
        <div
          ref={corolla}
          aria-label="Scegli il numero"
          className={`absolute z-50 ${aperta.ferma ? '' : 'pointer-events-none'} ${meno ? '' : 'sudoku-corolla'}`}
          style={{ left: aperta.x - esteso, top: aperta.y - esteso, width: esteso * 2, height: esteso * 2, touchAction: 'none' }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-notte-600 bg-notte-950/85 shadow-[0_10px_24px_var(--color-notte-950)]" />
          {Array.from({ length: n }, (_, k) => {
            const sel = aperta.scelto === k;
            const st: CSSProperties = {
              left: esteso + Math.cos(angolo(k)) * anello - PETALO / 2,
              top: esteso + Math.sin(angolo(k)) * anello - PETALO / 2,
              width: PETALO,
              height: PETALO,
              transform: sel ? 'scale(1.18)' : undefined,
            };
            return (
              <div
                key={k}
                role="button"
                aria-label={`Metti ${k === 0 ? "l'1" : `il ${k + 1}`}`}
                onPointerDown={
                  aperta.ferma
                    ? (e) => {
                        e.stopPropagation();
                        metti(aperta.cella, k + 1);
                        setAperta(null);
                      }
                    : undefined
                }
                className={`titolo absolute flex items-center justify-center rounded-full text-2xl font-semibold tabular-nums transition-transform duration-100 ${
                  sel ? 'bg-oro-400 text-inchiostro shadow-[0_4px_0_var(--color-oro-600)]' : 'bg-panna-100 text-inchiostro'
                }`}
                style={st}
              >
                {k + 1}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const miniSudoku: PuzzleGame<RoundSudoku, Risposta> = {
  id: 'sudoku',
  mode: 'puzzle',
  title: 'Mini sudoku',
  hint: 'Da 1 a 4 (poi da 1 a 6) in ogni riga, colonna e riquadro: tieni premuta una casella e scorri sul numero.',
  generate: genera,
  View: Vista,
  check: corretta,
  aiuti,
  soluzione,
  fluido: true,
};
