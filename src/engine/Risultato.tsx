import { useEffect, useState } from 'react';
import { suona } from '@/audio/sfx';
import { SCENE } from '@/content/scene';
import { nomeTappa } from '@/content/sentiero';
import { NOMI_GRADO } from '@/profilo/medaglie';
import { Bottone, Icona, Medaglione, Scheda } from '@/ui/kit';
import { Coriandoli } from '@/ui/Coriandoli';
import { condividiTesto, indirizzo, stelleTesto } from '@/ui/condividi';
import type { RiepilogoPartita } from '@/profilo/store';
import type { FinePartita } from './partita';

type Props = {
  titolo: string;
  etichetta?: string;
  fine: FinePartita;
  riepilogo: RiepilogoPartita;
  inPalestra?: boolean;
  /** Testo da condividere; se manca se ne compone uno dal risultato. */
  condividi?: string;
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
export function Risultato({ titolo, etichetta, fine, riepilogo, inPalestra, condividi, onAncora, onEsci }: Props) {
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
    if (riepilogo.medaglieNuove.length > 0) {
      ids.push(window.setTimeout(() => suona('festa'), 900 + stelle * 380 + 500));
    }
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [stelle, riepilogo.livelloDopo, riepilogo.livelloPrima, riepilogo.medaglieNuove.length]);

  const nuovoRecord = punteggio > riepilogo.recordPrima && punteggio > 0;
  const delta = riepilogo.bravuraDopo - riepilogo.bravuraPrima;

  const salito = riepilogo.livelloDopo > riepilogo.livelloPrima;
  const festa = stelle === 3 || salito || riepilogo.medaglieNuove.length > 0;

  /**
   * Prima di uscire, le feste a tutto schermo, una dopo l'altra:
   * la tappa completata, poi la fiamma della prima partita del giorno (come Duolingo).
   */
  const [schermo, setSchermo] = useState<'risultato' | 'tappa' | 'fiamma'>('risultato');
  const vaiA = (x: 'tappa' | 'fiamma') => {
    window.scrollTo(0, 0);
    setSchermo(x);
  };
  const continua = () => {
    if (schermo === 'risultato' && riepilogo.tappaCompletata) return vaiA('tappa');
    if (schermo !== 'fiamma' && riepilogo.fiammaAccesa) return vaiA('fiamma');
    onEsci();
  };

  if (schermo === 'tappa' && riepilogo.tappaCompletata)
    return <TappaSchermo tappa={riepilogo.tappaCompletata} onAvanti={continua} />;
  if (schermo === 'fiamma')
    return <FiammaSchermo giorni={riepilogo.streak} salvaUsati={riepilogo.salvaUsati} salvaVinto={riepilogo.salvaVinto} onAvanti={onEsci} />;

  const testo =
    condividi ??
    `Matemagica · ${etichetta ? `${etichetta} · ` : ''}${titolo}\n${stelleTesto(stelle)}  ${punteggio} punti\n${indirizzo()}`;

  return (
    <div className="cielo-stellato flex min-h-full flex-col items-center justify-center gap-5 px-6 py-8 text-center">
      {festa && <Coriandoli />}
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
      {salito && (
        <p className="animate-pop rounded-2xl bg-azzurro px-4 py-2 font-bold text-inchiostro">Sei salito al livello {riepilogo.livelloDopo}!</p>
      )}
      {riepilogo.medaglieNuove.map(({ medaglia, grado }) => (
        <div key={medaglia.id} className="animate-pop flex w-full max-w-xs items-center gap-3 rounded-2xl bg-panna-100 px-4 py-2.5 text-left text-inchiostro shadow">
          <Medaglione icona={medaglia.icona} grado={grado} />
          <span>
            <span className="block text-xs font-bold tracking-wider text-oro-600 uppercase">Medaglia {NOMI_GRADO[grado]}</span>
            <span className="titolo text-lg font-semibold">{medaglia.nome}</span>
          </span>
        </div>
      ))}
      {riepilogo.salvaVinto && (
        <p className="animate-pop w-full max-w-xs rounded-2xl bg-azzurro px-4 py-2.5 text-inchiostro shadow">
          <span className="font-bold">🧊 Salva-fiamma vinto!</span> Se salti un giorno, la fiamma resta accesa.
        </p>
      )}

      {/* I pulsanti restano a portata di pollice anche quando le novità allungano la pagina. */}
      <div className="sticky bottom-0 -mx-6 mt-2 flex w-[calc(100%+3rem)] flex-col items-center gap-2 bg-gradient-to-t from-notte-900 from-75% to-transparent px-6 pt-8 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <Bottone freccia={!inPalestra} className="w-full max-w-xs" onClick={inPalestra ? onAncora : continua}>
          {inPalestra ? 'Ancora una!' : 'Continua'}
        </Bottone>
        <Bottone variante="vuoto" onClick={inPalestra ? continua : onAncora}>
          {inPalestra ? 'Torna alla Palestra' : 'Rigioca'}
        </Bottone>
        <Condividi testo={testo} />
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

function Condividi({ testo }: { testo: string }) {
  const [esito, setEsito] = useState<string | null>(null);
  return (
    <button
      onClick={() => {
        suona('tap');
        void condividiTesto(testo).then((e) => {
          if (e === 'copiato') setEsito('Copiato!');
          else if (e === 'errore') setEsito('Non riesco');
        });
      }}
      className="mt-1 flex items-center gap-2 rounded-full bg-panna-100/15 px-4 py-2 text-panna-50 active:scale-95"
    >
      <Icona nome="condividi" className="h-5 w-5" />
      {esito ?? 'Condividi'}
    </button>
  );
}

/** Tappa completata: la scena della tappa, i coriandoli, il nome. */
function TappaSchermo({ tappa, onAvanti }: { tappa: number; onAvanti: () => void }) {
  const scena = SCENE.find((s) => s.n === tappa);
  useEffect(() => suona('festa'), []);
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-end gap-5 overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] text-center">
      {scena ? (
        <img src={scena.file} alt="" className="animate-[zoom_6s_ease-out_forwards] absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="cielo-stellato absolute inset-0" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-notte-900/70 via-transparent to-notte-900/95" />
      <Coriandoli quanti={200} durata={4500} />
      <div className="relative mt-[calc(env(safe-area-inset-top)+3rem)] mb-auto">
        <p className="animate-pop text-sm font-bold tracking-[0.25em] text-oro-300 uppercase">Tappa {tappa} completata</p>
        <h1 className="animate-pop mt-2 text-5xl font-semibold text-panna-50 drop-shadow-lg">{nomeTappa(tappa)}</h1>
      </div>
      <p className="relative max-w-xs text-lg text-panna-50 drop-shadow">
        {tappa === 8
          ? 'Sei arrivato in cima alla torre. Ma il cielo non finisce: il sentiero continua tra le stelle.'
          : 'Il sentiero sale ancora: la prossima tappa è aperta.'}
      </p>
      <Bottone freccia className="relative w-full max-w-xs" onClick={onAvanti}>
        Avanti
      </Bottone>
    </div>
  );
}

/** La fiamma a tutto schermo: il numero dei giorni di fila sale di uno. */
function FiammaSchermo({
  giorni,
  salvaUsati,
  salvaVinto,
  onAvanti,
}: {
  giorni: number;
  salvaUsati: number;
  salvaVinto: boolean;
  onAvanti: () => void;
}) {
  const [mostrato, setMostrato] = useState(Math.max(0, giorni - 1));
  useEffect(() => {
    const t = window.setTimeout(() => {
      setMostrato(giorni);
      suona('livello');
    }, 700);
    return () => window.clearTimeout(t);
  }, [giorni]);
  return (
    <div className="cielo-stellato flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="animate-pop text-[7rem] leading-none drop-shadow-[0_0_40px_var(--color-tramonto)]">🔥</div>
      <p key={mostrato} className="titolo animate-pop text-8xl font-semibold text-oro-400 tabular-nums">
        {mostrato}
      </p>
      <h1 className="text-3xl font-semibold text-panna-50">{giorni === 1 ? 'giorno di fila!' : 'giorni di fila!'}</h1>
      <p className="max-w-xs text-lg text-panna-100/80">
        {salvaUsati > 0
          ? `Il salva-fiamma 🧊 l'ha protetta ${salvaUsati === 1 ? 'nel giorno che hai saltato' : `nei ${salvaUsati} giorni che hai saltato`}.`
          : giorni === 1
            ? 'La fiamma è accesa. Torna domani per tenerla viva.'
            : 'Non spegnerla: basta una partita al giorno.'}
      </p>
      {salvaVinto && <p className="animate-pop rounded-2xl bg-azzurro px-4 py-2 text-inchiostro">🧊 Hai vinto un salva-fiamma!</p>}
      <Bottone freccia className="w-full max-w-xs" onClick={onAvanti}>
        Continua
      </Bottone>
    </div>
  );
}
