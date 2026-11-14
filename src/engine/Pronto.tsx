import { Barra, Bottone, Icona, Scheda } from '@/ui/kit';

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

/** La schermata prima della partita, uguale per tutti i giochi: una riga su cosa fare e «Via!». */
export function Pronto({ titolo, hint, etichetta, bravura, record, tipo, onVia, onEsci }: Props) {
  return (
    <div className="animate-entra relative flex min-h-full flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <button onClick={onEsci} className="absolute top-4 left-3 p-2 text-panna-50/80" aria-label="Esci">
        <Icona nome="chiudi" className="h-7 w-7" />
      </button>
      {etichetta && <p className="titolo rounded-full bg-inchiostro/25 px-4 py-1.5 text-sm font-bold text-panna-50">{etichetta}</p>}
      <h1 className="text-[2.6rem] leading-none font-bold text-panna-50">{titolo}</h1>
      <Scheda className="w-full max-w-xs text-left">
        <p className="text-lg leading-snug font-semibold">{hint}</p>
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-inchiostro-chiaro">
          <Icona nome={tipo === 'arcade' ? 'fulmine' : 'stella'} className="h-4 w-4 shrink-0" />
          {tipo === 'arcade' ? 'A tempo, 3 vite' : 'Niente fretta, ci sono gli aiuti'}
        </p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-sm text-inchiostro-chiaro">
            <span>Bravura</span>
            <span className="font-bold text-inchiostro">{bravura.toFixed(1)} / 10</span>
          </div>
          <Barra quota={bravura / 10} />
          {record > 0 && <p className="mt-2 text-sm text-inchiostro-chiaro">Record: {record}</p>}
        </div>
      </Scheda>
      <Bottone onClick={onVia} respira className="mt-2 min-w-56">
        Via!
      </Bottone>
    </div>
  );
}
