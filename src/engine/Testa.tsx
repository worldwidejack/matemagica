import { Icona } from '@/ui/kit';

export type Tacca = 'giusta' | 'sbagliata' | 'saltata' | undefined;

type Props = {
  /** Come è andato ogni quesito già chiuso, nell'ordine. */
  tacche: Tacca[];
  /** Il quesito in corso (da 0). */
  corrente: number;
  totale: number;
  punteggio: number;
  /** I punti appena presi: salgono via accanto al totale. `chiave` li fa ripartire. */
  guadagno?: { punti: number; chiave: string | number };
  onEsci: () => void;
};

/**
 * La testa di ogni partita, uguale per arcade e rompicapo: esci, la fila delle tacche (una
 * per quesito: gialla se giusta, d'inchiostro se no, chiara quella in corso) e i punti.
 */
export function Testa({ tacche, corrente, totale, punteggio, guadagno, onEsci }: Props) {
  return (
    <header className="relative flex items-center gap-3">
      <button onClick={onEsci} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-inchiostro/20 text-panna-50 active:scale-90" aria-label="Esci">
        <Icona nome="chiudi" className="h-5 w-5" />
      </button>
      <div className="flex flex-1 gap-1" role="img" aria-label={`Quesito ${Math.min(corrente + 1, totale)} di ${totale}`}>
        {Array.from({ length: totale }, (_, i) => {
          const t = tacche[i];
          const colore =
            t === 'giusta'
              ? 'bg-oro-400'
              : t === 'sbagliata'
                ? 'bg-inchiostro/60'
                : t === 'saltata'
                  ? 'bg-panna-50/40'
                  : i === corrente
                    ? 'bg-panna-50'
                    : 'bg-inchiostro/20';
          return <span key={i} className={`h-2.5 flex-1 rounded-full transition-colors duration-200 ${colore}`} />;
        })}
      </div>
      <div className="titolo relative flex shrink-0 items-center gap-1.5 rounded-full bg-inchiostro/25 py-1.5 pr-3.5 pl-2.5 text-lg leading-none font-bold tabular-nums text-panna-50">
        <svg viewBox="0 0 24 24" className="h-[1.1em] w-[1.1em]" aria-hidden>
          <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" fill="var(--color-oro-400)" stroke="var(--color-oro-400)" strokeWidth={2} strokeLinejoin="round" />
        </svg>
        <span className="min-w-[1.6ch] text-right">{punteggio}</span>
        {guadagno && (
          <span key={guadagno.chiave} className="animate-sali absolute top-full right-3 mt-0.5 text-base text-oro-300">
            +{guadagno.punti}
          </span>
        )}
      </div>
    </header>
  );
}

/** Le vite: rombi di carta; quella persa resta come un'impronta. */
export function Vite({ rimaste, totale }: { rimaste: number; totale: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`${rimaste} vite`}>
      {Array.from({ length: totale }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`h-6 w-6 transition-transform duration-200 ${i < rimaste ? '' : 'scale-75'}`} aria-hidden>
          <path
            d="M12 4.5 19.5 12 12 19.5 4.5 12z"
            fill={i < rimaste ? 'var(--color-panna-50)' : 'rgb(21 19 46 / 0.3)'}
            stroke={i < rimaste ? 'var(--color-panna-50)' : 'rgb(21 19 46 / 0)'}
            strokeWidth={3.5}
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}
