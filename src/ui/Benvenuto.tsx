import { useState } from 'react';
import { suona } from '@/audio/sfx';
import { SCENE } from '@/content/scene';
import { MOTIVI, OBIETTIVI } from '@/profilo/giornata';
import { Bottone } from './kit';

/**
 * La prima apertura, come Duolingo: un saluto, due domande da un tocco,
 * e subito il primo livello. Niente account, niente moduli.
 */
export function Benvenuto({ onFine }: { onFine: (motivo: string, obiettivo: number) => void }) {
  const [passo, setPasso] = useState<0 | 1 | 2>(0);
  const [motivo, setMotivo] = useState<string | null>(null);
  const scena = SCENE[0];

  if (passo === 0) {
    return (
      <div className="relative flex min-h-full flex-col">
        {scena && <img src={scena.file} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-notte-900/85 via-notte-900/10 to-notte-900/90" />
        <div className="relative px-6 pt-[calc(env(safe-area-inset-top)+3.5rem)] text-center">
          <h1 className="animate-pop text-6xl font-semibold text-panna-50 drop-shadow-lg">Matemagica</h1>
          <p className="titolo mt-3 text-xl text-panna-100 italic">Piccole sfide, grandi viaggi nella mente</p>
        </div>
        <div className="relative mt-auto flex flex-col items-center gap-3 px-6 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
          <p className="max-w-xs text-center text-lg text-panna-50 drop-shadow">
            Un paese sul mare, un sentiero fino alla torre. Ogni gradino è un gioco che allena la mente.
          </p>
          <Bottone freccia respira className="w-full max-w-xs" onClick={() => setPasso(1)}>
            Iniziamo
          </Bottone>
        </div>
      </div>
    );
  }

  return (
    <div className="cielo-stellato flex min-h-full flex-col px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="flex gap-2" aria-hidden>
        {[1, 2].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= passo ? 'bg-oro-400' : 'bg-panna-100/20'}`} />
        ))}
      </div>

      {passo === 1 ? (
        <>
          <h1 className="mt-8 text-4xl font-semibold text-panna-50">Perché sei qui?</h1>
          <p className="mt-2 text-panna-100/75">Nessuna risposta sbagliata.</p>
          <div className="mt-6 flex flex-col gap-3">
            {MOTIVI.map((m) => (
              <Scelta key={m.id} attiva={motivo === m.id} onClick={() => setMotivo(m.id)}>
                <span className="text-2xl">{m.icona}</span>
                <span className="titolo text-xl font-semibold">{m.testo}</span>
              </Scelta>
            ))}
          </div>
          <Bottone freccia className="mt-auto" disabled={!motivo} onClick={() => setPasso(2)}>
            Avanti
          </Bottone>
        </>
      ) : (
        <>
          <h1 className="mt-8 text-4xl font-semibold text-panna-50">Quanto tempo al giorno?</h1>
          <p className="mt-2 text-panna-100/75">Diventa il tuo obiettivo del giorno. Lo cambi quando vuoi.</p>
          <div className="mt-6 flex flex-col gap-3">
            {OBIETTIVI.map((o) => (
              <Scelta
                key={o.partite}
                onClick={() => {
                  suona('stella');
                  onFine(motivo ?? 'mente', o.partite);
                }}
              >
                <span className="titolo text-xl font-semibold">{o.durata}</span>
                <span className="ml-auto text-sm text-inchiostro-chiaro">
                  {o.nome} · {o.partite} {o.partite === 1 ? 'partita' : 'partite'}
                </span>
              </Scelta>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Scelta({ children, attiva, onClick }: { children: React.ReactNode; attiva?: boolean; onClick: () => void }) {
  return (
    <button
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
