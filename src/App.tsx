import { useCallback, useEffect, useRef, useState } from 'react';
import { setMutoAudio, suona } from '@/audio/sfx';
import type { GameId } from '@/engine/cartuccia';
import type { FinePartita } from '@/engine/partita';
import { SENTIERO, type Livello } from '@/content/sentiero';
import { GIOCHI } from '@/games/registro';
import { useProfilo } from '@/profilo/store';
import { Collezione } from '@/ui/Collezione';
import { Intestazione } from '@/ui/Intestazione';
import { Icona } from '@/ui/kit';
import { Palestra } from '@/ui/Palestra';
import { SpiegazioneSchermo, StoriaSchermo } from '@/ui/Schede';
import { Benvenuto } from '@/ui/Benvenuto';
import { Sentiero } from '@/ui/Sentiero';

type Scheda = 'sentiero' | 'palestra' | 'collezione';

type Schermata =
  | { tipo: 'scheda'; scheda: Scheda }
  | { tipo: 'spiegazione'; gioco: GameId; poi: Schermata }
  | { tipo: 'partita'; gioco: GameId; livello?: string }
  | { tipo: 'storia'; id: string; nuova: boolean };

/**
 * Navigazione a pila, collegata alla cronologia del browser: il tasto
 * "indietro" del telefono torna alla schermata precedente invece di uscire.
 * Niente router: tre schede e qualche schermata sopra bastano.
 */
function useNavigazione() {
  const [pila, setPila] = useState<Schermata[]>([{ tipo: 'scheda', scheda: 'sentiero' }]);

  useEffect(() => {
    const indietro = () => setPila((p) => (p.length > 1 ? p.slice(0, -1) : p));
    window.addEventListener('popstate', indietro);
    return () => window.removeEventListener('popstate', indietro);
  }, []);

  const apri = useCallback((s: Schermata) => {
    window.history.pushState(null, '');
    setPila((p) => [...p, s]);
  }, []);
  const sostituisci = useCallback((s: Schermata) => setPila((p) => [...p.slice(0, -1), s]), []);
  const chiudi = useCallback(() => window.history.back(), []);
  const scheda = useCallback((s: Scheda) => {
    setPila([{ tipo: 'scheda', scheda: s }]);
    window.scrollTo(0, 0);
  }, []);

  const cima = pila[pila.length - 1] ?? { tipo: 'scheda', scheda: 'sentiero' };
  const base = pila[0]?.tipo === 'scheda' ? pila[0].scheda : 'sentiero';
  return { cima, base, apri, sostituisci, chiudi, scheda };
}

export default function App() {
  const nav = useNavigazione();
  const muto = useProfilo((p) => p.muto);
  const viste = useProfilo((p) => p.spiegazioniViste);
  const segnaSpiegazione = useProfilo((p) => p.segnaSpiegazione);
  const benvenutoFatto = useProfilo((p) => p.benvenuto.fatto);
  const completaBenvenuto = useProfilo((p) => p.completaBenvenuto);

  useEffect(() => setMutoAudio(muto), [muto]);

  /** Prima partita a un gioco: prima la spiegazione. */
  const gioca = (gioco: GameId, livello?: string) => {
    const partita: Schermata = { tipo: 'partita', gioco, livello };
    nav.apri(viste.includes(gioco) ? partita : { tipo: 'spiegazione', gioco, poi: partita });
  };

  const { cima } = nav;

  // Prima apertura: benvenuto, poi dritti al primo livello.
  if (!benvenutoFatto && cima.tipo === 'scheda') {
    return (
      <Benvenuto
        onFine={(motivo, obiettivo) => {
          completaBenvenuto(motivo, obiettivo);
          const primo = SENTIERO[0];
          if (primo) gioca(primo.gioco, primo.id);
        }}
      />
    );
  }

  if (cima.tipo === 'spiegazione') {
    return (
      <SpiegazioneSchermo
        gioco={cima.gioco}
        onAvanti={() => {
          segnaSpiegazione(cima.gioco);
          nav.sostituisci(cima.poi);
        }}
      />
    );
  }

  if (cima.tipo === 'partita') {
    return (
      <Partita
        key={`${cima.gioco}-${cima.livello ?? 'palestra'}`}
        gioco={cima.gioco}
        livello={SENTIERO.find((l) => l.id === cima.livello)}
        onEsci={(cartaNuova) => (cartaNuova ? nav.sostituisci({ tipo: 'storia', id: cartaNuova, nuova: true }) : nav.chiudi())}
      />
    );
  }

  if (cima.tipo === 'storia') {
    return <StoriaSchermo id={cima.id} nuova={cima.nuova} onAvanti={nav.chiudi} />;
  }

  return (
    <div className="mx-auto min-h-full max-w-md">
      <Intestazione />
      {cima.scheda === 'sentiero' && <Sentiero onLivello={(l) => gioca(l.gioco, l.id)} />}
      {cima.scheda === 'palestra' && <Palestra onGioca={(g) => gioca(g)} />}
      {cima.scheda === 'collezione' && <Collezione onCarta={(id) => nav.apri({ tipo: 'storia', id, nuova: false })} />}
      <Schede attiva={cima.scheda} onScheda={nav.scheda} />
    </div>
  );
}

