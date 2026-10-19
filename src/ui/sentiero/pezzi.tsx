import { useState, type CSSProperties, type ReactNode, type Ref } from 'react';
import type { GameId } from '@/engine/cartuccia';
import { GIOCHI } from '@/games/registro';
import { IconaGioco, Icona } from '../kit';
import { MISURE, type PostoPersonaggi, type Stellina } from './mappa';

/**
 * I pezzi piatti del sentiero «Sassi e isole» (stile S5): forme piene, bordo scuro
 * sottile, ombre piatte spostate, niente aloni. Tutto si muove a scatti.
 */

/** La stella piatta (viewBox 24): stelline dei sassi ed etichette. */
const STELLA = 'm12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z';

/** Un'immagine dipinta che, se manca, lascia il posto a un segnaposto piatto. */
export function Immagine({
  src,
  className,
  style,
  segnaposto,
  pigra,
}: {
  src: string;
  className?: string;
  style?: CSSProperties;
  segnaposto: ReactNode;
  pigra?: boolean;
}) {
  const [rotta, setRotta] = useState(false);
  if (rotta) {
    return (
      <div aria-hidden className={className} style={style}>
        {segnaposto}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      decoding="async"
      loading={pigra ? 'lazy' : undefined}
      onError={() => setRotta(true)}
      className={className}
      style={style}
    />
  );
}

// ── Segnaposti piatti, se un disegno non c'è ─────────────────────────────

export function IsolaFinta() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
      <polygon points="3,34 28,52 72,52 97,34 74,74 50,99 27,74" fill="var(--color-viola-700)" />
      <polygon points="3,34 26,20 74,20 97,34 72,52 28,52" fill="var(--color-verde)" />
    </svg>
  );
}

export function NuvolaFinta() {
  return (
    <svg viewBox="0 0 100 40" className="h-full w-full" aria-hidden>
      <g fill="var(--color-lilla)">
        <circle cx="22" cy="26" r="13" />
        <circle cx="44" cy="18" r="17" />
        <circle cx="68" cy="22" r="15" />
        <circle cx="86" cy="29" r="10" />
        <rect x="10" y="26" width="82" height="13" rx="6.5" />
      </g>
      <circle cx="44" cy="15" r="11" fill="var(--color-panna-100)" />
    </svg>
  );
}

function MagoFinto() {
  return (
    <svg viewBox="0 0 42 70" className="h-full w-full" aria-hidden>
      <path d="M8 68 14 38h14l6 30z" fill="var(--color-mantello)" />
      <circle cx="21" cy="32" r="7" fill="var(--color-pesca)" />
      <path d="M21 2 30 26H6z" fill="var(--color-mantello)" />
      <rect x="3" y="24" width="30" height="5" rx="2.5" fill="var(--color-oro-400)" />
    </svg>
  );
}

function GattoFinto() {
  return (
    <svg viewBox="0 0 27 34" className="h-full w-full" aria-hidden>
      <path d="M5 34c0-9 3-15 8.5-15S22 25 22 34z" fill="var(--color-inchiostro)" />
      <circle cx="13.5" cy="13" r="7.5" fill="var(--color-inchiostro)" />
      <path d="M7 9 7.5 2 12 7zM20 9l-.5-7L15 7z" fill="var(--color-inchiostro)" />
      <circle cx="10.5" cy="13" r="1.8" fill="var(--color-oro-400)" />
      <circle cx="16.5" cy="13" r="1.8" fill="var(--color-oro-400)" />
    </svg>
  );
}

// ── Il cielo ─────────────────────────────────────────────────────────────

/** Stelline piatte a 4 punte e puntini; alcune ammiccano a scatti. */
export function StelleCielo({ stelle, alto }: { stelle: Stellina[]; alto: number }) {
  return (
    <svg viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      {stelle.map((s, i) => {
        const anim = s.ammicca !== null ? { className: 'animate-ammicca', style: { animationDelay: `${s.ammicca}s` } } : {};
        if (!s.punte) return <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--color-panna-50)" opacity={0.8} {...anim} />;
        const r = s.r;
        const v = r * 1.35;
        const k = r * 0.22;
        const punti = [
          [s.x, s.y - v],
          [s.x + k, s.y - k],
          [s.x + r, s.y],
          [s.x + k, s.y + k],
          [s.x, s.y + v],
          [s.x - k, s.y + k],
          [s.x - r, s.y],
          [s.x - k, s.y - k],
        ]
          .map(([x, y]) => `${(x ?? 0).toFixed(2)},${(y ?? 0).toFixed(2)}`)
          .join(' ');
        return <polygon key={i} points={punti} fill="var(--color-oro-300)" {...anim} />;
      })}
    </svg>
  );
}

// ── Il sasso ─────────────────────────────────────────────────────────────

export type StatoSasso = 'chiuso' | 'aperto' | 'fatto' | 'attuale';

