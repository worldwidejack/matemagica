import type { ReactNode } from 'react';
import type { GameId } from './cartuccia';
import { Bottone, Icona, IconaGioco } from '@/ui/kit';

type Props = {
  gioco: GameId;
  titolo: string;
  hint: string;
  etichetta?: string;
  bravura: number;
  record: number;
  tipo: 'arcade' | 'puzzle';
  onVia: () => void;
  onEsci: () => void;
};

/**
 * La schermata prima della partita, uguale per tutti i giochi: la tessera del gioco, una riga
 * su cosa fare, e il gatto pronto a scattare sopra «Via!», a portata di pollice.
 */
export function Pronto({ gioco, titolo, hint, etichetta, bravura, record, tipo, onVia, onEsci }: Props) {
  return (
    <div className="animate-entra relative flex min-h-full flex-col px-5 pt-3 pb-6 text-center">
      <div className="flex items-center justify-between">
        <button onClick={onEsci} className="grid h-10 w-10 place-items-center rounded-full bg-inchiostro/20 text-panna-50 active:scale-90" aria-label="Esci">
          <Icona nome="chiudi" className="h-5 w-5" />
        </button>
        {etichetta && <p className="titolo rounded-full bg-inchiostro/25 px-4 py-1.5 text-sm font-bold text-panna-50">{etichetta}</p>}
        <span className="w-10" aria-hidden />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-24">
        <IconaGioco gioco={gioco} className="animate-pop h-28 w-28 -rotate-3" />
        <h1 className="text-[2.6rem] leading-none font-bold text-panna-50 [text-shadow:0_3px_0_rgb(21_19_46/0.18)]">{titolo}</h1>
        <p className="max-w-[18rem] text-xl leading-snug font-bold text-panna-50/90">{hint}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Gettone>
            <Icona nome={tipo === 'arcade' ? 'fulmine' : 'stella'} className="h-4 w-4 shrink-0" />
            {tipo === 'arcade' ? 'A tempo · 3 vite' : 'Niente fretta'}
          </Gettone>
          <Gettone>Bravura {bravura.toFixed(1)}</Gettone>
          {record > 0 && <Gettone>Record {record}</Gettone>}
        </div>
      </div>

      <div className="relative">
        <img
          src="/personaggi/gatto-pronto.webp"
          alt=""
          draggable={false}
          className="animate-respiro-scatti pointer-events-none absolute bottom-full left-3 -mb-1.5 h-24 w-auto origin-bottom"
        />
        <Bottone onClick={onVia} respira className="w-full py-4 text-2xl">
          Via!
        </Bottone>
      </div>
    </div>
  );
}

function Gettone({ children }: { children: ReactNode }) {
  return <span className="titolo flex items-center gap-1.5 rounded-full bg-inchiostro/25 px-3.5 py-1.5 text-sm font-bold text-panna-50">{children}</span>;
}
