import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { suona, vibra } from '@/audio/sfx';
import { LUOGHI, luogoDellaTappa, nomeDellaTappa, oraDellaTappa, type Punto } from '@/content/luoghi';
import { SENTIERO, TAPPE_TOTALI, type Livello } from '@/content/sentiero';
import type { Stelle } from '@/engine/regole';
import { useProfilo } from '@/profilo/store';
import { Bottone, Icona, Scheda, Stelline } from './kit';
import { livelloAperto, livelloCorrente } from './progressi';

type Props = {
  onLivello: (l: Livello) => void;
  /** Il test per saltare alla tappa `n`. */
  onSalto: (tappa: number) => void;
  /** Il livello che ha appena preso la prima stella: il gatto passa a quello dopo. */
  appenaFatto?: string;
  onVisto: () => void;
};

/**
 * Casa: il viaggio. Ogni luogo è una pagina a tutto schermo che scorre di lato, con i suoi
 * cinque livelli sul sentiero e il gatto accanto a quello da giocare. Toccare un livello
 * aperto parte subito: niente schermate in mezzo.
 */
export function Casa({ onLivello, onSalto, appenaFatto, onVisto }: Props) {
  const stelle = useProfilo((p) => p.stelleLivelli);
  const corrente = livelloCorrente(stelle);
  const tappaCorrente = Math.floor(corrente / 5) + 1;
  // Gli otto luoghi si vedono sempre; oltre, una tappa fra le stelle alla volta.
  const pagine = Math.min(TAPPE_TOTALI, Math.max(LUOGHI.length, tappaCorrente + 1));

  // Appena tornati da un livello vinto per la prima volta: il gatto è ancora lì, poi passa oltre.
  const [inizio] = useState(() => {
    const fatto = appenaFatto ? SENTIERO.findIndex((l) => l.id === appenaFatto) : -1;
    return { fatto, racconta: fatto >= 0 && fatto === corrente - 1 };
  });
  const [gatto, setGatto] = useState(inizio.racconta ? inizio.fatto : corrente);
  const [balzo, setBalzo] = useState(false);
  const scorri = useRef<HTMLDivElement>(null);
  const visto = useRef(onVisto);
  useEffect(() => {
    visto.current = onVisto;
  });

  const vaiA = (tappa: number, morbido = true) => {
    const el = scorri.current;
    if (el) el.scrollTo({ left: (tappa - 1) * el.clientWidth, behavior: morbido ? 'smooth' : 'instant' });
  };

  // Si apre sul luogo dove sta il gatto.
  useLayoutEffect(() => {
    const el = scorri.current;
    if (el) el.scrollLeft = Math.floor((inizio.racconta ? inizio.fatto : corrente) / 5) * el.clientWidth;
    // solo all'apertura
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!inizio.racconta) {
      if (inizio.fatto >= 0) visto.current();
      return;
    }
    suona('stella');
    const t1 = setTimeout(() => {
      setBalzo(true);
      setGatto(corrente);
      if (Math.floor(corrente / 5) !== Math.floor(inizio.fatto / 5)) {
        suona('livello');
        const el = scorri.current;
        if (el) el.scrollTo({ left: Math.floor(corrente / 5) * el.clientWidth, behavior: 'smooth' });
      }
    }, 420);
    const t2 = setTimeout(() => {
      setBalzo(false);
      visto.current();
    }, 980);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // solo all'apertura
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="fixed inset-x-0 top-[var(--testa)] bottom-[var(--barra)] mx-auto max-w-md overflow-hidden bg-inchiostro">
      <div ref={scorri} className="pagine flex h-full overflow-x-auto overflow-y-hidden">
        {Array.from({ length: pagine }, (_, i) => (
          <Pagina
            key={i}
            tappa={i + 1}
            pagine={pagine}
            stelle={stelle}
            corrente={corrente}
            gatto={gatto}
            balzo={balzo}
            appenaFatto={inizio.racconta ? inizio.fatto : -1}
            onLivello={onLivello}
            onSalto={onSalto}
            onVai={vaiA}
          />
        ))}
      </div>
    </main>
  );
}

