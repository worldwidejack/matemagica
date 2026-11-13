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
    <div className="cielo-stellato flex min-h-dvh flex-col px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <h1 className="mt-8 text-4xl font-semibold text-panna-50">Perché sei qui?</h1>
      <p className="mt-2 text-panna-100/75">Scegli tutte quelle che vuoi.</p>
      <div className="mt-6 mb-6 flex flex-col gap-3">
        {MOTIVI.map((m) => (
          <Scelta key={m.id} attiva={motivi.includes(m.id)} onClick={() => cambia(m.id)}>
            <span className="text-2xl">{m.icona}</span>
            <span className="titolo text-xl font-semibold">{m.testo}</span>
          </Scelta>
        ))}
      </div>
      <Bottone
        freccia
        className="mt-auto"
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
        'flex items-center gap-3 rounded-3xl px-5 py-4 text-left text-inchiostro transition-transform active:translate-y-1',
        attiva
          ? 'bg-oro-400 shadow-[0_5px_0_var(--color-oro-600)]'
          : 'bg-panna-100 shadow-[0_5px_0_var(--color-panna-200)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
