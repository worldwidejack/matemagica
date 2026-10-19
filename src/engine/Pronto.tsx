import { Bottone, Icona, Scheda } from '@/ui/kit';

type Props = {
  titolo: string;
  hint: string;
  etichetta?: string;
  bravura: number;
  record: number;
  tipo: 'arcade' | 'puzzle';
  onVia: () => void;
  onEsci: () => void;
};

/** La schermata prima della partita, uguale per tutti i giochi. */
export function Pronto({ titolo, hint, etichetta, bravura, record, tipo, onVia, onEsci }: Props) {
  return (
    <div className="cielo-stellato relative flex min-h-full flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <button onClick={onEsci} className="absolute top-[calc(env(safe-area-inset-top)+1rem)] left-4 text-panna-100/70" aria-label="Esci">
        <Icona nome="chiudi" className="h-7 w-7" />
      </button>
      {etichetta && <p className="text-sm font-bold tracking-[0.2em] text-oro-300 uppercase">{etichetta}</p>}
      <h1 className="text-4xl font-semibold text-panna-50">{titolo}</h1>
      <Scheda className="w-full max-w-xs text-left">
        <p className="text-lg leading-snug">{hint}</p>
        <p className="mt-3 flex items-center gap-2 text-sm text-inchiostro-chiaro">
          <Icona nome={tipo === 'arcade' ? 'fulmine' : 'stella'} className="h-4 w-4" />
          {tipo === 'arcade' ? 'Arcade · a tempo, 3 vite' : 'Rompicapo · niente fretta, ci sono gli aiuti'}
        </p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-sm text-inchiostro-chiaro">
            <span>Bravura</span>
            <span className="font-bold text-inchiostro">{bravura.toFixed(1)} / 10</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-panna-200">
            <div className="h-full rounded-full bg-oro-500" style={{ width: `${bravura * 10}%` }} />
          </div>
          {record > 0 && <p className="mt-2 text-sm text-inchiostro-chiaro">Record: {record}</p>}
        </div>
      </Scheda>
      <Bottone onClick={onVia} respira className="mt-2 px-16">
        Via!
      </Bottone>
    </div>
  );
}