function Pagina({
  tappa,
  pagine,
  stelle,
  corrente,
  gatto,
  balzo,
  appenaFatto,
  onLivello,
  onSalto,
  onVai,
}: {
  tappa: number;
  pagine: number;
  stelle: Record<string, Stelle>;
  corrente: number;
  gatto: number;
  balzo: boolean;
  appenaFatto: number;
  onLivello: (l: Livello) => void;
  onSalto: (tappa: number) => void;
  onVai: (tappa: number) => void;
}) {
  const luogo = luogoDellaTappa(tappa);
  const primo = (tappa - 1) * 5;
  const livelli = SENTIERO.slice(primo, primo + 5);
  const aperta = livelloAperto(primo, stelle);
  const tappaCorrente = Math.floor(corrente / 5) + 1;
  const qui = tappa === tappaCorrente;
  const daGiocare = SENTIERO[corrente];
  const gattoQui = gatto >= primo && gatto < primo + 5;
  const puntoGatto = luogo.nodi[gatto - primo];
  const vicina = Math.abs(tappa - tappaCorrente) <= 1;

  return (
    <section
      className="relative h-full w-full shrink-0 snap-center snap-always overflow-hidden"
      style={{ containerType: 'size', background: luogo.tinta }}
      aria-label={nomeDellaTappa(tappa)}
    >
      {/* Il disegno riempie la pagina: su un telefono stretto si tagliano i lati, mai il sentiero. */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ height: 'max(100cqh, 150cqw)', aspectRatio: '2 / 3' }}
      >
        <img
          src={luogo.file}
          alt=""
          draggable={false}
          loading={vicina ? 'eager' : 'lazy'}
          className="absolute inset-0 h-full w-full"
        />
        {livelli.map((l, k) => {
          const p = luogo.nodi[k];
          if (!p) return null;
          const i = primo + k;
          const s = stelle[l.id] ?? 0;
          const stato = s > 0 ? 'fatto' : i === corrente ? 'attuale' : 'chiuso';
          return (
            <Nodo
              key={l.id}
              livello={l}
              punto={p}
              stato={stato}
              stelle={s}
              pop={i === appenaFatto}
              onTocca={() => onLivello(l)}
            />
          );
        })}
        {gattoQui && puntoGatto && <Gatto punto={puntoGatto} balzo={balzo} />}
      </div>

      {!aperta && <div className="absolute inset-0 bg-inchiostro/45" aria-hidden />}

      {/* L'etichetta di carta: dove sei, e quanti luoghi ha il giorno. */}
      <div className="ombra-dura absolute top-3 left-3 rounded-[1.4rem] bg-panna-50 px-4 py-2 text-inchiostro">
        <h2 className="text-xl leading-tight font-bold">{nomeDellaTappa(tappa)}</h2>
        <p className="text-xs font-bold text-inchiostro-chiaro">
          {tappa <= LUOGHI.length ? `Luogo ${tappa} di ${LUOGHI.length} · ${oraDellaTappa(tappa)}` : `Tappa ${tappa} · tra le stelle`}
        </p>
        <div className="mt-1.5 flex gap-1" aria-hidden>
          {LUOGHI.map((l) => (
            <span
              key={l.n}
              className={`h-1.5 rounded-full ${l.n === Math.min(tappa, LUOGHI.length) ? 'w-4' : 'w-1.5 opacity-45'}`}
              style={{ background: l.tinta }}
            />
          ))}
        </div>
      </div>

      {tappa > 1 && <Freccia verso="indietro" onClick={() => onVai(tappa - 1)} />}
      {tappa < pagine && <Freccia verso="avanti" onClick={() => onVai(tappa + 1)} />}

      <div className="absolute inset-x-0 bottom-4 flex justify-center px-5">
        {!aperta ? (
          <Scheda className="animate-entra w-full max-w-xs text-center">
            <p className="flex items-center justify-center gap-2 text-lg leading-snug font-bold">
              <Icona nome="lucchetto" className="h-5 w-5 shrink-0" />
              Finisci {nomeDellaTappa(tappa - 1)} per arrivare qui
            </p>
            <Bottone variante="inchiostro" className="mt-3 w-full px-4 py-2.5 text-base" onClick={() => onSalto(tappa)}>
              Sai già farlo? Prova a saltare
            </Bottone>
          </Scheda>
        ) : qui && daGiocare ? (
          <Bottone freccia respira className="min-w-56" onClick={() => onLivello(daGiocare)}>
            Livello {daGiocare.numero}
          </Bottone>
        ) : (
          <Bottone variante="carta" className="px-6 py-2.5 text-base" onClick={() => onVai(tappaCorrente)}>
            Torna al livello {daGiocare?.numero ?? corrente + 1}
          </Bottone>
        )}
      </div>
    </section>
  );
}