function Schede({ attiva, onScheda }: { attiva: Scheda; onScheda: (s: Scheda) => void }) {
  const voci: { s: Scheda; icona: 'mappa' | 'fulmine' | 'carte'; nome: string }[] = [
    { s: 'sentiero', icona: 'mappa', nome: 'Sentiero' },
    { s: 'palestra', icona: 'fulmine', nome: 'Palestra' },
    { s: 'collezione', icona: 'carte', nome: 'Collezione' },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 rounded-t-3xl bg-panna-100 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgb(0_0_0/0.25)]">
      <div className="mx-auto flex max-w-md">
        {voci.map((v) => {
          const on = v.s === attiva;
          return (
            <button
              key={v.s}
              onClick={() => {
                if (!on) suona('tap');
                onScheda(v.s);
              }}
              className={`flex flex-1 flex-col items-center gap-0.5 pt-2.5 pb-2 text-xs ${on ? 'font-bold text-notte-800' : 'text-inchiostro-chiaro'}`}
              aria-current={on ? 'page' : undefined}
            >
              <Icona nome={v.icona} className={`h-7 w-7 ${on ? 'fill-azzurro' : ''}`} />
              {v.nome}
              <span className={`mt-0.5 h-0.5 w-6 rounded-full ${on ? 'bg-notte-800' : 'bg-transparent'}`} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Partita({
  gioco,
  livello,
  onEsci,
}: {
  gioco: GameId;
  livello?: Livello;
  onEsci: (cartaNuova?: string) => void;
}) {
  const bravura = useProfilo((p) => p.bravura[gioco] ?? 0);
  const record = useProfilo((p) => p.record[gioco] ?? 0);
  const registra = useProfilo((p) => p.registraPartita);
  // La carta vinta in una partita si mostra quando si esce dal risultato.
  const carta = useRef<string | undefined>(undefined);

  const onFine = useCallback(
    (f: FinePartita) => {
      const r = registra({
        gioco,
        punteggio: f.punteggio,
        stelle: f.stelle,
        bravuraDopo: f.bravuraDopo,
        livello: livello?.id,
        storia: livello?.storia,
        comboMax: f.comboMax,
        puliti: f.puliti,
      });
      if (r.cartaNuova) carta.current = r.cartaNuova;
      return r;
    },
    [registra, gioco, livello],
  );

  const Play = GIOCHI[gioco].Play;
  return (
    <Play
      bravura={bravura}
      record={record}
      limiti={livello?.limiti}
      etichetta={livello ? `Livello ${livello.numero}` : 'Palestra'}
      inPalestra={!livello}
      onFine={onFine}
      onEsci={(dopo) => onEsci(dopo ? carta.current : undefined)}
    />
  );
}
