import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { suona } from '@/audio/sfx';
import { TAPPE } from '@/content/sentiero';
import { bottoneTest, misureVelo, type PezzoVelo } from './mappa';
import { Immagine, IsolaFinta, NuvolaFinta, StelleCielo } from './pezzi';

/**
 * Il velo sulla prossima tappa: la sua isola è una sagoma scura dietro le nuvole.
 * Ogni livello fatto nell'isola di sotto dirada il velo di un grado (0-4): le nuvole
 * si aprono e scendono ai lati, la sagoma passa da invisibile a riconoscibile (a 4/5 è
 * intera, col monumento, e il «?» non c'è più). I colori non si vedono mai prima
 * della scoperta.
 */

/** Opacità della sagoma per grado: a 3/5 si intuisce, a 4/5 si riconosce. */
const SAGOMA = [0, 0.1, 0.2, 0.34, 0.52] as const;
const DOMANDA = [0.9, 0.9, 0.85, 0.5, 0] as const;
/** I banchi restano pieni (stile piatto): si aprono spostandosi, mai mezzi trasparenti. */
const PIENE = [1, 1, 1, 1, 1] as const;

type Nuvola = {
  file: '/isole/nuvola-1.webp' | '/isole/nuvola-2.webp';
  /** In unità del pezzo: angolo in alto a sinistra e larghezza. */
  x: number;
  y: number;
  w: number;
  /** Dove sta a ogni grado (0-4): spostamento in unità, [dx, dy]. */
  via: readonly (readonly [number, number])[];
  opacita: readonly number[];
};

const RAPPORTO_NUVOLA = { '/isole/nuvola-1.webp': 290 / 785, '/isole/nuvola-2.webp': 267 / 356 } as const;

function nuvoleIntorno(cy: number): Nuvola[] {
  return [
    // I due banchi piccoli in alto ai lati: si scostano e lasciano vedere il monumento.
    {
      file: '/isole/nuvola-2.webp',
      x: 8,
      y: cy - 25,
      w: 30,
      via: [[0, 0], [-3, -1], [-6, -2], [-13, -3], [-24, -4]],
      opacita: PIENE,
    },
    {
      file: '/isole/nuvola-2.webp',
      x: 62,
      y: cy - 21,
      w: 28,
      via: [[0, 0], [3, -1], [6, -2], [13, -3], [24, -4]],
      opacita: PIENE,
    },
    // I due banchi grandi: si aprono e scendono sotto la sagoma, ai lati.
    {
      file: '/isole/nuvola-1.webp',
      x: -6,
      y: cy - 6,
      w: 70,
      via: [[0, 0], [-4, 0], [-9, 2], [-20, 6], [-34, 10]],
      opacita: PIENE,
    },
    {
      file: '/isole/nuvola-1.webp',
      x: 38,
      y: cy + 2,
      w: 68,
      via: [[0, 0], [4, 0], [9, 2], [20, 6], [34, 10]],
      opacita: PIENE,
    },
    // In cima e davanti: spariscono per prime.
    {
      file: '/isole/nuvola-2.webp',
      x: 34,
      y: cy - 31,
      w: 32,
      via: [[0, 0], [0, -6], [0, -6], [0, -6], [0, -6]],
      opacita: [1, 0, 0, 0, 0],
    },
    {
      file: '/isole/nuvola-1.webp',
      x: 18,
      y: cy - 13,
      w: 64,
      via: [[0, 0], [0, 4], [0, 10], [0, 10], [0, 10]],
      opacita: [1, 1, 0, 0, 0],
    },
  ];
}

