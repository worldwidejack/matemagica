import { useEffect, useState } from 'react';
import { suona } from '@/audio/sfx';
import { Icona } from './kit';

/**
 * "Metti Matemagica sul telefono": un'app installata si riapre da sola, una
 * scheda del browser si perde. Su Android c'è il pulsante vero del browser
 * (beforeinstallprompt); su iPhone si spiega il giro da Safari.
 */
type EventoInstalla = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let evento: EventoInstalla | null = null;
const ascoltatori = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    evento = e as EventoInstalla;
    ascoltatori.forEach((f) => f());
  });
}

function installata(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

function iPhone(): boolean {
  return typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
}

const CHIAVE_CHIUSO = 'matemagica-installa-chiuso';

function chiusoPrima(): boolean {
  try {
    return localStorage.getItem(CHIAVE_CHIUSO) === '1';
  } catch {
    return false;
  }
}

/** La scheda d'invito. `discreta` = si può chiudere e non torna più. */
export function Installa({ discreta }: { discreta?: boolean }) {
  const [, aggiorna] = useState(0);
  const [chiuso, setChiuso] = useState(() => discreta === true && chiusoPrima());
  const [istruzioni, setIstruzioni] = useState(false);

  useEffect(() => {
    const f = () => aggiorna((n) => n + 1);
    ascoltatori.add(f);
    return () => {
      ascoltatori.delete(f);
    };
  }, []);

  if (installata() || chiuso) return null;
  const android = evento !== null;
  if (!android && !iPhone()) return null;

  const chiudi = () => {
    try {
      localStorage.setItem(CHIAVE_CHIUSO, '1');
    } catch {
      /* niente: si richiude e basta */
    }
    setChiuso(true);
  };

  return (
    <div className="animate-pop relative rounded-3xl bg-panna-100 p-4 text-inchiostro shadow-[0_6px_20px_rgb(0_0_0/0.22)]">
      {discreta && (
        <button onClick={chiudi} className="absolute top-3 right-3 text-inchiostro-chiaro" aria-label="Chiudi">
          <Icona nome="chiudi" className="h-5 w-5" />
        </button>
      )}
      <div className="flex items-center gap-3 pr-6">
        <img src="/icona-192.png" alt="" className="h-12 w-12 rounded-2xl shadow" />
        <div>
          <p className="titolo text-lg font-semibold">Metti Matemagica sul telefono</p>
          <p className="text-sm text-inchiostro-chiaro">Si apre con un tocco, anche senza rete.</p>
        </div>
      </div>
      {android ? (
        <button
          onClick={() => {
            suona('tap');
            void evento?.prompt();
            void evento?.userChoice.then(() => {
              evento = null;
              aggiorna((n) => n + 1);
            });
          }}
          className="titolo mt-3 w-full rounded-full bg-oro-400 py-2.5 text-lg font-semibold shadow-[0_4px_0_var(--color-oro-600)] active:translate-y-0.5"
        >
          Installa
        </button>
      ) : istruzioni ? (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
          <li>
            Apri questa pagina in <b>Safari</b>.
          </li>
          <li>
            Tocca <b>Condividi</b> <Icona nome="condividi" className="inline h-4 w-4 align-[-2px]" /> in basso.
          </li>
          <li>
            Scegli <b>Aggiungi alla schermata Home</b>.
          </li>
        </ol>
      ) : (
        <button
          onClick={() => {
            suona('tap');
            setIstruzioni(true);
          }}
          className="titolo mt-3 w-full rounded-full bg-oro-400 py-2.5 text-lg font-semibold shadow-[0_4px_0_var(--color-oro-600)] active:translate-y-0.5"
        >
          Come si fa
        </button>
      )}
    </div>
  );
}
