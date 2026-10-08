import { useEffect, useState } from 'react';
import { suona } from '@/audio/sfx';
import { Bottone, Scheda } from '@/ui/kit';
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

  const [fiamma, setFiamma] = useState(false);
  /** Alla prima partita del giorno, prima di uscire si festeggia la fiamma (come Duolingo). */
  const continua = () => {
    if (riepilogo.fiammaAccesa && !fiamma) return setFiamma(true);
    onEsci();
  };

  if (fiamma) return <FiammaSchermo giorni={riepilogo.streak} onAvanti={onEsci} />;

  return (
    <div className="cielo-stellato flex min-h-full flex-col items-center justify-center gap-5 px-6 py-8 text-center">
      <p className="text-sm font-bold tracking-[0.2em] text-oro-300 uppercase">
        {etichetta ? `${etichetta} · ` : ''}
        {titolo}
      </p>

      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className={`h-16 w-16 ${i === 2 ? '-translate-y-3' : ''} ${i <= visibili ? 'animate-stella drop-shadow-[0_0_14px_var(--color-oro-500)]' : ''}`}
            aria-hidden
          >
            <path
              d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"
              fill={i <= visibili ? 'var(--color-oro-400)' : 'rgb(255 255 255 / 0.15)'}
              stroke={i <= visibili ? 'var(--color-oro-600)' : 'none'}
              strokeWidth={1}
            />
          </svg>
        ))}
      </div>
      <h1 className="text-3xl font-semibold text-panna-50">{FRASI[stelle]}</h1>

      <div>
        <p className="titolo text-6xl font-semibold tabular-nums text-oro-400">{punteggio}</p>
        {nuovoRecord && <p className="animate-pop mt-1 font-bold text-oro-300">Nuovo record!</p>}
      </div>

      <Scheda className="w-full max-w-xs">
        <div className="grid grid-cols-3 divide-x divide-panna-200 text-center">
          {fine.dati.map((d) => (
            <Dato key={d.etichetta} etichetta={d.etichetta} valore={d.valore} />
          ))}
          <Dato etichetta="XP" valore={`+${riepilogo.xpGuadagnati}`} />
        </div>
        <p className="mt-3 border-t border-panna-200 pt-3 text-sm text-inchiostro-chiaro">
          Bravura {riepilogo.bravuraPrima.toFixed(1)} → <span className="font-bold text-inchiostro">{riepilogo.bravuraDopo.toFixed(1)}</span>
          {Math.abs(delta) >= 0.05 && <span className="ml-1">{delta > 0 ? '▲' : '▼'}</span>}
        </p>
      </Scheda>

      {riepilogo.missioniNuove.map((m) => (
        <p key={m.id} className="animate-pop w-full max-w-xs rounded-2xl bg-oro-400 px-4 py-2.5 text-left text-inchiostro shadow">
          <span className="font-bold">Missione completata</span> · {m.testo} <span className="font-bold">+{m.premioXp} XP</span>
        </p>
      ))}
      {riepilogo.obiettivoRaggiunto && (
        <p className="animate-pop w-full max-w-xs rounded-2xl bg-panna-100 px-4 py-2.5 text-inchiostro shadow">
          Obiettivo del giorno raggiunto: {riepilogo.obiettivo} {riepilogo.obiettivo === 1 ? 'partita' : 'partite'}!
        </p>
      )}
      {riepilogo.livelloDopo > riepilogo.livelloPrima && (
        <p className="animate-pop rounded-2xl bg-azzurro px-4 py-2 font-bold text-inchiostro">Sei salito al livello {riepilogo.livelloDopo}!</p>
      )}

      <div className="mt-2 flex w-full max-w-xs flex-col items-center gap-2">
        <Bottone freccia={!inPalestra} className="w-full" onClick={inPalestra ? onAncora : continua}>
          {inPalestra ? 'Ancora una!' : 'Continua'}
        </Bottone>
        <Bottone variante="vuoto" onClick={inPalestra ? continua : onAncora}>
          {inPalestra ? 'Torna alla Palestra' : 'Rigioca'}
        </Bottone>
      </div>
    </div>
  );
}

function Dato({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div className="px-1">
      <p className="titolo text-xl font-semibold">{valore}</p>
      <p className="text-xs text-inchiostro-chiaro">{etichetta}</p>
    </div>
  );
}

/** La fiamma a tutto schermo: il numero dei giorni di fila sale di uno. */
function FiammaSchermo({ giorni, onAvanti }: { giorni: number; onAvanti: () => void }) {
  const [mostrato, setMostrato] = useState(Math.max(0, giorni - 1));
  useEffect(() => {
    const t = window.setTimeout(() => {
      setMostrato(giorni);
      suona('livello');
    }, 700);
    return () => window.clearTimeout(t);
  }, [giorni]);
  return (
    <div className="cielo-stellato flex min-h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="animate-pop text-[7rem] leading-none drop-shadow-[0_0_40px_var(--color-tramonto)]">🔥</div>
      <p key={mostrato} className="titolo animate-pop text-8xl font-semibold text-oro-400 tabular-nums">
        {mostrato}
      </p>
      <h1 className="text-3xl font-semibold text-panna-50">{giorni === 1 ? 'giorno di fila!' : 'giorni di fila!'}</h1>
      <p className="max-w-xs text-lg text-panna-100/80">
        {giorni === 1 ? 'La fiamma è accesa. Torna domani per tenerla viva.' : 'Non spegnerla: basta una partita al giorno.'}
      </p>
      <Bottone freccia className="w-full max-w-xs" onClick={onAvanti}>
        Continua
      </Bottone>
    </div>
  );
}
