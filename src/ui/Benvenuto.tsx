import { useRef, useState } from 'react';
import { menoMovimento } from '@/anim/orologio';
import { suona } from '@/audio/sfx';
import { MOTIVI } from '@/profilo/giornata';
import { Bottone } from './kit';

/** L'obiettivo del giorno di partenza (3 partite): si cambia dal profilo. */
const OBIETTIVO_INIZIALE = 3;

/** La tela dei disegni dell'intro e il vano della porta spalancata (da lì parte la luce). */
const TELA = { w: 1024, h: 1536 };
const VANO = { x: 690, y: 676, w: 200, h: 352 };
/** Quanto a sinistra sta la finestra sul disegno: gatto intero, porta sul bordo destro (Jack, 14/11). */
const FUOCO_X = 0.49;

/**
 * La scaletta di «Si parte» (Jack, 23/11: niente camminata verso la porta): il gatto smette di
 * salutare, si alza e si gira verso la porta mentre si spalanca; poi la luce riempie lo schermo
 * e ci porta nel paese. Ogni quadro è un disegno intero: [millisecondi, porta, gatto].
 */
const SCALETTA: [number, number, number][] = [
  [240, 2, 2],
  [370, 2, 3],
  [500, 3, 4],
  [960, 4, 5],
  [1120, 5, 5],
];
const LUCE_DA = 1120;
const QUADRI = [1, 2, 3, 4, 5];

const aspetta = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * La prima apertura: una domanda da un tocco, la porta che si spalanca, e subito il paese.
 * Niente account, niente moduli. (La domanda «quanto tempo al giorno» tolta il 18/10,
 * su richiesta di Jack.)
 */