const COLORI: Record<StatoSasso, { sopra: string; lato: string }> = {
  chiuso: { sopra: 'var(--color-notte-900)', lato: 'var(--color-notte-950)' },
  aperto: { sopra: 'var(--color-panna-100)', lato: 'var(--color-panna-200)' },
  fatto: { sopra: 'var(--color-oro-400)', lato: 'var(--color-oro-500)' },
  attuale: { sopra: 'var(--color-oro-400)', lato: 'var(--color-oro-500)' },
};

/**
 * Un livello: un sasso piatto visto di 3/4 (52 px), col numero. Il bottone è più
 * grande del disegno (56×48) perché il dito ci arrivi sempre.
 */
export function Sasso({
  numero,
  gioco,
  stato,
  stelle,
  className,
  style,
  onTocca,
  rif,
  stelleDx = 0,
}: {
  numero: number;
  gioco: GameId;
  stato: StatoSasso;
  stelle: number;
  /** Px di cui spostare le stelline, se sotto c'è un altro sasso. */
  stelleDx?: number;
  className?: string;
  style?: CSSProperties;
  onTocca: () => void;
  rif?: Ref<HTMLButtonElement>;
}) {
  const c = COLORI[stato];
  const chiuso = stato === 'chiuso';
  return (
    <div className={`absolute -translate-x-1/2 -translate-y-1/2 ${className ?? ''}`} style={style}>
      <button
        ref={rif}
        disabled={chiuso}
        onClick={onTocca}
        aria-label={`Livello ${numero}: ${GIOCHI[gioco].titolo}${chiuso ? ', chiuso' : ''}`}
        className="relative flex h-12 w-14 items-center justify-center active:translate-y-0.5"
      >
        <svg viewBox="0 0 56 42" width={56} height={42} aria-hidden className="overflow-visible">
          {/* ombra piatta, spostata in basso a destra */}
          <ellipse cx="30.5" cy="25.5" rx="24" ry="11.5" fill="var(--color-inchiostro)" opacity="0.35" />
          {stato === 'attuale' && <ellipse cx="28" cy="20" rx="27.5" ry="15" fill="var(--color-panna-50)" />}
          <path d="M4 17v5.5a24 11.5 0 0 0 48 0V17z" fill={c.lato} stroke="var(--color-inchiostro)" strokeWidth="1.4" />
          <ellipse cx="28" cy="17" rx="24" ry="11.5" fill={c.sopra} stroke="var(--color-inchiostro)" strokeWidth="1.4" />
          {!chiuso && (
            <text
              x="28"
              y="17.5"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-corpo)"
              fontWeight="900"
              fontSize={numero >= 100 ? 13 : 16.5}
              fill="var(--color-inchiostro)"
            >
              {numero}
            </text>
          )}
        </svg>
        {chiuso && (
          <span className="absolute inset-x-0 top-[13px] flex justify-center text-panna-100/75">
            <Icona nome="lucchetto" className="h-4 w-4" />
          </span>
        )}
      </button>
      {stato === 'fatto' && <StellineSasso n={stelle} dx={stelleDx} />}
    </div>
  );
}

/**
 * Le stelline sotto un sasso fatto: in una pillola scura piatta, così si staccano dai
 * puntini d'oro del sentiero e dalla roccia. Le vuote sono solo un contorno crema.
 */
function StellineSasso({ n, dx }: { n: number; dx: number }) {
  return (
    <div
      className="pointer-events-none absolute top-[42px] flex -translate-x-1/2 gap-px rounded-full bg-notte-950/85 px-1 py-0.5"
      style={{ left: `calc(50% + ${dx}px)` }}
      aria-label={`${n} stelle su 3`}
    >
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
          <path
            d={STELLA}
            fill={i <= n ? 'var(--color-oro-400)' : 'none'}
            stroke={i <= n ? 'var(--color-oro-600)' : 'var(--color-panna-100)'}
            strokeWidth={i <= n ? 1.2 : 1.8}
            strokeLinejoin="round"
            opacity={i <= n ? 1 : 0.7}
          />
        </svg>
      ))}
    </div>
  );
}

// ── Il fumetto «Gioca!» ───────────────────────────────────────────────────

