import { useEffect, useState } from 'react';
import { suona } from '@/audio/sfx';
import { LUOGHI, luogoDellaTappa, nomeDellaTappa, oraDellaTappa, titoloTappa, versoTappa } from '@/content/luoghi';
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

const FRASI = ['Riprova: la prossima parte più facile.', 'Bene, si scalda.', 'Partita completa!', 'Che partita!'] as const;

/** Schermata di fine partita, uguale per tutti i giochi: il gatto, le stelle, i numeri. */
export function Risultato({ titolo, etichetta, fine, riepilogo, inPalestra, condividi, onAncora, onEsci }: Props) {
  const { stelle, punteggio } = fine;
  const [visibili, setVisibili] = useState(0);

  // Le stelle entrano una dopo l'altra, in meno di un secondo, ognuna col suo suono.
  useEffect(() => {
    const ids: number[] = [];
    for (let i = 1; i <= stelle; i++) {
      ids.push(
        window.setTimeout(() => {
          setVisibili(i);
          suona('stella', i);
        }, 100 + i * 200),
      );
    }
    if (riepilogo.livelloDopo > riepilogo.livelloPrima) {
      ids.push(window.setTimeout(() => suona('livello'), 300 + stelle * 200));
    }
    if (riepilogo.medaglieNuove.length > 0) {
      ids.push(window.setTimeout(() => suona('festa'), 600 + stelle * 200));
    }
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [stelle, riepilogo.livelloDopo, riepilogo.livelloPrima, riepilogo.medaglieNuove.length]);

  const nuovoRecord = punteggio > riepilogo.recordPrima && punteggio > 0;
  const delta = riepilogo.bravuraDopo - riepilogo.bravuraPrima;

  const salito = riepilogo.livelloDopo > riepilogo.livelloPrima;
  const festa = stelle === 3 || salito || riepilogo.medaglieNuove.length > 0;

  /**
   * Prima di uscire, le feste a tutto schermo, una dopo l'altra:
   * il luogo completato, poi la fiamma della prima partita del giorno.
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
    <div className="animate-entra flex min-h-full flex-col items-center gap-3 px-6 pt-5 text-center">
      {festa && <Coriandoli />}
      <p className="titolo rounded-full bg-inchiostro/25 px-4 py-1.5 text-sm font-bold text-panna-50">
        {etichetta ? `${etichetta} · ` : ''}
        {titolo}
      </p>

      <div className="mt-auto flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <svg key={i} viewBox="0 0 24 24" className={`h-14 w-14 ${i === 2 ? '-translate-y-3' : ''} ${i <= visibili ? 'animate-stella' : ''}`} aria-hidden>
            <path
              d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"
              fill={i <= visibili ? 'var(--color-oro-400)' : 'rgb(21 19 46 / 0.28)'}
              stroke={i <= visibili ? 'var(--color-inchiostro)' : 'none'}
              strokeWidth={1.3}
              strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>

      {/* Il gatto: festeggia da due stelle in su, sennò ci pensa. Non parla mai. */}
      <img
        key={stelle >= 2 ? 'festa' : 'dubbio'}
        src={stelle >= 2 ? '/personaggi/gatto-festa.webp' : '/personaggi/gatto-dubbio.webp'}
        alt=""
        draggable={false}
        className="animate-pop -mt-1 h-36 w-auto origin-bottom"
      />
      <h1 className="text-[1.75rem] leading-tight font-bold text-panna-50">{FRASI[stelle]}</h1>

      <div className="leading-none">
        <p className="titolo text-6xl font-bold text-panna-50 tabular-nums">{punteggio}</p>
        <p className="mt-1 text-sm font-bold text-panna-50/75">{nuovoRecord ? '' : 'punti'}</p>
        {nuovoRecord && <p className="animate-pop titolo inline-block rounded-full bg-oro-400 px-3 py-1 text-sm font-bold text-inchiostro">Nuovo record!</p>}
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
        <p key={m.id} className="animate-pop ombra-dura w-full max-w-xs rounded-2xl bg-oro-400 px-4 py-2.5 text-left text-inchiostro">
          <span className="font-bold">Missione completata</span> · {m.testo} <span className="font-bold">+{m.premioXp} XP</span>
        </p>
      ))}
      {riepilogo.obiettivoRaggiunto && (
        <p className="animate-pop ombra-dura w-full max-w-xs rounded-2xl bg-panna-50 px-4 py-2.5 text-inchiostro">
          Obiettivo del giorno raggiunto: {riepilogo.obiettivo} {riepilogo.obiettivo === 1 ? 'partita' : 'partite'}!
        </p>
      )}
      {salito && (
        <p className="animate-pop ombra-dura rounded-2xl bg-azzurro px-4 py-2 font-bold text-inchiostro">Sei salito al livello {riepilogo.livelloDopo}!</p>
      )}
      {riepilogo.medaglieNuove.map(({ medaglia, grado }) => (
        <div key={medaglia.id} className="animate-pop ombra-dura flex w-full max-w-xs items-center gap-3 rounded-2xl bg-panna-50 px-4 py-2.5 text-left text-inchiostro">
          <Medaglione icona={medaglia.icona} grado={grado} />
          <span>
            <span className="titolo block text-xs font-bold text-oro-700">Medaglia {NOMI_GRADO[grado]}</span>
            <span className="titolo text-lg font-bold">{medaglia.nome}</span>
          </span>
        </div>
      ))}
      {riepilogo.salvaVinto && (
        <p className="animate-pop ombra-dura w-full max-w-xs rounded-2xl bg-azzurro px-4 py-2.5 text-inchiostro">
          <span className="font-bold">🧊 Salva-fiamma vinto!</span> Se salti un giorno, la fiamma resta accesa.
        </p>
      )}

      {/* I pulsanti restano a portata di pollice anche quando le novità allungano la pagina. */}
      <div className="sticky bottom-0 -mx-6 mt-auto flex w-[calc(100%+3rem)] flex-col items-center gap-1.5 bg-gradient-to-t from-[var(--tinta)] from-80% to-transparent px-6 pt-6 pb-3">
        <Bottone freccia={!inPalestra} className="w-full max-w-xs" onClick={inPalestra ? onAncora : continua}>
          {inPalestra ? 'Ancora una!' : 'Continua'}
        </Bottone>
        <div className="flex items-center gap-2">
          <Bottone variante="vuoto" className="px-4 py-2 text-base" onClick={inPalestra ? continua : onAncora}>
            {inPalestra ? 'Torna alla Palestra' : 'Rigioca'}
          </Bottone>
          <Condividi testo={testo} />
        </div>
      </div>
    </div>
  );
}

