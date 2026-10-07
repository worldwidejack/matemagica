import { useEffect, useState } from 'react';
import { suona } from '@/audio/sfx';
import type { RiepilogoPartita } from '@/profilo/store';
import type { FinePartita } from './partita';

type Props = {
  titolo: string;
  etichetta?: string;
  fine: FinePartita;
  riepilogo: RiepilogoPartita;
  inPalestra?: boolean;
  onAncora: () => void;
  onEsci: () => void;
};

const FRASI = [
  'La prossima parte più facile. Riprova!',
  'Bene! Si sta scaldando.',
  'Partita completa!',
  'Perfetta. Da mago.',
] as const;

/** Schermata di fine partita, uguale per tutti i giochi. */
export function Risultato({ titolo, etichetta, fine, riepilogo, inPalestra, onAncora, onEsci }: Props) {
  const { stelle, punteggio } = fine;
  const [visibili, setVisibili] = useState(0);

  // Le stelle entrano una alla volta, ognuna col suo suono.
  useEffect(() => {
    const ids: number[] = [];
    for (let i = 1; i <= stelle; i++) {
      ids.push(
        window.setTimeout(() => {
          setVisibili(i);
          suona('stella');
        }, 350 + i * 380),
      );
    }
    if (riepilogo.livelloDopo > riepilogo.livelloPrima) {
      ids.push(window.setTimeout(() => suona('livello'), 500 + stelle * 380 + 300));
    }
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [stelle, riepilogo.livelloDopo, riepilogo.livelloPrima]);

  const nuovoRecord = punteggio > riepilogo.recordPrima && punteggio > 0;
  const delta = riepilogo.bravuraDopo - riepilogo.bravuraPrima;

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-sm tracking-widest text-white/50 uppercase">
        {etichetta ? `${etichetta} · ` : ''}
        {titolo}
      </p>

      <div className="flex gap-3 text-6xl">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={i <= visibili ? 'animate-stella text-oro-400 drop-shadow-[0_0_14px_var(--color-oro-500)]' : 'text-white/10'}
          >
            ★
          </span>
        ))}
      </div>
      <p className="text-xl">{FRASI[stelle]}</p>

      <div>
        <p className="text-6xl font-black tabular-nums text-oro-400">{punteggio}</p>
        {nuovoRecord && <p className="animate-pop mt-1 font-bold text-turchese-300">Nuovo record!</p>}
      </div>

      <div className="grid w-full max-w-xs grid-cols-3 gap-2 text-sm">
        {fine.dati.map((d) => (
          <Dato key={d.etichetta} etichetta={d.etichetta} valore={d.valore} />
        ))}
        <Dato etichetta="XP" valore={`+${riepilogo.xpGuadagnati}`} />
      </div>

      <p className="text-sm text-white/70">
        Bravura {riepilogo.bravuraPrima.toFixed(1)} →{' '}
        <span className="font-bold text-turchese-300">{riepilogo.bravuraDopo.toFixed(1)}</span>
        {Math.abs(delta) >= 0.05 && <span className="ml-1">{delta > 0 ? '▲' : '▼'}</span>}
      </p>

      {riepilogo.livelloDopo > riepilogo.livelloPrima && (
        <p className="animate-pop rounded-xl bg-turchese-500/20 px-4 py-2 font-bold text-turchese-300">
          Sei salito al livello {riepilogo.livelloDopo}!
        </p>
      )}
      {riepilogo.streak > 1 && <p className="text-white/80">🔥 {riepilogo.streak} giorni di fila</p>}

      <div className="mt-2 flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={inPalestra ? onAncora : onEsci}
          className="rounded-2xl bg-oro-500 py-4 text-xl font-bold text-notte-900 shadow-[0_0_30px_var(--color-oro-500)] active:scale-95"
        >
          {inPalestra ? 'Ancora una!' : 'Continua'}
        </button>
        <button onClick={inPalestra ? onEsci : onAncora} className="py-2 text-white/60">
          {inPalestra ? 'Torna alla Palestra' : 'Rigioca'}
        </button>
      </div>
    </div>
  );
}

function Dato({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div className="rounded-xl bg-notte-700 px-2 py-3">
      <p className="text-lg font-bold">{valore}</p>
      <p className="text-white/50">{etichetta}</p>
    </div>
  );
}
