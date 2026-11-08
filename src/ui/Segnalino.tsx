import { useEffect, useState } from 'react';
import { menoMovimento } from '@/anim/orologio';
import type { GameId } from '@/engine/cartuccia';
import type { StatoSasso } from './sentiero/pezzi';
import seg from '../../public/paese/seg/seg.json';

/**
 * Il segnalino di un livello nel paese: ogni formato di gioco ha il suo (un fiore che
 * sboccia, un cristallo che si accende, un anello che si riempie di luce). Sono sequenze
 * di fotogrammi dipinti: chiuso = il primo, aperto = il secondo, fatto = l'ultimo.
 * Il livello attuale parte dal primo e arriva all'ultimo, poi brilla.
 */
export type Famiglia = 'fiore-a' | 'fiore-b' | 'cristallo' | 'cerchio';

export const FAMIGLIA_DI: Record<GameId, Famiglia> = {
  'piu-grande': 'fiore-a',
  coppie: 'fiore-a',
  misto: 'fiore-a',
  catena: 'fiore-b',
  stima: 'fiore-b',
  regola: 'fiore-b',
  bersaglio: 'cristallo',
  quadrato: 'cristallo',
  bilancia: 'cerchio',
};

/** Altezza a schermo (px) e dove sta il punto di appoggio sulla strada. */
const MISURE: Record<Famiglia, { alto: number; base: 'piedi' | 'centro' }> = {
  'fiore-a': { alto: 46, base: 'piedi' },
  'fiore-b': { alto: 54, base: 'piedi' },
  cristallo: { alto: 42, base: 'piedi' },
  cerchio: { alto: 24, base: 'centro' },
};

export function Segnalino({
  famiglia,
  stato,
  numero,
  stelle,
  onTocca,
  etichetta,
  sboccia,
}: {
  famiglia: Famiglia;
  stato: StatoSasso;
  numero: number;
  stelle: number;
  onTocca: () => void;
  etichetta: string;
  /** Il livello è appena stato completato: il segnalino anima dal primo all'ultimo fotogramma. */
  sboccia?: boolean;
}) {
  const info = seg[famiglia];
  const ultimo = info.n - 1;
  const m = MISURE[famiglia];
  const larghezza = Math.round((info.w / info.h) * m.alto);
  // Futuro = appassito; da fare (aperto o attuale) = bocciolo; completato = sbocciato.
  const fermo = stato === 'chiuso' ? 0 : stato === 'fatto' ? ultimo : 1;
  const anima = !!sboccia && stato === 'fatto' && !menoMovimento();
  const [frame, setFrame] = useState(anima ? 1 : fermo);

  // Solo a livello completato sboccia davanti agli occhi, un fotogramma ogni 150 ms.
  useEffect(() => {
    if (!anima) {
      setFrame(fermo);
      return;
    }
    setFrame(1);
    const t: number[] = [];
    for (let k = 2; k <= ultimo; k++) t.push(window.setTimeout(() => setFrame(k), 500 + k * 150));
    return () => t.forEach((x) => window.clearTimeout(x));
  }, [anima, fermo, ultimo]);

  const chiuso = stato === 'chiuso';
  const luce = stato === 'attuale' || (anima && frame === ultimo);
  return (
    <button
      onClick={onTocca}
      disabled={chiuso}
      aria-label={etichetta}
      className="relative block active:translate-y-0.5"
      style={{ width: larghezza, height: m.alto, touchAction: 'manipulation' }}
    >
      <span
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}paese/seg/${famiglia}.webp)`,
          backgroundSize: `${info.n * 100}% 100%`,
          backgroundPosition: `${info.n > 1 ? (frame / (info.n - 1)) * 100 : 0}% 0`,
          backgroundRepeat: 'no-repeat',
          opacity: 1,
          filter: luce ? 'drop-shadow(0 0 10px rgb(255 196 64 / 0.95)) drop-shadow(0 0 22px rgb(255 170 40 / 0.6))' : undefined,
          transition: 'filter 400ms',
        }}
      />
      <span
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-panna-50 px-1.5 text-[13px] leading-[18px] font-black text-inchiostro"
        style={{ top: m.base === 'centro' ? '50%' : '100%', marginTop: m.base === 'centro' ? -9 : 2, opacity: chiuso ? 0.65 : 1 }}
      >
        {numero}
      </span>
      {stato === 'fatto' && stelle > 0 && (
        <span className="absolute left-1/2 -translate-x-1/2 text-[11px] leading-none text-oro" style={{ top: m.base === 'centro' ? '100%' : 'calc(100% + 22px)' }}>
          {'★'.repeat(stelle)}
        </span>
      )}
    </button>
  );
}

export function altezzaDi(f: Famiglia): number {
  return MISURE[f].alto;
}
export function appoggioDi(f: Famiglia): 'piedi' | 'centro' {
  return MISURE[f].base;
}
export function larghezzaDi(f: Famiglia): number {
  const info = seg[f];
  return Math.round((info.w / info.h) * MISURE[f].alto);
}
