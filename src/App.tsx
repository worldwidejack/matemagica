import { useCallback, useEffect, useRef, useState } from 'react';
import { setMutoAudio, setVibrazioneAudio, suona } from '@/audio/sfx';
import type { GameId } from '@/engine/cartuccia';
import type { FinePartita } from '@/engine/partita';
import { versoTappa } from '@/content/isole';
import { SENTIERO, type Livello } from '@/content/sentiero';
import { GIOCHI } from '@/games/registro';
import { useProfilo } from '@/profilo/store';
import { Collezione } from '@/ui/Collezione';
import { Intestazione } from '@/ui/Intestazione';
import { Icona } from '@/ui/kit';
import { Palestra } from '@/ui/Palestra';
import { SpiegazioneSchermo, StoriaSchermo } from '@/ui/Schede';
import { Benvenuto } from '@/ui/Benvenuto';
import { Profilo } from '@/ui/Profilo';
import { Sentiero } from '@/ui/Sentiero';
import { testoSfida } from '@/ui/SfidaDelGiorno';
import { giornoLocale } from '@/profilo/progressione';
import { sfidaDel } from '@/profilo/sfida';

type Scheda = 'sentiero' | 'palestra' | 'collezione' | 'profilo';

type Schermata =
  | { tipo: 'scheda'; scheda: Scheda }
  | { tipo: 'spiegazione'; gioco: GameId; poi: Schermata }
  | { tipo: 'partita'; gioco: GameId; livello?: string; sfida?: string; salto?: number }
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