function Nodo({
  livello,
  punto,
  stato,
  stelle,
  pop,
  onTocca,
}: {
  livello: Livello;
  punto: Punto;
  stato: 'fatto' | 'attuale' | 'chiuso';
  stelle: number;
  pop: boolean;
  onTocca: () => void;
}) {
  const [no, setNo] = useState(0);
  const posa = { left: `${punto.x * 100}%`, top: `${punto.y * 100}%` };
  if (stato === 'chiuso') {
    return (
      <button
        key={no}
        onClick={() => {
          vibra(12);
          setNo((n) => n + 1);
        }}
        style={posa}
        className={`absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-inchiostro/45 text-panna-50/85 ${no ? 'animate-trema' : ''}`}
        aria-label={`Livello ${livello.numero}, chiuso`}
      >
        <Icona nome="lucchetto" className="h-4 w-4" />
      </button>
    );
  }
  const attuale = stato === 'attuale';
  return (
    <button
      onClick={() => {
        suona('tap');
        vibra(8);
        onTocca();
      }}
      style={posa}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      aria-label={`Livello ${livello.numero}${attuale ? ', da giocare' : `, ${stelle} stelle su 3`}`}
    >
      <span
        className={[
          'titolo grid place-items-center rounded-full font-bold text-inchiostro transition-transform duration-100 active:translate-y-1',
          attuale
            ? 'animate-respiro h-[3.75rem] w-[3.75rem] bg-panna-50 text-2xl shadow-[0_5px_0_rgb(21_19_46/0.35),0_0_0_5px_var(--color-oro-400)]'
            : 'h-12 w-12 bg-oro-400 text-xl shadow-[0_4px_0_var(--color-oro-600)]',
          pop ? 'animate-pop' : '',
        ].join(' ')}
      >
        {livello.numero}
      </span>
      {!attuale && (
        <span className="absolute top-full left-1/2 mt-1.5 -translate-x-1/2 rounded-full bg-inchiostro/75 px-1.5 py-0.5 text-[0.7rem] leading-none text-panna-50">
          <Stelline n={stelle} />
        </span>
      )}
    </button>
  );
}

/** Il gatto sta seduto accanto al livello da giocare, dalla parte dove c'è più posto. */
function Gatto({ punto, balzo }: { punto: Punto; balzo: boolean }) {
  const aSinistra = punto.x > 0.5;
  return (
    <div
      aria-hidden
      className="animate-pop pointer-events-none absolute transition-[left,top] duration-500 ease-out"
      style={{
        left: `calc(${punto.x * 100}% ${aSinistra ? '-' : '+'} 3.4rem)`,
        top: `calc(${punto.y * 100}% + 2rem)`,
        translate: '-50% -100%',
      }}
    >
      <div className={balzo ? 'animate-balzo' : ''}>
        <img
          src="/personaggi/gatto.webp"
          alt=""
          draggable={false}
          className="animate-respiro-scatti h-[5.25rem] w-auto origin-bottom drop-shadow-[0_4px_0_rgb(21_19_46/0.25)]"
          style={{ scale: aSinistra ? '1 1' : '-1 1' }}
        />
      </div>
    </div>
  );
}

function Freccia({ verso, onClick }: { verso: 'avanti' | 'indietro'; onClick: () => void }) {
  return (
    <button
      onClick={() => {
        suona('tap');
        onClick();
      }}
      className={`ombra-dura absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-panna-50 text-inchiostro active:translate-y-[calc(-50%+3px)] ${
        verso === 'avanti' ? 'right-2' : 'left-2'
      }`}
      aria-label={verso === 'avanti' ? 'Il luogo dopo' : 'Il luogo prima'}
    >
      <Icona nome={verso === 'avanti' ? 'freccia' : 'indietro'} className="h-5 w-5" />
    </button>
  );
}
