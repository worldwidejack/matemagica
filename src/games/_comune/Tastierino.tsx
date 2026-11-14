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
    <div className="grid grid-cols-3 gap-x-2 gap-y-3 pb-1">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((t) => (
        <button
          key={t}
          onClick={() => tasto(t)}
          disabled={disabilitato}
          className={[
            'titolo rounded-2xl py-2 text-[1.65rem] leading-8 font-bold tabular-nums transition-transform duration-75 active:translate-y-1 disabled:opacity-40',
            t === 'OK'
              ? 'bg-oro-400 text-inchiostro shadow-[0_4px_0_var(--color-oro-600)]'
              : t === '⌫'
                ? 'bg-inchiostro/25 text-panna-50 shadow-[0_4px_0_rgb(21_19_46/0.12)]'
                : 'bg-panna-50 text-inchiostro shadow-[0_4px_0_rgb(21_19_46/0.2)]',
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
    <div className="mx-auto min-w-32 ombra-dura rounded-2xl bg-panna-50 text-inchiostro px-6 py-2 text-center text-4xl titolo font-bold tabular-nums">
      {valore || <span className="text-inchiostro/25">{segnaposto}</span>}
    </div>
  );
}
