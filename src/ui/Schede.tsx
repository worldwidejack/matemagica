import { useEffect } from 'react';
import { suona } from '@/audio/sfx';
import type { GameId } from '@/engine/cartuccia';
import { SPIEGAZIONI } from '@/content/spiegazioni';
import { STORIE } from '@/content/storie';
import { GIOCHI } from '@/games/registro';
import { Bottone, IconaGioco, Scheda } from './kit';

/** La mini-lezione che precede la prima partita a un gioco. */
export function SpiegazioneSchermo({ gioco, onAvanti }: { gioco: GameId; onAvanti: () => void }) {
  const s = SPIEGAZIONI[gioco];
  const v = GIOCHI[gioco];
  return (
    <div className="cielo-stellato mx-auto flex min-h-full max-w-md flex-col justify-center gap-5 px-6 py-10">
      <p className="text-sm font-bold tracking-[0.2em] text-oro-300 uppercase">Gioco nuovo</p>
      <div className="flex items-center gap-4">
        <IconaGioco gioco={gioco} className="animate-pop h-20 w-20" />
        <h1 className="text-4xl font-semibold text-panna-50">{v.titolo}</h1>
      </div>
      <Scheda className="flex flex-col gap-4 p-5">
        <Blocco titolo="Come si gioca">{s.come}</Blocco>
        <Blocco titolo="Il trucco">{s.trucco}</Blocco>
        <p className="rounded-2xl bg-panna-50 px-4 py-3 text-lg tabular-nums">{s.esempio}</p>
      </Scheda>
      <Bottone freccia className="mt-2" onClick={onAvanti}>
        Ho capito, si gioca
      </Bottone>
    </div>
  );
}

function Blocco({ titolo, children }: { titolo: string; children: string }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-wider text-inchiostro-chiaro uppercase">{titolo}</p>
      <p className="mt-1 text-lg leading-snug">{children}</p>
    </div>
  );
}

/** Una storia: premio del sentiero, o carta riaperta dalla collezione. */
export function StoriaSchermo({ id, nuova, onAvanti }: { id: string; nuova: boolean; onAvanti: () => void }) {
  const s = STORIE.find((x) => x.id === id);
  useEffect(() => {
    if (nuova) suona('livello');
  }, [nuova]);
  if (!s) return null;
  return (
    <div className="cielo-stellato mx-auto flex min-h-full max-w-md flex-col justify-center gap-5 px-6 py-10">
      {nuova && <p className="animate-pop text-center text-sm font-bold tracking-[0.2em] text-oro-300 uppercase">Nuova carta!</p>}
      <div className="animate-carta rounded-[2rem] border-[6px] border-panna-50 bg-panna-100 p-6 text-inchiostro shadow-[0_12px_40px_rgb(0_0_0/0.4)] outline-2 outline-oro-500">
        <div className="text-center text-6xl">{s.emoji}</div>
        <p className="mt-2 text-center text-xs font-bold tracking-[0.2em] text-oro-600 uppercase">{s.carta}</p>
        <h1 className="mt-3 text-center text-3xl font-semibold">{s.titolo}</h1>
        <p className="mt-3 text-lg leading-relaxed">{s.testo}</p>
      </div>
      <Bottone freccia onClick={onAvanti}>
        Continua
      </Bottone>
    </div>
  );
}
