import { WORLDS } from '@/content/worlds';

/**
 * M0 — pagina "hello".
 * Unico scopo: dimostrare che la catena push → build → deploy funziona, e che
 * il risultato si apre bene dal telefono. Verrà sostituita dalla mappa in M2.
 */
export default function App() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-night-900 px-6 py-12 text-center">
      <BackdropGlyphs />

      <div className="relative flex flex-col items-center gap-6">
        <Sigil />

        <div className="space-y-2">
          <h1 className="bg-gradient-to-b from-gold-400 to-gold-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
            Matemagica
          </h1>
          <p className="text-balance text-base text-teal-300/80">
            Palestra mentale matematica
          </p>
        </div>

        <div className="rounded-full border border-teal-400/30 bg-night-700/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal-300">
          M0 · fondazioni
        </div>

        <ul className="w-full max-w-xs space-y-2 text-left">
          {WORLDS.map((w, i) => (
            <li
              key={w.id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-night-800/70 px-4 py-3"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-night-600 text-xs font-bold text-gold-400">
                {i + 1}
              </span>
              <span className="text-sm text-white/70">{w.title}</span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-white/25">
                da fare
              </span>
            </li>
          ))}
        </ul>

        <p className="max-w-xs text-pretty text-xs leading-relaxed text-white/35">
          Se stai leggendo questo dal telefono, la catena push → deploy funziona.
          È tutto quello che M0 doveva dimostrare.
        </p>
      </div>
    </main>
  );
}

/** Il sigillo geometrico: cerchio, triangolo, quadrato che ruotano piano. */
function Sigil() {
  return (
    <svg viewBox="0 0 120 120" className="size-28" aria-hidden="true">
      <defs>
        <linearGradient id="sigil-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-gold-400)" />
          <stop offset="100%" stopColor="var(--color-gold-600)" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transformOrigin: '60px 60px' }}
        className="motion-safe:animate-[spin_28s_linear_infinite]"
      >
        <circle cx="60" cy="60" r="52" stroke="url(#sigil-gold)" strokeWidth="1.5" opacity="0.55" />
        <polygon
          points="60,16 98,82 22,82"
          stroke="var(--color-teal-400)"
          strokeWidth="2"
          opacity="0.9"
        />
        <rect
          x="32"
          y="32"
          width="56"
          height="56"
          rx="4"
          stroke="var(--color-magenta-400)"
          strokeWidth="1.5"
          opacity="0.5"
        />
      </g>
      <circle cx="60" cy="60" r="5" fill="var(--color-gold-400)" />
    </svg>
  );
}

/** Sfondo: due aloni morbidi, niente immagini — placeholder-first (§1.4). */
function BackdropGlyphs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-teal-500/15 blur-3xl" />
      <div className="absolute -bottom-32 right-[-20%] size-80 rounded-full bg-gold-500/10 blur-3xl" />
    </div>
  );
}