export function Velo({
  pezzo,
  grado,
  tappaSotto,
  onSalto,
  className,
}: {
  pezzo: PezzoVelo;
  grado: number;
  /** La tappa da finire per scoprire questa. */
  tappaSotto: number;
  onSalto: (tappa: number) => void;
  className?: string;
}) {
  const g = Math.max(0, Math.min(4, grado));
  const { h, riquadro } = pezzo;
  const loc = riquadro ? { x: riquadro.x, y: riquadro.y - pezzo.y, w: riquadro.w, h: riquadro.h } : undefined;
  const { cx, cy, fondo } = misureVelo(pezzo);
  const test = bottoneTest(pezzo);
  const [scossa, setScossa] = useState(0);
  const [messaggio, setMessaggio] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const tocca = () => {
    suona('tap');
    setScossa((s) => s + 1);
    setMessaggio(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessaggio(false), 2400);
  };
  const pct = (u: number) => `${(u / h) * 100}%`;
  const cosa = tappaSotto <= TAPPE.length ? "l'isola" : 'la tappa';

  return (
    <>
      <StelleCielo stelle={pezzo.stelle} alto={h} />
      {pezzo.isola && loc && (
        // z-[1]: la punta della sagoma scende nel cielo dell'isola sotto e deve restare davanti.
        <div
          className="velo-passo pointer-events-none absolute z-[1]"
          style={{ left: `${loc.x}%`, top: pct(loc.y), width: `${loc.w}%`, height: pct(loc.h), filter: 'brightness(0)', opacity: SAGOMA[g] }}
        >
          <Immagine src={pezzo.isola.file} pigra className="h-full w-full" segnaposto={<IsolaFinta />} />
        </div>
      )}
      <button
        onClick={tocca}
        aria-label={`Isola nascosta: si scopre finendo ${cosa} ${tappaSotto}`}
        className={`absolute inset-x-0 top-0 z-20 ${className ?? ''}`}
        style={{ height: pct(fondo + 4) }}
      >
        <div key={scossa} className={`absolute inset-0 ${scossa > 0 ? 'animate-trema' : ''}`}>
          {nuvoleIntorno(cy).map((n, i) => {
            const alta = n.w * RAPPORTO_NUVOLA[n.file];
            const [dx, dy] = n.via[g] ?? [0, 0];
            const stile: CSSProperties = {
              left: `${n.x}%`,
              top: pct(n.y),
              width: `${n.w}%`,
              height: pct(alta),
              // translate in % della nuvola stessa: lo spostamento in unità diviso per la sua misura
              translate: `${(dx / n.w) * 100}% ${(dy / alta) * 100}%`,
              opacity: n.opacita[g] ?? 0,
            };
            return <Immagine key={i} src={n.file} className="velo-passo absolute" style={stile} segnaposto={<NuvolaFinta />} />;
          })}
          <span
            className="titolo velo-passo absolute -translate-x-1/2 -translate-y-1/2 text-7xl font-black text-viola-500"
            style={{ left: `${cx}%`, top: pct(cy + 2), opacity: DOMANDA[g] }}
          >
            ?
          </span>
        </div>
      </button>
      {messaggio && (
        <p
          className="animate-pop pointer-events-none absolute z-[21] -translate-x-1/2 rounded-2xl bg-panna-50 px-4 py-2 text-center text-sm font-bold whitespace-nowrap text-inchiostro shadow-[3px_4px_0_rgb(0_0_0/0.28)]"
          style={{ left: `${test.cx}%`, top: pct(cy - 24) }}
        >
          Si scopre finendo {cosa} {tappaSotto}
        </p>
      )}
      {/* Appeso al banco del «?»: un cartellino scuro sulle nuvole chiare. */}
      <div
        data-test-salto
        className={`absolute z-20 -translate-x-1/2 ${className ?? ''}`}
        style={{ left: `${test.cx}%`, top: pct(test.y) }}
      >
        <button
          onClick={() => {
            suona('tap');
            onSalto(pezzo.n);
          }}
          className="rounded-2xl bg-inchiostro px-3.5 py-1.5 text-center text-xs leading-snug whitespace-nowrap text-panna-50 shadow-[3px_4px_0_rgb(0_0_0/0.28)] ring-2 ring-panna-100 active:translate-y-0.5"
        >
          <span className="block font-extrabold text-oro-300">Sei già bravo?</span>
          <span className="block">Salta qui con un test</span>
        </button>
      </div>
    </>
  );
}
