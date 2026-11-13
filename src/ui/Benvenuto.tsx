import { useState } from 'react';
import { suona } from '@/audio/sfx';
import { MOTIVI } from '@/profilo/giornata';
import { Bottone } from './kit';
import { Segnalino } from './Segnalino';

/** L'obiettivo del giorno di partenza (3 partite): si cambia dal profilo. */
const OBIETTIVO_INIZIALE = 3;

/**
 * La prima apertura: un saluto, una domanda da un tocco, e subito il primo livello.
 * Niente account, niente moduli. (La domanda «quanto tempo al giorno» tolta il 18/10,
 * su richiesta di Jack.)
 */
export function Benvenuto({ onFine }: { onFine: (motivo: string, obiettivo: number) => void }) {
  // Si apre subito sulla domanda (Jack, 13/11); il passo 0 diventerà il volo nel mondo, dopo la domanda.
  const [passo, setPasso] = useState<0 | 1>(1);
  // Più risposte insieme (Jack, 13/11): nel profilo finiscono unite da una virgola.
  const [motivi, setMotivi] = useState<string[]>([]);
  const cambia = (id: string) => setMotivi((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  if (passo === 0) {
    return (
      <div className="cielo-stellato relative flex min-h-dvh flex-col overflow-hidden">
        <div className="relative px-6 pt-[calc(env(safe-area-inset-top)+3.5rem)] text-center">
          <h1 className="animate-pop text-6xl font-semibold text-panna-50 drop-shadow-lg">Matemagica</h1>
          <p className="titolo mt-3 text-xl text-balance text-panna-100 italic">Piccole sfide, grandi viaggi nella mente</p>
        </div>
        {/* Il paese dei numeri: un pezzo vero della strada, il fiore che sboccia e il gatto che aspetta. */}
        <div className="pointer-events-none flex min-h-0 flex-1 items-center justify-center py-4" aria-hidden>
          <div
            className="relative overflow-hidden rounded-[2rem] shadow-[0_10px_40px_rgb(0_0_0/0.45)]"
            style={{ width: 'min(86%, calc((100dvh - 24rem) * 0.9))', aspectRatio: '9 / 10' }}
          >
            <img
              src="/paese/p1.webp"
              alt=""
              className="absolute inset-y-0 h-full max-w-none"
              style={{ left: '-62%', width: 'auto' }}
            />
            <div className="absolute" style={{ left: '56%', top: '66%', transform: 'translate(-50%, -88%)' }}>
              <Segnalino famiglia="fiore-a" stato="attuale" numero={1} stelle={0} etichetta="" onTocca={() => {}} />
              <img
                src="/personaggi/gatto.webp"
                alt=""
                className="animate-respiro-scatti absolute origin-bottom"
                style={{ height: 70, right: '100%', bottom: 0, marginRight: -6 }}
              />
            </div>
          </div>
        </div>
        <div className="relative flex flex-col items-center gap-3 px-6 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
          <p className="max-w-xs text-center text-lg text-panna-50 drop-shadow">
            Un paese fatto di numeri, un passo dopo l'altro. Ogni fiore, cristallo e anello è un gioco che allena la mente.
          </p>
          <Bottone freccia respira className="w-full max-w-xs" onClick={() => setPasso(1)}>
            Iniziamo
          </Bottone>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-notte-900 px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      {/* La soglia (Jack, 13/11): il gatto in basso a sinistra, la porta di luce, il pavimento scuro. */}
      <img
        src="/schermate/soglia.webp"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[left_bottom]"
      />
      <div className="velo-soglia pointer-events-none absolute inset-0" aria-hidden />
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
          suona('stella');
          onFine(motivi.join(','), OBIETTIVO_INIZIALE);
        }}
      >
        Si parte
      </Bottone>
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