export function Benvenuto({ onFine }: { onFine: (motivo: string, obiettivo: number) => void }) {
  // Più risposte insieme (Jack, 13/11): nel profilo finiscono unite da una virgola.
  const [motivi, setMotivi] = useState<string[]>([]);
  const cambia = (id: string) => setMotivi((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  const [porta, setPorta] = useState(false);
  const [quadro, setQuadro] = useState({ porta: 1, gatto: 1 });
  const scena = useRef<HTMLDivElement>(null);
  const luce = useRef<HTMLDivElement>(null);
  const bianco = useRef<HTMLDivElement>(null);

  const entra = async () => {
    const box = scena.current?.getBoundingClientRect();
    const l = luce.current;
    const b = bianco.current;
    const fine = () => onFine(motivi.join(','), OBIETTIVO_INIZIALE);
    if (!box || !l || !b) return fine();
    // Dove cade il vano della porta: i disegni sono in object-cover, ancorati in basso.
    const s = Math.max(box.width / TELA.w, box.height / TELA.h);
    const sx = (box.width - TELA.w * s) * FUOCO_X;
    const alto = box.height - TELA.h * s;
    const vano = { x: sx + VANO.x * s, y: alto + VANO.y * s, w: VANO.w * s, h: VANO.h * s };
    Object.assign(l.style, {
      left: `${vano.x}px`,
      top: `${vano.y}px`,
      width: `${vano.w}px`,
      height: `${vano.h}px`,
    });
    const k = menoMovimento() ? 0.05 : 1;
    try {
      // 1. Le scritte si spengono (transizione CSS su `porta`); il gatto si gira, la porta si apre.
      let ora = 0;
      for (const [quando, p, g] of SCALETTA) {
        await aspetta((quando - ora) * k);
        ora = quando;
        setQuadro({ porta: p, gatto: g });
        if (p === 3 && g === 4) suona('combo');
      }
      await aspetta((LUCE_DA - ora) * k);
      // 2. La luce della porta spalancata cresce e riempie lo schermo.
      suona('livello');
      const cresce = (Math.max(box.width, box.height) / Math.min(vano.w, vano.h)) * 2.6;
      l.animate(
        [
          { opacity: 0, transform: 'scale(1)' },
          { opacity: 0.95, transform: 'scale(1.3)', offset: 0.25 },
          { opacity: 1, transform: `scale(${cresce})` },
        ],
        { duration: 760 * k, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' },
      );
      await b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420 * k, delay: 380 * k, easing: 'ease-in', fill: 'forwards' }).finished;
    } catch {
      // Animazione interrotta (pagina chiusa): si va avanti lo stesso.
    }
    fine();
  };

  return (
    <div
      ref={scena}
      className="relative flex min-h-dvh flex-col overflow-hidden bg-notte-900 px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]"
    >
      {/* La scena dell'intro (Jack, 14/11): il gatto che saluta nel fascio di luce, la porta socchiusa a destra.
          Tutti i quadri sono già in pagina (nascosti): al «Si parte» non si aspetta nessun caricamento. */}
      {QUADRI.map((n) => (
        <img
          key={`p${n}`}
          src={`/intro/porta-${n}.webp`}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${FUOCO_X * 100}% 100%`, visibility: n === quadro.porta ? 'visible' : 'hidden' }}
        />
      ))}
      {QUADRI.map((n) => (
        <img
          key={`g${n}`}
          src={`/intro/gatto-${n}.webp`}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${FUOCO_X * 100}% 100%`, visibility: n === quadro.gatto ? 'visible' : 'hidden' }}
        />
      ))}
      <div
        className={`velo-soglia pointer-events-none absolute inset-0 transition-opacity duration-300 ${porta ? 'opacity-0' : ''}`}
        aria-hidden
      />
      {/* La luce della porta socchiusa: si accende, poi cresce fino a riempire lo schermo. */}
      <div
        ref={luce}
        aria-hidden
        className="pointer-events-none absolute z-20 opacity-0 mix-blend-screen"
        style={{
          borderRadius: '50% 50% 4px 4px / 18% 18% 4px 4px',
          background: 'radial-gradient(ellipse at 50% 55%, var(--color-panna-50) 0%, var(--color-oro-300) 55%, rgb(255 255 255 / 0) 100%)',
          transformOrigin: '50% 60%',
        }}
      />
      <div ref={bianco} aria-hidden className="pointer-events-none absolute inset-0 z-30 bg-oro-300 opacity-0" />
      <div className={`relative flex flex-1 flex-col transition-opacity duration-300 ${porta ? 'pointer-events-none opacity-0' : ''}`}>
      <h1 className="relative mt-8 text-[2.6rem] leading-none font-extrabold text-panna-50 [text-shadow:0_3px_0_rgb(10_17_80)]">
        Perché sei qui?
      </h1>
      <p className="relative mt-2 text-[1.05rem] font-bold text-panna-100/85">Scegli tutte quelle che vuoi.</p>
      <div className="relative mt-5 mb-6 flex flex-col gap-3">
        {MOTIVI.map((m) => (
          <Scelta key={m.id} attiva={motivi.includes(m.id)} onClick={() => cambia(m.id)}>
            <span className="w-8 text-center text-2xl">{m.icona}</span>
            <span className="flex-1 text-[1.2rem] leading-tight font-extrabold">{m.testo}</span>
            <span
              aria-hidden
              className={[
                'grid h-7 w-7 shrink-0 place-items-center rounded-[9px] border-[3px] border-inchiostro text-lg leading-none font-black',
                motivi.includes(m.id) ? 'bg-inchiostro text-oro-400' : '',
              ].join(' ')}
            >
              {motivi.includes(m.id) ? '✓' : ''}
            </span>
          </Scelta>
        ))}
      </div>
      <Bottone
        freccia
        className="relative mt-auto py-4 text-2xl font-extrabold disabled:!opacity-100 disabled:brightness-90 disabled:grayscale-[0.7]"
        disabled={motivi.length === 0}
        onClick={() => {
          if (porta) return;
          suona('stella');
          setPorta(true);
          void entra();
        }}
      >
        Si parte
      </Bottone>
      </div>
    </div>
  );
}

function Scelta({ children, attiva, onClick }: { children: React.ReactNode; attiva?: boolean; onClick: () => void }) {
  return (
    <button
      role="checkbox"
      aria-checked={!!attiva}
      onClick={() => {
        suona('tap');
        onClick();
      }}
      className={[
        'flex min-h-[3.9rem] items-center gap-3 rounded-3xl px-4 py-2.5 text-left text-inchiostro transition-transform active:translate-y-1',
        attiva
          ? 'bg-oro-400 shadow-[0_5px_0_var(--color-oro-600)]'
          : 'bg-panna-100 shadow-[0_5px_0_var(--color-panna-200)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