/** Tutte le schermate stanno nella colonna di un telefono, anche su tablet e computer. */
function Colonna({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-full max-w-md">{children}</div>;
}

export default function App() {
  const nav = useNavigazione();
  const muto = useProfilo((p) => p.muto);
  const vibrazione = useProfilo((p) => p.vibrazione);
  const viste = useProfilo((p) => p.spiegazioniViste);
  const segnaSpiegazione = useProfilo((p) => p.segnaSpiegazione);
  const benvenutoFatto = useProfilo((p) => p.benvenuto.fatto);
  const completaBenvenuto = useProfilo((p) => p.completaBenvenuto);
  // Il livello che ha appena preso la prima stella: la mappa lo racconta (salto o scoperta)
  // quando ci torni, poi si dimentica. È navigazione, non profilo: niente migrazione.
  const [appenaFatto, setAppenaFatto] = useState<string>();

  useEffect(() => setMutoAudio(muto), [muto]);
  useEffect(() => setVibrazioneAudio(vibrazione), [vibrazione]);

  /** Prima partita a un gioco: prima la spiegazione. */
  const gioca = (gioco: GameId, livello?: string, sfida?: string) => {
    const partita: Schermata = { tipo: 'partita', gioco, livello, sfida };
    nav.apri(viste.includes(gioco) ? partita : { tipo: 'spiegazione', gioco, poi: partita });
  };
  /** Il test per saltare a una tappa: un Lampo misto alla difficoltà di quella tappa. */
  const giocaSalto = (tappa: number) => nav.apri({ tipo: 'partita', gioco: 'misto', salto: tappa });
  const giocaSfida = () => {
    const oggi = giornoLocale(new Date());
    gioca(sfidaDel(oggi).gioco, undefined, oggi);
  };

  const { cima } = nav;

  // Prima apertura: benvenuto, poi dritti al primo livello.
  if (!benvenutoFatto && cima.tipo === 'scheda') {
    return (
      <Colonna>
      <Benvenuto
        onFine={(motivo, obiettivo) => {
          completaBenvenuto(motivo, obiettivo);
          const primo = SENTIERO[0];
          if (primo) gioca(primo.gioco, primo.id);
        }}
      />
      </Colonna>
    );
  }

  if (cima.tipo === 'spiegazione') {
    return (
      <Colonna>
      <SpiegazioneSchermo
        gioco={cima.gioco}
        onAvanti={() => {
          segnaSpiegazione(cima.gioco);
          nav.sostituisci(cima.poi);
        }}
      />
      </Colonna>
    );
  }

  if (cima.tipo === 'partita') {
    return (
      <Colonna>
      <Partita
        key={`${cima.gioco}-${cima.livello ?? cima.sfida ?? cima.salto ?? 'palestra'}`}
        gioco={cima.gioco}
        livello={SENTIERO.find((l) => l.id === cima.livello)}
        sfida={cima.sfida}
        salto={cima.salto}
        onPrimaStella={setAppenaFatto}
        onEsci={(cartaNuova) => (cartaNuova ? nav.sostituisci({ tipo: 'storia', id: cartaNuova, nuova: true }) : nav.chiudi())}
      />
      </Colonna>
    );
  }

  if (cima.tipo === 'storia') {
    return (
      <Colonna>
        <StoriaSchermo id={cima.id} nuova={cima.nuova} onAvanti={nav.chiudi} />
      </Colonna>
    );
  }

  return (
    <div className="mx-auto min-h-full max-w-md">
      <Intestazione onSfida={giocaSfida} />
      {cima.scheda === 'sentiero' && (
        <Sentiero
          onLivello={(l) => gioca(l.gioco, l.id)}
          onSfida={giocaSfida}
          onSalto={giocaSalto}
          appenaFatto={appenaFatto}
          onVisto={() => setAppenaFatto(undefined)}
        />
      )}
      {cima.scheda === 'palestra' && <Palestra onGioca={(g) => gioca(g)} onSfida={giocaSfida} />}
      {cima.scheda === 'collezione' && <Collezione onCarta={(id) => nav.apri({ tipo: 'storia', id, nuova: false })} />}
      {cima.scheda === 'profilo' && <Profilo />}
      <Schede attiva={cima.scheda} onScheda={nav.scheda} />
    </div>
  );
}

function Schede({ attiva, onScheda }: { attiva: Scheda; onScheda: (s: Scheda) => void }) {
  const voci: { s: Scheda; icona: 'mappa' | 'fulmine' | 'carte' | 'persona'; nome: string }[] = [
    { s: 'sentiero', icona: 'mappa', nome: 'Sentiero' },
    { s: 'palestra', icona: 'fulmine', nome: 'Palestra' },
    { s: 'collezione', icona: 'carte', nome: 'Collezione' },
    { s: 'profilo', icona: 'persona', nome: 'Profilo' },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 rounded-t-3xl bg-panna-100 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgb(0_0_0/0.25)]">
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
  sfida,
  salto,
  onPrimaStella,
  onEsci,
}: {
  gioco: GameId;
  livello?: Livello;
  /** La data della sfida del giorno, se è la sfida. */
  sfida?: string;
  /** La tappa a cui si vuole saltare, se è il test di salto. */
  salto?: number;
  /** Il livello del sentiero ha appena preso la sua prima stella. */
  onPrimaStella: (livello: string) => void;
  onEsci: (cartaNuova?: string) => void;
}) {
  const saltaATappa = useProfilo((p) => p.saltaATappa);
  const bravura = useProfilo((p) => p.bravura[gioco] ?? 0);
  const record = useProfilo((p) => p.record[gioco] ?? 0);
  const registra = useProfilo((p) => p.registraPartita);
  // La carta vinta in una partita si mostra quando si esce dal risultato.
  const carta = useRef<string | undefined>(undefined);

  const onFine = useCallback(
    (f: FinePartita) => {
      const primaVolta = livello !== undefined && f.stelle > 0 && (useProfilo.getState().stelleLivelli[livello.id] ?? 0) === 0;
      const r = registra({
        gioco,
        punteggio: f.punteggio,
        stelle: f.stelle,
        bravuraDopo: f.bravuraDopo,
        livello: livello?.id,
        storia: livello?.storia,
        comboMax: f.comboMax,
        puliti: f.puliti,
        giuste: f.giuste,
        risolti: f.risolti,
        sfida,
      });
      if (r.cartaNuova) carta.current = r.cartaNuova;
      if (primaVolta && livello) onPrimaStella(livello.id);
      // Test di salto superato (almeno 2 stelle): le tappe prima si aprono. Se il 5° sasso
      // dell'isola sotto prende così la sua prima stella, sulla mappa le nuvole si aprono.
      if (salto && f.stelle >= 2) {
        const quinto = SENTIERO[(salto - 1) * 5 - 1];
        const nuovo = quinto !== undefined && (useProfilo.getState().stelleLivelli[quinto.id] ?? 0) === 0;
        saltaATappa(salto);
        if (nuovo) onPrimaStella(quinto.id);
      }
      return r;
    },
    [registra, gioco, livello, sfida, salto, saltaATappa, onPrimaStella],
  );

  const Play = GIOCHI[gioco].Play;
  // Il test di salto gioca alla difficoltà della tappa: la fascia più alta fra i suoi livelli.
  const fasciaSalto = salto
    ? SENTIERO.filter((l) => l.tappa === salto - 1).reduce<[number, number]>(
        (f, l) => [Math.max(f[0], l.limiti[0]), Math.max(f[1], l.limiti[1])],
        [0, 0],
      )
    : undefined;
  return (
    <Play
      bravura={bravura}
      record={record}
      limiti={fasciaSalto ?? livello?.limiti}
      etichetta={
        salto ? `Salta ${versoTappa(salto)} · servono 2 stelle` : sfida ? 'Sfida del giorno' : livello ? `Livello ${livello.numero}` : 'Palestra'
      }
      inPalestra={!livello && !sfida && !salto}
      seme={sfida ? sfidaDel(sfida).seme : undefined}
      condividi={sfida ? (f) => testoSfida(sfida, f.punteggio, f.stelle) : undefined}
      onFine={onFine}
      // La carta vinta si mostra uscendo, anche se nel frattempo hai rigiocato e sei uscito con ✕.
      onEsci={() => onEsci(carta.current)}
    />
  );
}
