import { useEffect, useState } from 'react';
import { GattoFine, msStella } from '@/anim/Attore';
import { suona } from '@/audio/sfx';
import { FiammaSchermo, TappaSchermo } from '@/engine/Risultato';
import type { FinePartita } from '@/engine/partita';
import type { RiepilogoPartita } from '@/profilo/store';
import { Bottone } from './kit';
import { Luogo } from './Luogo';

/** Quanto aspetta il gatto prima di cominciare la sua scena: il tempo che il paese si apra. */
const ATTESA = 500;

/**
 * Fine livello di «Oltre la porta» (solo nel sentiero, per i giochi fluidi): niente
 * pagella. Il paese si allarga, la nebbia ha scoperto il livello dopo e le stelle
 * cadono una alla volta. «Avanti» torna al sentiero, dove il fiore sboccia e il gatto
 * cammina fin lì. Senza stelle il posto resta com'era: si riprova.
 */
export function FineLuogo({
  luogo,
  vittorie,
  fine,
  riepilogo,
  onAncora,
  onEsci,
}: {
  luogo: number;
  vittorie: number;
  fine: FinePartita;
  riepilogo: RiepilogoPartita;
  onAncora: () => void;
  onEsci: () => void;
}) {
  const { stelle } = fine;
  const [aperto, setAperto] = useState(false);
  const [visibili, setVisibili] = useState(0);
  const [scena, setScena] = useState(false);
  const [schermo, setSchermo] = useState<'luogo' | 'tappa' | 'fiamma'>('luogo');

  useEffect(() => {
    const ids: number[] = [];
    if (stelle > 0) {
      ids.push(window.setTimeout(() => setAperto(true), 350));
      // Prima si apre il paese, poi parte la scena del gatto e le stelle cadono sui suoi tempi.
      ids.push(window.setTimeout(() => setScena(true), ATTESA));
      for (let i = 1; i <= stelle; i++) {
        ids.push(
          window.setTimeout(() => {
            setVisibili(i);
            suona('stella', i / 3);
          }, ATTESA + msStella(i)),
        );
      }
    }
    return () => ids.forEach((t) => window.clearTimeout(t));
  }, [stelle]);

  const continua = () => {
    if (schermo === 'luogo' && riepilogo.tappaCompletata) return setSchermo('tappa');
    if (schermo !== 'fiamma' && riepilogo.fiammaAccesa) return setSchermo('fiamma');
    onEsci();
  };
  if (schermo === 'tappa' && riepilogo.tappaCompletata)
    return <TappaSchermo tappa={riepilogo.tappaCompletata} onAvanti={continua} />;
  if (schermo === 'fiamma')
    return (
      <FiammaSchermo
        giorni={riepilogo.streak}
        salvaUsati={riepilogo.salvaUsati}
        salvaVinto={riepilogo.salvaVinto}
        onAvanti={onEsci}
      />
    );

  return (
    <div className="flex min-h-dvh flex-col bg-notte-900">
      <Luogo indice={luogo} progresso={1} vittorie={vittorie} alto={340} finale={aperto} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-8 text-center">
        <div className="flex flex-col items-center">
        <div className="flex gap-2" aria-label={`${stelle} stelle su 3`}>
          {[1, 2, 3].map((i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              className={`h-14 w-14 ${i === 2 ? '-translate-y-2' : ''} ${i <= visibili ? 'animate-stella drop-shadow-[0_0_14px_var(--color-oro-500)]' : ''}`}
              aria-hidden
            >
              <path
                d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"
                fill={i <= visibili ? 'var(--color-oro-400)' : 'var(--color-notte-700)'}
                stroke="var(--color-inchiostro)"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          ))}
        </div>
        <GattoFine stelle={stelle} altezza={128} pausa={!scena} className="relative mt-1" />
        </div>
        <p className="text-lg font-bold text-panna-100">
          {stelle === 0 ? 'La nebbia è tornata. Riprova!' : stelle === 3 ? 'Perfetto. La strada è libera.' : 'La strada è libera.'}
        </p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          {stelle > 0 ? (
            <Bottone onClick={continua} freccia respira>
              Avanti
            </Bottone>
          ) : (
            <Bottone onClick={onAncora} respira>
              Riprova
            </Bottone>
          )}
          {stelle > 0 ? (
            <button onClick={onAncora} className="py-1 text-sm font-bold text-panna-100/60">
              Rigioca il livello
            </button>
          ) : (
            <button onClick={onEsci} className="py-1 text-sm font-bold text-panna-100/60">
              Torna al sentiero
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
