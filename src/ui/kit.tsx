import type { ReactNode } from 'react';
import { suona } from '@/audio/sfx';
import type { GameId } from '@/engine/cartuccia';

/**
 * I mattoni dell'interfaccia nello stile approvato (riferimento: stile della P,
 * ambientazione della T). Carta panna e inchiostro sopra il cielo dell'ora blu,
 * pulsanti oro a pillola, titoli in Fraunces.
 */

type BottoneProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variante?: 'oro' | 'carta' | 'vuoto';
  freccia?: boolean;
  className?: string;
  respira?: boolean;
};

/** Il pulsante principale: pillola oro con testo in inchiostro e freccia, come "Continua →". */
export function Bottone({ children, onClick, disabled, variante = 'oro', freccia, className = '', respira }: BottoneProps) {
  const stili = {
    oro: 'bg-oro-400 text-inchiostro border-2 border-oro-600/50 shadow-[0_6px_0_var(--color-oro-600),0_10px_24px_rgb(0_0_0/0.25)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-oro-600)]',
    carta: 'bg-panna-100 text-inchiostro border-2 border-panna-200 shadow-[0_4px_0_var(--color-panna-200)] active:translate-y-0.5 active:shadow-none',
    vuoto: 'text-panna-100/70 underline-offset-4 hover:underline',
  }[variante];
  return (
    <button
      onClick={() => {
        if (disabled) return;
        suona('tap');
        onClick?.();
      }}
      disabled={disabled}
      className={[
        'titolo flex items-center justify-center gap-3 rounded-full px-8 py-3.5 text-xl font-semibold transition-transform disabled:opacity-40',
        stili,
        respira ? 'animate-respiro' : '',
        className,
      ].join(' ')}
    >
      <span>{children}</span>
      {freccia && <Icona nome="freccia" className="h-5 w-5" />}
    </button>
  );
}

/** Contatore su carta: fiamma, stelle, livello… (le due pillole sotto il titolo del riferimento). */
export function Pillola({
  icona,
  valore,
  etichetta,
  tono = 'pesca',
}: {
  icona: ReactNode;
  valore: ReactNode;
  etichetta: string;
  tono?: 'pesca' | 'azzurro' | 'panna';
}) {
  const sfondo = { pesca: 'bg-pesca', azzurro: 'bg-azzurro', panna: 'bg-panna-100' }[tono];
  return (
    <div className={`flex items-center gap-2 rounded-2xl ${sfondo} px-3.5 py-2 text-inchiostro shadow-[0_3px_10px_rgb(0_0_0/0.18)]`}>
      <span className="text-2xl leading-none">{icona}</span>
      <span className="leading-tight">
        <span className="titolo block text-xl font-semibold tabular-nums">{valore}</span>
        <span className="block text-xs text-inchiostro-chiaro">{etichetta}</span>
      </span>
    </div>
  );
}

/** Scheda di carta panna: per missioni, giochi, risultati. */
export function Scheda({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-panna-100 p-4 text-inchiostro shadow-[0_6px_20px_rgb(0_0_0/0.22)] ${className}`}>
      {children}
    </div>
  );
}

type NomeIcona = 'freccia' | 'mappa' | 'fulmine' | 'carte' | 'chiudi' | 'suono' | 'muto' | 'lucchetto' | 'stella' | 'indietro' | 'persona' | 'calendario' | 'condividi';

/** Icone a tratto, stesso spessore delle linee dell'illustrazione. */
export function Icona({ nome, className = 'h-6 w-6' }: { nome: NomeIcona; className?: string }) {
  const tratti: Record<NomeIcona, ReactNode> = {
    freccia: <path d="M4 12h15m-6-6 6 6-6 6" />,
    indietro: <path d="M20 12H5m6-6-6 6 6 6" />,
    mappa: (
      <>
        <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" />
        <path d="M9 4v13.5M15 6.5V20" />
      </>
    ),
    fulmine: <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z" />,
    carte: (
      <>
        <rect x="3.5" y="5" width="11" height="15" rx="2" transform="rotate(-8 9 12.5)" />
        <rect x="9.5" y="4" width="11" height="15" rx="2" />
        <path d="m15 9 .9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.5 2.1-.3z" />
      </>
    ),
    chiudi: <path d="M6 6l12 12M18 6 6 18" />,
    suono: (
      <>
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
        <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
      </>
    ),
    muto: (
      <>
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
        <path d="m16 9.5 5 5m0-5-5 5" />
      </>
    ),
    lucchetto: (
      <>
        <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
        <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      </>
    ),
    stella: <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />,
    condividi: (
      <>
        <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
        <path d="M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12" />
      </>
    ),
    persona: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    calendario: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
        <path d="m12 12.5.8 1.7 1.9.2-1.4 1.3.4 1.9-1.7-.9-1.7.9.4-1.9-1.4-1.3 1.9-.2z" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {tratti[nome]}
    </svg>
  );
}

/** Le tre stelle sotto un livello o nel risultato. */
export function Stelline({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${n} stelle su 3`}>
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-[1em] w-[1em]" aria-hidden>
          <path
            d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"
            fill={i <= n ? 'var(--color-oro-400)' : 'rgb(255 255 255 / 0.25)'}
            stroke={i <= n ? 'var(--color-oro-600)' : 'none'}
            strokeWidth={1.2}
          />
        </svg>
      ))}
    </span>
  );
}

/** Il disco della medaglia: bronzo, argento o oro intorno all'icona. */
export function Medaglione({ icona, grado, grande }: { icona: string; grado: 0 | 1 | 2 | 3; grande?: boolean }) {
  const anello = ['ring-panna-100/20', 'ring-tramonto', 'ring-azzurro', 'ring-oro-500'][grado];
  const fondo = ['bg-panna-100/10 grayscale opacity-50', 'bg-pesca', 'bg-panna-50', 'bg-oro-300'][grado];
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ring-4 ${anello} ${fondo} ${
        grande ? 'h-16 w-16 text-3xl' : 'h-11 w-11 text-2xl'
      }`}
    >
      {icona}
    </span>
  );
}

/**
 * L'icona dipinta di un gioco (medaglione tondo, public/giochi/<id>.webp,
 * ritagliata da scripts/icone-giochi.py). Le emoji restano solo nei messaggi condivisi.
 */
export function IconaGioco({ gioco, className = 'h-14 w-14' }: { gioco: GameId; className?: string }) {
  return (
    <img
      src={`/giochi/${gioco}.webp`}
      alt=""
      width={256}
      height={256}
      draggable={false}
      className={`shrink-0 rounded-full drop-shadow-[0_3px_6px_rgb(0_0_0/0.35)] ${className}`}
    />
  );
}