export function Fumetto({
  gioco,
  spostamento,
  distanza,
  sotto,
  className,
  style,
}: {
  gioco: GameId;
  /** Di quanti px il centro del fumetto è spostato dal sasso (vedi `disponi`). */
  spostamento: number;
  /** Px tra il centro del sasso e il fumetto. */
  distanza: number;
  /** Il fumetto sta sotto il sasso, con la coda in su. */
  sotto: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { w, h } = MISURE.fumetto;
  // La base della coda: sopra/sotto il sasso se si può, se no il più vicino possibile.
  const coda = Math.max(spostamento - w / 2 + 18, Math.min(spostamento + w / 2 - 18, 0));
  const base = sotto ? distanza + 2 : -distanza - 2;
  const punta = sotto ? 15 : -19;
  return (
    <div className={`pointer-events-none absolute h-0 w-0 ${className ?? ''}`} style={style} aria-hidden>
      <div className="animate-galleggia-scatti absolute inset-0">
        {/* La coda punta sempre al sasso, anche quando il fumetto sta più in là. */}
        <svg className="absolute" style={{ left: -170, top: -150, width: 340, height: 300 }} viewBox="-170 -150 340 300" aria-hidden>
          <polygon points={`${coda - 8},${base} ${coda + 8},${base} 0,${punta}`} fill="var(--color-panna-50)" />
        </svg>
        <div
          className="absolute flex items-center gap-1.5 rounded-2xl bg-panna-50 px-2 py-1.5 text-inchiostro shadow-[3px_4px_0_rgb(0_0_0/0.28)]"
          style={{ left: spostamento - w / 2, width: w, height: h, ...(sotto ? { top: distanza } : { bottom: distanza }) }}
        >
          <IconaGioco gioco={gioco} className="h-8 w-8" />
          <span className="min-w-0 flex-1 text-left">
            <span className="titolo block text-[17px] leading-tight font-semibold">Gioca!</span>
            <span className="block truncate text-[11px] leading-tight text-inchiostro-chiaro">{GIOCHI[gioco].titolo}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Il bimbo mago e il gatto nero ─────────────────────────────────────────

const { mago: MAGO, gatto: GATTO, gruppo: GRUPPO } = MISURE;

/**
 * Bimbo e gatto in piedi accanto al sasso attuale, dove li mette `disponi` (lato,
 * distanza dal sasso, piedi). A destra si girano: guardano sempre il sasso. Il gatto
 * sta dalla parte del sasso. Respirano a scatti.
 */
export function Personaggi({
  posto: { lato, distanza, piedi },
  className,
  style,
}: {
  posto: PostoPersonaggi;
  className?: string;
  style?: CSSProperties;
}) {
  const sposta =
    lato === 'sx'
      ? `translate(calc(-100% - ${distanza}px), calc(-100% + ${piedi}px))`
      : `translate(${distanza}px, calc(-100% + ${piedi}px)) scaleX(-1)`;
  return (
    <div className={`pointer-events-none absolute ${className ?? ''}`} style={{ transform: sposta, ...style }} aria-hidden>
      <div className="arco relative" style={{ width: GRUPPO.w, height: MAGO.h }}>
        <Immagine
          src="/personaggi/mago.webp"
          className="animate-respiro-scatti absolute bottom-0 left-0 origin-bottom"
          style={{ width: MAGO.w, height: MAGO.h }}
          segnaposto={<MagoFinto />}
        />
        <Immagine
          src="/personaggi/gatto.webp"
          className="animate-respiro-scatti absolute right-0 bottom-0 origin-bottom"
          style={{ width: GATTO.w, height: GATTO.h, animationDelay: '-0.8s' }}
          segnaposto={<GattoFinto />}
        />
      </div>
    </div>
  );
}

// ── La bandierina d'oro: isola con tutte e 15 le stelle ──────────────────

export function Bandierina({ style }: { style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 22 28"
      width={22}
      height={28}
      className="pointer-events-none absolute -translate-x-[3px] -translate-y-full"
      style={style}
      aria-label="Isola d'oro: 15 stelle su 15"
    >
      <line x1="3" y1="27.5" x2="3" y2="1.5" stroke="var(--color-inchiostro)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3.8 2.5 20 7.5 3.8 12.5z" fill="var(--color-oro-400)" stroke="var(--color-inchiostro)" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

// ── L'etichetta che resta ferma in alto ──────────────────────────────────


export function Etichetta({
  titolo,
  nome,
  fatti,
  stelle,
}: {
  titolo: string;
  nome: string;
  /** Quali dei 5 livelli hanno almeno una stella. */
  fatti: boolean[];
  stelle: number;
}) {
  return (
    <div className="pointer-events-none sticky top-[calc(env(safe-area-inset-top)+3.9rem)] z-[25] h-0">
      <div className="absolute top-0 left-3 rounded-2xl bg-panna-100 px-3 py-1.5 text-inchiostro shadow-[3px_4px_0_rgb(0_0_0/0.28)]">
        <p className="text-sm leading-tight whitespace-nowrap">
          <span className="font-extrabold">{titolo}</span> · <span className="titolo font-semibold italic">{nome}</span>
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          {fatti.map((f, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full border-[1.5px] border-inchiostro ${f ? 'bg-oro-400' : 'bg-transparent opacity-35'}`}
            />
          ))}
          <span className="ml-1 flex items-center gap-0.5 text-xs font-bold tabular-nums">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
              <path d={STELLA} fill="var(--color-oro-400)" stroke="var(--color-inchiostro)" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            {stelle}/15
          </span>
        </div>
      </div>
    </div>
  );
}
