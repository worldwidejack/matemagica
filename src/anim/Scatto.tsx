import { useEffect, useRef, type CSSProperties } from 'react';
import { FOGLI, type Foglio, type NomeFoglio } from './manifest';
import { ascolta, menoMovimento } from './orologio';

type Props = {
  nome: NomeFoglio;
  /** Larghezza in px CSS: l'altezza segue le proporzioni del fotogramma. */
  larghezza: number;
  /** Cambia questo numero per farla ripartire da capo (es. a ogni tocco). */
  giro?: number;
  /** Di solito quelli del foglio: 12 al secondo, a scatti come un cartone. */
  fps?: number;
  loop?: boolean;
  /** Resta ferma sul primo fotogramma finché è vero; parte quando diventa falso. */
  pausa?: boolean;
  onFine?: () => void;
  className?: string;
  style?: CSSProperties;
};

/**
 * Suona un foglio di fotogrammi (vedi `scripts/fogli.py`): un fotogramma alla volta, senza
 * passaggi morbidi in mezzo. È lo scatto del cartone animato fatto a mano.
 * Il fotogramma si cambia spostando lo sfondo, direttamente sul DOM: React non ridisegna.
 * Se il foglio ha un copione (`passi`, le sequenze di Fenaki), ogni disegno resta su per i
 * fotogrammi che gli spettano: i tempi sono quelli dell'animatore, non un passo fisso.
 */
export function Scatto({ nome, larghezza, giro = 0, fps, loop, pausa, onFine, className, style }: Props) {
  const f: Foglio = FOGLI[nome];
  const rif = useRef<HTMLDivElement>(null);
  const fine = useRef(onFine);

  useEffect(() => {
    fine.current = onFine;
  });

  useEffect(() => {
    const el = rif.current;
    if (!el) return;
    const ripeti = loop ?? f.loop;
    const passo = 1000 / (fps ?? f.fps);
    // La linea del tempo: per ogni fotogramma, quale disegno del foglio si vede.
    const linea = f.passi ? f.passi.flatMap(([disegno = 0, durata = 1]) => Array.from({ length: durata }, () => disegno)) : null;
    const quanti = linea ? linea.length : f.fotogrammi;
    const mostra = (t: number) => {
      const i = linea ? (linea[t] ?? 0) : t;
      const c = i % f.colonne;
      const r = Math.floor(i / f.colonne);
      const x = f.colonne > 1 ? (c / (f.colonne - 1)) * 100 : 0;
      const y = f.righe > 1 ? (r / (f.righe - 1)) * 100 : 0;
      el.style.backgroundPosition = `${x}% ${y}%`;
    };

    if (pausa) {
      mostra(0);
      return;
    }
    if (menoMovimento()) {
      mostra(ripeti ? 0 : quanti - 1);
      if (!ripeti) fine.current?.();
      return;
    }

    mostra(0);
    let inizio = -1;
    let ultimo = 0;
    const smetti = ascolta((ora) => {
      if (inizio < 0) inizio = ora;
      let i = Math.floor((ora - inizio) / passo);
      if (i >= quanti) {
        if (!ripeti) {
          smetti();
          mostra(quanti - 1);
          fine.current?.();
          return;
        }
        i %= quanti;
      }
      if (i !== ultimo) {
        ultimo = i;
        mostra(i);
      }
    });
    return smetti;
  }, [f, giro, fps, loop, pausa]);

  return (
    <div
      ref={rif}
      aria-hidden
      className={className}
      style={{
        width: larghezza,
        aspectRatio: `${f.w} / ${f.h}`,
        backgroundImage: `url(${f.url})`,
        backgroundSize: `${f.colonne * 100}% ${f.righe * 100}%`,
        backgroundRepeat: 'no-repeat',
        ...style,
      }}
    />
  );
}
