import { useEffect } from 'react';
import { suona } from '@/audio/sfx';
import type { GameId } from '@/engine/cartuccia';
import { SPIEGAZIONI } from '@/content/spiegazioni';
import { STORIE } from '@/content/storie';
import { trovaCarta } from '@/content/stelle';
import { GIOCHI } from '@/games/registro';
import { Bottone, IconaGioco, Scheda } from './kit';

/** La mini-lezione che precede la prima partita a un gioco. */
export function SpiegazioneSchermo({ gioco, onAvanti }: { gioco: GameId; onAvanti: () => void }) {
  const s = SPIEGAZIONI[gioco];
  const v = GIOCHI[gioco];
  return (
    <div className="flex min-h-full flex-col justify-center gap-5 px-6 py-8">
      <div className="flex items-center gap-4">
        <IconaGioco gioco={gioco} className="animate-pop h-20 w-20" />
        <div>
          <p className="titolo text-sm font-bold text-panna-50/80">Gioco nuovo</p>
          <h1 className="text-[2.1rem] leading-none font-bold text-panna-50">{v.titolo}</h1>
        </div>
      </div>
      <Scheda className="flex flex-col gap-4 p-5">
        <Blocco titolo="Come si gioca">{s.come}</Blocco>
        <Blocco titolo="Il trucco">{s.trucco}</Blocco>
        <p className="titolo rounded-2xl bg-carta px-4 py-3 text-lg font-semibold tabular-nums">{s.esempio}</p>
      </Scheda>
      <div className="flex items-end gap-3">
        <img src="/personaggi/gatto-indica.webp" alt="" draggable={false} className="animate-respiro-scatti h-24 w-auto origin-bottom" />
        <Bottone freccia respira className="mb-1 flex-1 px-4" onClick={onAvanti}>
          Si gioca
        </Bottone>
      </div>
    </div>
  );
}

function Blocco({ titolo, children }: { titolo: string; children: string }) {
  return (
    <div>
      <p className="titolo text-sm font-bold text-inchiostro-chiaro">{titolo}</p>
      <p className="mt-0.5 text-lg leading-snug">{children}</p>
    </div>
  );
}

/** Una storia: premio del viaggio, o carta riaperta dalla collezione. */
export function StoriaSchermo({ id, nuova, onAvanti }: { id: string; nuova: boolean; onAvanti: () => void }) {
  const s = trovaCarta(id, STORIE);
  useEffect(() => {
    if (nuova) suona('livello');
  }, [nuova]);
  if (!s) return null;
  // Le carte delle stelle sono d'inchiostro con le scritte gialle; le storie, di carta.
  const stella = s.id.startsWith('stella-');
  return (
    <div className="flex min-h-full flex-col justify-center gap-5 px-6 py-8">
      {nuova && (
        <p className="animate-pop titolo self-center rounded-full bg-oro-400 px-4 py-1.5 text-sm font-bold text-inchiostro">
          {stella ? 'Nuova carta delle stelle' : 'Nuova carta'}
        </p>
      )}
      <div
        className={`animate-carta rounded-[2rem] p-6 shadow-[0_8px_0_rgb(21_19_46/0.25)] ${
          stella ? 'bg-inchiostro text-panna-50' : 'bg-panna-50 text-inchiostro'
        }`}
      >
        <div className="text-center text-6xl">{s.emoji}</div>
        <p className={`titolo mt-3 text-center text-sm font-bold ${stella ? 'text-oro-300' : 'text-oro-700'}`}>{s.carta}</p>
        <h1 className="mt-1 text-center text-3xl leading-tight font-bold">{s.titolo}</h1>
        <p className="mt-3 text-lg leading-relaxed">{s.testo}</p>
      </div>
      <Bottone freccia onClick={onAvanti}>
        Continua
      </Bottone>
    </div>
  );
}
