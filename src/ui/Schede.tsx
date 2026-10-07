import { useEffect } from 'react';
import { suona } from '@/audio/sfx';
import type { GameId } from '@/engine/cartuccia';
import { SPIEGAZIONI } from '@/content/spiegazioni';
import { STORIE } from '@/content/storie';
import { GIOCHI } from '@/games/registro';

/** La mini-lezione che precede la prima partita a un gioco. */
export function SpiegazioneSchermo({ gioco, onAvanti }: { gioco: GameId; onAvanti: () => void }) {
  const s = SPIEGAZIONI[gioco];
  const v = GIOCHI[gioco];
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-5 px-6 py-8">
      <p className="text-sm tracking-widest text-turchese-300 uppercase">Gioco nuovo</p>
      <div className="flex items-center gap-4">
        <span className="animate-pop text-6xl">{v.icona}</span>
        <h1 className="text-3xl font-black text-oro-400">{v.titolo}</h1>
      </div>
      <Blocco titolo="Come si gioca">{s.come}</Blocco>
      <Blocco titolo="Il trucco">{s.trucco}</Blocco>
      <div className="rounded-2xl bg-notte-700 px-4 py-3 text-lg tabular-nums">{s.esempio}</div>
      <button
        onClick={() => {
          suona('tap');
          onAvanti();
        }}
        className="mt-2 rounded-2xl bg-oro-500 py-4 text-xl font-bold text-notte-900 shadow-[0_0_30px_var(--color-oro-500)] active:scale-95"
      >
        Ho capito, si gioca!
      </button>
    </div>
  );
}

function Blocco({ titolo, children }: { titolo: string; children: string }) {
  return (
    <div>
      <p className="text-sm font-bold text-white/50">{titolo}</p>
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
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-5 px-6 py-8">
      {nuova && <p className="animate-pop text-center font-bold tracking-widest text-magenta-400 uppercase">Nuova carta!</p>}
      <div className="animate-carta rounded-3xl border-2 border-oro-500/70 bg-gradient-to-b from-notte-600 to-notte-800 p-6 shadow-[0_0_40px_rgb(245_183_49/0.25)]">
        <div className="text-center text-6xl">{s.emoji}</div>
        <p className="mt-2 text-center text-sm font-bold tracking-widest text-oro-400 uppercase">{s.carta}</p>
        <h1 className="mt-4 text-2xl font-black">{s.titolo}</h1>
        <p className="mt-3 text-lg leading-relaxed text-white/85">{s.testo}</p>
      </div>
      <button
        onClick={() => {
          suona('tap');
          onAvanti();
        }}
        className="rounded-2xl bg-oro-500 py-4 text-xl font-bold text-notte-900 active:scale-95"
      >
        Continua
      </button>
    </div>
  );
}
