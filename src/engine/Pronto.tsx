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
    <div className="relative flex min-h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <button onClick={onEsci} className="absolute top-4 left-4 text-2xl text-white/50" aria-label="Esci">
        ✕
      </button>
      {etichetta && <p className="text-sm tracking-widest text-turchese-300 uppercase">{etichetta}</p>}
      <h1 className="font-display text-4xl font-bold text-oro-400">{titolo}</h1>
      <p className="max-w-xs text-lg text-white/80">{hint}</p>
      <p className="text-sm text-white/50">
        {tipo === 'arcade' ? '⚡ Arcade · a tempo, 3 vite' : '🧩 Rompicapo · niente fretta, ci sono gli aiuti'}
      </p>
      <div className="w-full max-w-xs">
        <div className="mb-1 flex justify-between text-sm text-white/60">
          <span>Bravura</span>
          <span>{bravura.toFixed(1)} / 10</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-notte-600">
          <div className="h-full rounded-full bg-turchese-400" style={{ width: `${bravura * 10}%` }} />
        </div>
        {record > 0 && <p className="mt-3 text-sm text-white/60">Record: {record}</p>}
      </div>
      <button
        onClick={onVia}
        className="animate-respiro mt-4 rounded-2xl bg-oro-500 px-14 py-5 text-2xl font-bold text-notte-900 shadow-[0_0_40px_var(--color-oro-500)] active:scale-95"
      >
        Via!
      </button>
    </div>
  );
}