function Dato({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div className="px-1">
      <p className="titolo text-xl font-bold">{valore}</p>
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
      className="titolo flex items-center gap-2 rounded-full bg-inchiostro/25 px-4 py-2 font-bold text-panna-50 active:scale-95"
    >
      <Icona nome="condividi" className="h-5 w-5" />
      {esito ?? 'Condividi'}
    </button>
  );
}

/** Luogo completato: il luogo a tutto schermo, il suo nome, e dove si va adesso. */
function TappaSchermo({ tappa, onAvanti }: { tappa: number; onAvanti: () => void }) {
  const luogo = luogoDellaTappa(tappa);
  const ultimo = tappa === LUOGHI.length;
  useEffect(() => suona('festa'), []);
  return (
    <div className="animate-entra relative flex min-h-full flex-col overflow-hidden text-center">
      <img src={luogo.file} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover object-[50%_22%]" />
      <Coriandoli quanti={160} durata={3200} />
      <div className="relative mx-auto mt-6">
        <p className="animate-pop titolo ombra-dura inline-block rounded-full bg-oro-400 px-4 py-1.5 text-sm font-bold text-inchiostro">
          {tappa <= LUOGHI.length ? `${titoloTappa(tappa)} di ${LUOGHI.length} completato` : 'Costellazione completata'}
        </p>
      </div>
      <div className="animate-sale relative mt-auto rounded-t-[2rem] bg-carta px-6 pt-6 pb-5 text-inchiostro">
        <img
          src="/personaggi/gatto-festa.webp"
          alt=""
          draggable={false}
          className="animate-pop pointer-events-none absolute right-5 bottom-full -mb-3 h-32 w-auto origin-bottom"
        />
        <h1 className="text-[2.4rem] leading-none font-bold">{nomeDellaTappa(tappa)}</h1>
        <p className="mt-2 mb-5 text-lg leading-snug text-inchiostro-chiaro">
          {ultimo
            ? "Un giorno intero, dall'alba alla notte. Dall'osservatorio il viaggio continua fra le stelle."
            : tappa < LUOGHI.length
              ? `Fatta. Ora si va ${versoTappa(tappa + 1)}: ${nomeDellaTappa(tappa + 1)}, ${oraDellaTappa(tappa + 1)}.`
              : `La prossima costellazione è aperta: ${nomeDellaTappa(tappa + 1)}.`}
        </p>
        <Bottone freccia className="w-full" onClick={onAvanti}>
          Avanti
        </Bottone>
      </div>
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
    }, 350);
    return () => window.clearTimeout(t);
  }, [giorni]);
  return (
    <div className="animate-entra flex min-h-full flex-col items-center justify-center gap-5 px-6 py-8 text-center">
      <Icona nome="fiamma" className="animate-pop h-28 w-28 fill-oro-400 text-inchiostro" />
      <p key={mostrato} className="titolo animate-pop text-8xl leading-none font-bold text-panna-50 tabular-nums">
        {mostrato}
      </p>
      <h1 className="text-3xl font-bold text-panna-50">{giorni === 1 ? 'giorno di fila!' : 'giorni di fila!'}</h1>
      <p className="max-w-xs text-lg text-panna-50/85">
        {salvaUsati > 0
          ? `Il salva-fiamma 🧊 l'ha protetta ${salvaUsati === 1 ? 'nel giorno che hai saltato' : `nei ${salvaUsati} giorni che hai saltato`}.`
          : giorni === 1
            ? 'La fiamma è accesa. Torna domani per tenerla viva.'
            : 'Non spegnerla: basta una partita al giorno.'}
      </p>
      {salvaVinto && <p className="animate-pop ombra-dura rounded-2xl bg-azzurro px-4 py-2 text-inchiostro">🧊 Hai vinto un salva-fiamma!</p>}
      <Bottone freccia className="w-full max-w-xs" onClick={onAvanti}>
        Continua
      </Bottone>
    </div>
  );
}
