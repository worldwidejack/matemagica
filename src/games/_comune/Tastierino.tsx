import { suona } from '@/audio/sfx';

type Props = {
  valore: string;
  onCambia: (v: string) => void;
  onInvia: () => void;
  disabilitato?: boolean;
  maxCifre?: number;
};

/** Tastierino numerico grande, per le risposte dei rompicapo. */
export function Tastierino({ valore, onCambia, onInvia, disabilitato, maxCifre = 7 }: Props) {
  const tasto = (t: string) => {
    if (disabilitato) return;
    suona('tap');
    if (t === '⌫') return onCambia(valore.slice(0, -1));
    if (t === 'OK') return valore.length > 0 && onInvia();
    if (valore.length >= maxCifre) return;
    onCambia(valore === '0' ? t : valore + t);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((t) => (
        <button
          key={t}
          onClick={() => tasto(t)}
          disabled={disabilitato}
          className={[
            'rounded-2xl py-2.5 text-2xl font-bold active:scale-95 disabled:opacity-40',
            t === 'OK' ? 'bg-oro-500 text-notte-900' : t === '⌫' ? 'bg-notte-800 text-white/70' : 'bg-notte-700',
          ].join(' ')}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/** Il display della risposta, sopra il tastierino. */
export function Display({ valore, segnaposto = '?' }: { valore: string; segnaposto?: string }) {
  return (
    <div className="mx-auto min-w-32 rounded-2xl border-2 border-oro-500/60 bg-notte-800 px-6 py-2 text-center text-4xl font-bold tabular-nums">
      {valore || <span className="text-white/25">{segnaposto}</span>}
    </div>
  );
}
