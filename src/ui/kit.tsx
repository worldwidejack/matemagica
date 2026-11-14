import type { CSSProperties, ReactNode } from 'react';
import { suona, vibra } from '@/audio/sfx';
import type { GameId } from '@/engine/cartuccia';

/**
 * I mattoni dell'interfaccia di «Un giorno intero col gatto» (docs/grafica/carta-bianca/BIBBIA.md):
 * carta e inchiostro, giallo degli occhi del gatto per il pulsante che conta, angoli molto
 * tondi, ombra dura sotto (il pulsante si schiaccia), nessun contorno. Tutte le schermate
 * nascono da qui: è quello che le tiene uguali.
 */

type BottoneProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variante?: 'oro' | 'carta' | 'inchiostro' | 'vuoto';
  freccia?: boolean;
  className?: string;
  respira?: boolean;
};

/** Il pulsante: giallo quello che conta (uno per schermata), di carta o d'inchiostro gli altri. */
export function Bottone({ children, onClick, disabled, variante = 'oro', freccia, className = '', respira }: BottoneProps) {
  const stili = {
    oro: 'bg-oro-400 text-inchiostro shadow-[0_6px_0_var(--color-oro-600)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-oro-600)]',
    carta: 'bg-panna-50 text-inchiostro shadow-[0_5px_0_rgb(21_19_46/0.18)] active:translate-y-1 active:shadow-[0_1px_0_rgb(21_19_46/0.18)]',
    inchiostro: 'bg-inchiostro text-panna-50 shadow-[0_5px_0_rgb(0_0_0/0.35)] active:translate-y-1 active:shadow-[0_1px_0_rgb(0_0_0/0.35)]',
    vuoto: 'opacity-75 underline-offset-4 hover:underline active:opacity-100',
  }[variante];
  return (
    <button
      onClick={() => {
        if (disabled) return;
        suona('tap');
        vibra(8);
        onClick?.();
      }}
      disabled={disabled}
      className={[
        'titolo flex items-center justify-center gap-3 rounded-full px-8 py-3.5 text-xl font-bold transition-transform duration-100 disabled:opacity-40',
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

/** Contatore su carta: fiamma, stelle, livello… */
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
  const sfondo = { pesca: 'bg-pesca', azzurro: 'bg-azzurro', panna: 'bg-panna-50' }[tono];
  return (
    <div className={`ombra-dura flex items-center gap-2 rounded-2xl ${sfondo} px-3.5 py-2 text-inchiostro`}>
      <span className="text-2xl leading-none">{icona}</span>
      <span className="leading-tight">
        <span className="titolo block text-xl font-bold tabular-nums">{valore}</span>
        <span className="block text-xs text-inchiostro-chiaro">{etichetta}</span>
      </span>
    </div>
  );
}

/** Scheda di carta: per missioni, giochi, risultati. Sta bene sulla carta e sul colore del luogo. */
export function Scheda({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`ombra-dura rounded-[1.75rem] bg-panna-50 p-4 text-inchiostro ${className}`} style={style}>
      {children}
    </div>
  );
}

type NomeIcona =
  | 'freccia'
  | 'mappa'
  | 'fulmine'
  | 'carte'
  | 'chiudi'
  | 'suono'
  | 'muto'
  | 'lucchetto'
  | 'stella'
  | 'indietro'
  | 'persona'
  | 'calendario'
  | 'condividi'
  | 'spunta'
  | 'fiamma';

/** Icone a tratto grosso e tondo, come ritagliate. */
export function Icona({ nome, className = 'h-6 w-6' }: { nome: NomeIcona; className?: string }) {
  const tratti: Record<NomeIcona, ReactNode> = {
    freccia: <path d="M4 12h15m-6-6 6 6-6 6" />,
    indietro: <path d="M20 12H5m6-6-6 6 6 6" />,
    spunta: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    fiamma: <path d="M12.5 2.5c.6 3.6 5.5 5.6 5.5 11a6 6 0 0 1-12 0c0-2.3 1-3.9 2.2-5 .2 1.7.9 2.7 2 3.1-.6-3.2.3-6.6 2.3-9.1z" />,
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {tratti[nome]}
    </svg>
  );
}

/** Le tre stelle sotto un livello o nel risultato: le spente prendono il colore del testo. */
export function Stelline({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${n} stelle su 3`}>
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-[1em] w-[1em]" aria-hidden>
          <path
            d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"
            fill={i <= n ? 'var(--color-oro-400)' : 'currentColor'}
            fillOpacity={i <= n ? 1 : 0.22}
            stroke={i <= n ? 'var(--color-oro-600)' : 'none'}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

/** Il disco della medaglia: bronzo, argento o oro intorno all'icona. */
export function Medaglione({ icona, grado, grande }: { icona: string; grado: 0 | 1 | 2 | 3; grande?: boolean }) {
  const anello = ['ring-inchiostro/10', 'ring-tramonto', 'ring-azzurro', 'ring-oro-500'][grado];
  const fondo = ['bg-inchiostro/8 grayscale opacity-50', 'bg-pesca', 'bg-panna-50', 'bg-oro-300'][grado];
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

/** La tessera di un gioco (public/giochi/<id>.webp): quadrata, a colore pieno, con l'ombra dura. */
export function IconaGioco({ gioco, className = 'h-14 w-14' }: { gioco: GameId; className?: string }) {
  return (
    <img
      src={`/giochi/${gioco}.webp`}
      alt=""
      width={256}
      height={256}
      draggable={false}
      className={`shrink-0 rounded-[26%] shadow-[0_4px_0_rgb(21_19_46/0.2)] ${className}`}
    />
  );
}

/** La barra di avanzamento: traccia morbida, riempimento giallo. */
export function Barra({ quota, className = '' }: { quota: number; className?: string }) {
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-inchiostro/10 ${className}`}>
      <div className="h-full rounded-full bg-oro-500 transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(1, quota)) * 100}%` }} />
    </div>
  );
}
