import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { suona } from '@/audio/sfx';
import { menoMovimento } from '@/anim/orologio';
import { StratoScoppi, scoppia } from '@/anim/scoppi';
import type { Punto } from '@/content/isole';
import { SENTIERO, TAPPE, type Livello } from '@/content/sentiero';
import type { Stelle } from '@/engine/regole';
import { useProfilo } from '@/profilo/store';
import { Bottone } from './kit';
import { livelloAperto, livelloCorrente } from './progressi';
import { SfidaDelGiorno } from './SfidaDelGiorno';
import {
  bottoneTest,
  cieloA,
  disegnaMappa,
  disponi,
  misureVelo,
  spostaStelline,
  tracciato,
  type Mappa,
  type Pezzo,
  type PezzoTappa,
  type SassoVicino,
} from './sentiero/mappa';
import {
  Bandierina,
  Etichetta,
  Fumetto,
  Immagine,
  IsolaFinta,
  NuvolaFinta,
  Personaggi,
  Sasso,
  StelleCielo,
  type StatoSasso,
} from './sentiero/pezzi';
import { Velo } from './sentiero/Velo';

/**
 * Il sentiero «Sassi e isole» (stile S5): un LIVELLO è un sasso, una TAPPA è un'isola
 * con 5 sassi e il monumento della sua storia in cima. Si sale dal basso. Si vedono
 * solo le isole raggiunte; sopra la più alta, la prossima è una sagoma dietro le nuvole.
 * Il bimbo mago e il gatto nero aspettano accanto al sasso a cui sei arrivato.
 *
 * La geometria sta in sentiero/mappa.ts, i pezzi piatti in sentiero/pezzi.tsx.
 */

/** Cosa è appena successo, da raccontare quando si torna sulla mappa. */
type Evento =
  /** Il 5° sasso di un'isola: le nuvole si aprono sulla tappa dopo. */
  | { tipo: 'scoperta'; da: Livello; tappa: number }
  /** Un sasso qualsiasi: bimbo e gatto saltano al sasso dopo. */
  | { tipo: 'salto'; da: Livello };

/**
 * I tempi della scoperta (ms), allineati alle classi .via-sx, .colora, .appari di index.css.
 * La prima inquadratura tiene sia il 5° sasso sia l'isola nuova: la camera sta ferma
 * finché bimbo e gatto non sono atterrati, poi sale a mostrare il velo nuovo.
 */
const SCOPERTA = { scoppio: 150, nuvole: 700, salto: 1450, sassi: 1500, scorri: 2450, fumetto: 2900, fine: 3300 };
const SALTO = { salto: 350, fumetto: 1350, velo: 900, fine: 1600 };

function leggiEvento(id: string | undefined, stelle: Record<string, Stelle>, corrente: number): Evento | null {
  if (!id || menoMovimento()) return null;
  const da = SENTIERO.find((l) => l.id === id);
  // Vale solo se è proprio il livello appena prima di dove sei arrivato.
  if (!da || (stelle[da.id] ?? 0) === 0 || corrente !== da.numero) return null;
  if (da.numero % 5 === 0 && SENTIERO[corrente]?.tappa === da.tappa + 1) return { tipo: 'scoperta', da, tappa: da.tappa + 1 };
  return { tipo: 'salto', da };
}

/** Solo in sviluppo: ?scoperta=L5 fa ripartire la sequenza (per fotografarla). */
function eventoDiProva(): string | undefined {
  if (!import.meta.env.DEV) return undefined;
  return new URLSearchParams(window.location.search).get('scoperta') ?? undefined;
}

/** In % della mappa: x sulla larghezza, y sull'altezza. */
function posto(p: Punto, alto: number): { left: string; top: string } {
  return { left: `${p.x}%`, top: `${(p.y / alto) * 100}%` };
}

function statoDi(l: Livello, corrente: number, stelle: Record<string, Stelle>): StatoSasso {
  const i = l.numero - 1;
  if (i === corrente) return 'attuale';
  if ((stelle[l.id] ?? 0) > 0) return 'fatto';
  return livelloAperto(i, stelle) ? 'aperto' : 'chiuso';
}

export function Sentiero({
  onLivello,
  onSfida,
  onSalto,
  appenaFatto,
  onVisto,
}: {
  onLivello: (l: Livello) => void;
  onSfida: () => void;
  /** Test per saltare alla tappa velata. */
  onSalto: (tappa: number) => void;
  /** Il livello che ha appena preso la PRIMA stella (stato della navigazione, non del profilo). */
  appenaFatto?: string;
  /** La mappa l'ha raccontato: App può dimenticarlo. */
  onVisto?: () => void;
}) {
  const stelle = useProfilo((p) => p.stelleLivelli);
  const corrente = livelloCorrente(stelle);
  const mappa = useMemo(() => disegnaMappa(corrente), [corrente]);
  const livelloAttuale = SENTIERO[corrente];

  // L'evento si legge una volta sola, quando la mappa si apre; col grado del velo a cui arrivare.
  const [avvio] = useState(() => {
    const evento = leggiEvento(appenaFatto ?? eventoDiProva(), stelle, corrente);
    const tappa = SENTIERO[corrente]?.tappa ?? 1;
    const fattiQui = SENTIERO.filter((l) => l.tappa === tappa && (stelle[l.id] ?? 0) > 0).length;
    // Il velo si dirada davanti ai tuoi occhi: parte dal grado di prima.
    const primaDi = evento?.tipo === 'salto' && evento.da.tappa === tappa ? Math.max(0, fattiQui - 1) : fattiQui;
    return { evento, grado: fattiQui, primaDi };
  });
  const evento = avvio.evento;
  const [finito, setFinito] = useState(evento === null);
  const inCorso = evento !== null && !finito;
  const [grado, setGrado] = useState(avvio.primaDi);

  const rifMappa = useRef<HTMLDivElement>(null);
  const rifCorrente = useRef<HTMLButtonElement>(null);
  /** La cima delle nuvole del velo, e le due righe fisse: sotto l'intestazione e il bottone Continua. */
  const rifCimaVelo = useRef<HTMLSpanElement>(null);
  const rifAlto = useRef<HTMLDivElement>(null);
  const rifBasso = useRef<HTMLDivElement>(null);
  const rifInizio = useRef<HTMLSpanElement>(null);
  const rifMonumenti = useRef(new Map<number, HTMLSpanElement>());
  const [largo, setLargo] = useState(() => Math.min(448, window.innerWidth));

  useEffect(() => {
    const el = rifMappa.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setLargo(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Raccontato: App può dimenticare il livello appena fatto (così non riparte).
  useEffect(() => {
    if (appenaFatto) onVisto?.();
  }, [appenaFatto, onVisto]);

  useEffect(() => {
    const { evento, grado } = avvio;
    const centra = (el: Element | null, morbido = false) => el?.scrollIntoView({ block: 'center', behavior: morbido ? 'smooth' : 'auto' });
    /**
     * L'inquadratura della mappa: le nuvole del velo appena sotto l'intestazione, così il
     * «?» e il velo che si dirada stanno nella stessa schermata del sasso attuale. Se così
     * il sasso (col fumetto) finirebbe sotto il bottone Continua, comanda il sasso.
     */
    const inquadra = (morbido = false) => {
      const sasso = rifCorrente.current?.getBoundingClientRect();
      if (!sasso) return;
      const alto = rifAlto.current?.getBoundingClientRect().top ?? 62;
      const basso = rifBasso.current?.getBoundingClientRect().top ?? window.innerHeight - 150;
      const ySasso = sasso.top + sasso.height / 2 + window.scrollY;
      const cima = rifCimaVelo.current?.getBoundingClientRect();
      let y = ySasso - (alto + basso) / 2;
      if (cima) y = Math.max(cima.top + window.scrollY - alto - 4, ySasso - (basso - 100));
      // Sugli schermi bassi il bottone del test può finire sotto la pillola della sfida:
      // o lo si mostra intero sotto la pillola (se il sasso ci sta ancora), o lo si nasconde
      // sopra l'intestazione. Mai mezzo coperto.
      const test = rifMappa.current?.querySelector('[data-test-salto]')?.getBoundingClientRect();
      const fondoAlto = rifAlto.current?.getBoundingClientRect().bottom ?? alto + 48;
      if (test) {
        const cimaTest = test.top + window.scrollY;
        const fondoTest = test.bottom + window.scrollY;
        if (cimaTest - y < fondoAlto + 6 && fondoTest - y > alto - 8) {
          const sotto = cimaTest - fondoAlto - 8;
          y = ySasso - sotto <= basso - 76 ? sotto : fondoTest - alto + 8;
        }
      }
      window.scrollTo({ top: Math.max(0, y), behavior: morbido ? 'smooth' : 'auto' });
    };
    const timer: number[] = [];
    const poi = (ms: number, f: () => void) => timer.push(window.setTimeout(f, ms));
    if (evento?.tipo === 'scoperta') {
      centra(rifInizio.current);
      poi(SCOPERTA.scoppio, () => {
        const r = rifMonumenti.current.get(evento.da.tappa)?.getBoundingClientRect();
        if (r) scoppia('giusto', r.left, r.top, 170);
        suona('stella');
      });
      poi(SCOPERTA.nuvole, () => suona('livello'));
      poi(SCOPERTA.scorri, () => inquadra(true));
      poi(SCOPERTA.fine, () => setFinito(true));
    } else {
      inquadra();
      if (evento) {
        poi(SALTO.velo, () => setGrado(grado));
        poi(SALTO.fine, () => setFinito(true));
      }
    }
    return () => timer.forEach((t) => window.clearTimeout(t));
    // `avvio` non cambia mai: gira solo all'apertura della mappa.
  }, [avvio]);

  const tappaScoperta = inCorso && evento?.tipo === 'scoperta' ? evento.tappa : null;
  const cimaCielo = mappa.pezzi[0]?.cieloSopra ?? 0;

  return (
    <div className="pb-24">
      <StratoScoppi />
      <div
        ref={rifAlto}
        className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+3.9rem)] z-[27] mx-auto flex max-w-md justify-end px-3"
      >
        <div className="pointer-events-auto">
          <SfidaDelGiorno compatta onGioca={onSfida} />
        </div>
      </div>

      {/* In cima al viaggio: il titolo nel cielo, sopra l'isola più alta. */}
      <div className="px-6 pt-24 pb-2 text-center" style={{ background: cieloA(cimaCielo) }}>
        <h1 className="text-5xl font-semibold text-panna-50">Matemagica</h1>
        <p className="titolo mt-2 text-lg text-panna-100/80 italic">Piccole sfide, grandi viaggi nella mente</p>
      </div>

      <div ref={rifMappa} className="relative overflow-x-clip">
        {mappa.pezzi.map((p) => (
          <PezzoVista
            key={`${p.tipo}-${p.n}`}
            pezzo={p}
            stelle={stelle}
            grado={grado}
            tappaCorrente={mappa.tappaCorrente}
            onSalto={onSalto}
            scoperta={tappaScoperta}
            rifCimaVelo={rifCimaVelo}
          />
        ))}

        <Sovrapposto
          mappa={mappa}
          corrente={corrente}
          stelle={stelle}
          largo={largo}
          evento={inCorso ? evento : null}
          rifCorrente={rifCorrente}
          rifInizio={rifInizio}
          rifMonumenti={rifMonumenti}
          onLivello={onLivello}
        />
      </div>

      {/* Il grande pulsante: riprende dal livello a cui sei arrivato. */}
      {livelloAttuale && (
        <div
          ref={rifBasso}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[26] flex justify-center px-6"
        >
          <Bottone freccia className="pointer-events-auto w-full max-w-xs" onClick={() => onLivello(livelloAttuale)}>
            Continua
          </Bottone>
        </div>
      )}
    </div>
  );
}

/** Un pezzo della mappa nel suo riquadro di cielo: isola, costellazione, velo o fondo. */
function PezzoVista({
  pezzo: p,
  stelle,
  grado,
  tappaCorrente,
  onSalto,
  scoperta,
  rifCimaVelo,
}: {
  pezzo: Pezzo;
  stelle: Record<string, Stelle>;
  grado: number;
  tappaCorrente: number;
  onSalto: (tappa: number) => void;
  scoperta: number | null;
  rifCimaVelo: React.RefObject<HTMLSpanElement | null>;
}) {
  const pct = (u: number) => `${(u / p.h) * 100}%`;
  const stile: CSSProperties = {
    aspectRatio: `100 / ${p.h}`,
    background: `linear-gradient(to top, ${cieloA(p.cieloSotto)}, ${cieloA(p.cieloSopra)})`,
  };

  if (p.tipo === 'velo') {
    return (
      <section className="relative" style={stile} aria-label="La prossima isola, nascosta dalle nuvole">
        <span ref={rifCimaVelo} className="absolute h-0 w-0" style={{ top: pct(Math.max(0, misureVelo(p).cima)) }} />
        <Velo pezzo={p} grado={grado} tappaSotto={tappaCorrente} onSalto={onSalto} className={scoperta ? 'appari' : ''} />
      </section>
    );
  }

  if (p.tipo === 'fondo') {
    return (
      <div className="relative" style={stile} aria-hidden>
        <StelleCielo stelle={p.stelle} alto={p.h} />
        {[
          { x: -14, y: 4, w: 74, file: '/isole/nuvola-1.webp', r: 290 / 785 },
          { x: 46, y: 10, w: 70, file: '/isole/nuvola-1.webp', r: 290 / 785 },
          { x: 30, y: 0, w: 26, file: '/isole/nuvola-2.webp', r: 267 / 356 },
        ].map((n, i) => (
          <Immagine
            key={i}
            src={n.file}
            pigra
            className="absolute"
            style={{ left: `${n.x}%`, top: pct(n.y), width: `${n.w}%`, height: pct(n.w * n.r) }}
            segnaposto={<NuvolaFinta />}
          />
        ))}
      </div>
    );
  }

  const fatti = p.livelli.map((l) => (stelle[l.id] ?? 0) > 0);
  const prese = p.livelli.reduce((s, l) => s + (stelle[l.id] ?? 0), 0);
  const titolo = p.n <= TAPPE.length ? `Isola ${p.n}` : `Tappa ${p.n}`;
  const svela = scoperta === p.n;

  return (
    <section className="relative" style={stile} aria-label={`${titolo}: ${p.nome}`}>
      <Etichetta titolo={titolo} nome={p.nome} fatti={fatti} stelle={prese} />
      {p.tipo === 'cielo' && (
        <svg viewBox={`0 0 100 ${p.h}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          {/* Una striscia di via lattea, piatta, diversa per ogni tappa. */}
          <ellipse
            cx={p.nebbia.cx}
            cy={p.nebbia.cy}
            rx="70"
            ry="14"
            transform={`rotate(${p.nebbia.ruota} 50 ${p.h / 2})`}
            fill="var(--color-notte-700)"
            opacity="0.45"
          />
        </svg>
      )}
      <StelleCielo stelle={p.stelle} alto={p.h} />
      {p.tipo === 'isola' && (
        <Immagine
          src={p.isola.file}
          pigra={Math.abs(p.n - tappaCorrente) > 1}
          className={`pointer-events-none absolute ${svela ? 'colora' : ''}`}
          style={{ left: `${p.riquadro.x}%`, top: pct(p.riquadro.y - p.y), width: `${p.riquadro.w}%`, height: pct(p.riquadro.h) }}
          segnaposto={<IsolaFinta />}
        />
      )}
      {svela && <NuvoleCheSiAprono pezzo={p} />}
    </section>
  );
}

/**
 * La scoperta: un banco di nuvole tonde copre tutta l'isola nuova (anche monumento e
 * punta), poi si squarcia a scatti: i due sbuffi al centro fanno «puf», le nuvole di
 * sinistra escono a sinistra e quelle di destra a destra, piene, senza sbiadire.
 */
function NuvoleCheSiAprono({ pezzo: p }: { pezzo: PezzoTappa }) {
  const r = p.tipo === 'isola' ? p.riquadro : { x: 6, y: p.y + 15, w: 88, h: p.h - 18 };
  const cima = r.y - p.y;
  const pct = (u: number) => `${(u / p.h) * 100}%`;
  const N1 = { src: '/isole/nuvola-1.webp', rapporto: 290 / 785 };
  const N2 = { src: '/isole/nuvola-2.webp', rapporto: 267 / 356 };
  // x, w in unità; y in frazione dell'altezza dell'isola; verso: da che parte esce.
  const nuvole: { file: typeof N1; x: number; y: number; w: number; verso: 'sx' | 'dx' | 'puf'; dy?: number }[] = [
    { file: N1, x: r.x - 14, y: -0.02, w: 76, verso: 'sx', dy: -20 },
    { file: N1, x: r.x + r.w - 62, y: 0.03, w: 76, verso: 'dx', dy: -20 },
    { file: N1, x: r.x - 18, y: 0.26, w: 84, verso: 'sx' },
    { file: N1, x: r.x + r.w - 66, y: 0.31, w: 84, verso: 'dx' },
    { file: N1, x: r.x - 8, y: 0.55, w: 80, verso: 'sx', dy: 20 },
    { file: N1, x: r.x + r.w - 72, y: 0.6, w: 80, verso: 'dx', dy: 20 },
    { file: N1, x: r.x + r.w / 2 - 34, y: 0.74, w: 66, verso: 'sx', dy: 40 },
    { file: N2, x: r.x + r.w / 2 - 20, y: -0.06, w: 40, verso: 'puf' },
    { file: N2, x: r.x + r.w / 2 - 24, y: 0.36, w: 48, verso: 'puf' },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
      {nuvole.map((n, i) => (
        <Immagine
          key={i}
          src={n.file.src}
          className={`absolute ${n.verso === 'puf' ? 'sbuffo' : n.verso === 'sx' ? 'via-sx' : 'via-dx'}`}
          style={
            {
              left: `${n.x}%`,
              top: pct(cima + n.y * r.h),
              width: `${n.w}%`,
              height: pct(n.w * n.file.rapporto),
              '--dy': `${n.dy ?? 0}%`,
            } as CSSProperties
          }
          segnaposto={<NuvolaFinta />}
        />
      ))}
    </div>
  );
}

/** Sopra i pezzi: la linea di puntini, i sassi, bimbo e gatto, il fumetto, le bandierine. */
function Sovrapposto({
  mappa,
  corrente,
  stelle,
  largo,
  evento,
  rifCorrente,
  rifInizio,
  rifMonumenti,
  onLivello,
}: {
  mappa: Mappa;
  corrente: number;
  stelle: Record<string, Stelle>;
  largo: number;
  evento: Evento | null;
  rifCorrente: React.RefObject<HTMLButtonElement | null>;
  rifInizio: React.RefObject<HTMLSpanElement | null>;
  rifMonumenti: React.RefObject<Map<number, HTMLSpanElement>>;
  onLivello: (l: Livello) => void;
}) {
  const { alto, percorso, velo } = mappa;
  const attuale = SENTIERO[corrente];
  const qui = attuale ? mappa.posti.get(attuale.id) : undefined;
  const da = evento ? mappa.posti.get(evento.da.id) : undefined;
  const tappe = mappa.pezzi.filter((p): p is PezzoTappa => p.tipo === 'isola' || p.tipo === 'cielo');
  const { fumetto, partenza } = useMemo(() => {
    if (!qui) return { fumetto: null, partenza: null };
    const k = largo / 100;
    // Le etichette in cima a ogni isola e il bottone del test sotto le nuvole: bimbo, gatto e fumetto li evitano.
    const ostacoli = mappa.pezzi.flatMap((p) => {
      if (p.tipo === 'isola' || p.tipo === 'cielo') return [{ x: 12, y: p.y * k - 10, w: 200, h: 66 }];
      if (p.tipo !== 'velo') return [];
      const b = bottoneTest(p);
      return [{ x: b.cx * k - 85, y: (p.y + b.y) * k, w: 170, h: 48 }];
    });
    const sassi: SassoVicino[] = mappa.pezzi.flatMap((p) =>
      p.tipo === 'isola' || p.tipo === 'cielo'
        ? p.livelli.flatMap((l, i) => {
            const punto = p.sassi[i];
            return punto ? [{ ...punto, fatto: (stelle[l.id] ?? 0) > 0 }] : [];
          })
        : [],
    );
    const fuoriDa = (p: Punto) => sassi.filter((s) => s.x !== p.x || s.y !== p.y);
    const fumetto = disponi(qui, fuoriDa(qui), largo, ostacoli);
    // Da dove partono nel salto: accanto al sasso di prima, dallo stesso lato, senza coprire nulla.
    const partenza = da ? disponi(da, fuoriDa(da), largo, ostacoli, fumetto.personaggi.lato).personaggi : null;
    return { fumetto, partenza };
  }, [qui, da, largo, mappa.pezzi, stelle]);

  // Fatto: dal livello 1 a dove sei. Da fare: da lì in su, fino dentro le nuvole.
  const fatto = percorso.slice(0, corrente + 1);
  const resto = [...percorso.slice(corrente), ...(velo ? [velo.arrivo] : [])];

  // La scoperta parte inquadrando il monumento appena vinto e le nuvole sopra.
  const inizio =
    evento?.tipo === 'scoperta' && da && qui ? { x: (da.x + qui.x) / 2, y: (da.y + qui.y) / 2 - 8 } : undefined;

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" className="absolute inset-0 z-10 h-full w-full" aria-hidden>
        <path
          d={tracciato(resto, alto, corrente)}
          fill="none"
          stroke="var(--color-panna-100)"
          strokeOpacity="0.45"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeDasharray="0 2.7"
        />
        <path
          d={tracciato(fatto, alto)}
          fill="none"
          stroke="var(--color-oro-300)"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeDasharray="0 2.7"
        />
      </svg>

      {/* I segnaposti invisibili: punta dei monumenti (scoppio) e prima inquadratura. */}
      {tappe.map(
        (p) =>
          p.tipo === 'isola' && (
            <span
              key={`m-${p.n}`}
              ref={(el) => {
                if (el) rifMonumenti.current.set(p.n, el);
                else rifMonumenti.current.delete(p.n);
              }}
              className="absolute h-0 w-0"
              style={posto(p.monumento, alto)}
            />
          ),
      )}
      {inizio && <span ref={rifInizio} className="absolute h-0 w-0" style={posto(inizio, alto)} />}

      {/* Bimbo e gatto: davanti ai sassi; nel salto anche davanti alle etichette. L'arco
          cresce col dislivello, così anche il salto da un'isola all'altra è un balzo. */}
      {qui && fumetto && (
        <Personaggi
          posto={fumetto.personaggi}
          className={da ? 'salto z-[26]' : 'z-[12]'}
          style={
            {
              ...posto(qui, alto),
              ...(da
                ? {
                    // Lo stesso lato, ma distanza e piedi della partenza: la differenza in px.
                    '--x0': `calc(${da.x}% + ${partenza ? (partenza.distanza - fumetto.personaggi.distanza) * (partenza.lato === 'sx' ? -1 : 1) : 0}px)`,
                    '--y0': `calc(${(da.y / alto) * 100}% + ${partenza ? partenza.piedi - fumetto.personaggi.piedi : 0}px)`,
                    '--arco': `${Math.round(Math.max(42, Math.abs(da.y - qui.y) * (largo / 100) * 0.35))}px`,
                    '--ritardo': `${evento?.tipo === 'scoperta' ? SCOPERTA.salto : SALTO.salto}ms`,
                  }
                : {}),
            } as CSSProperties
          }
        />
      )}

      {tappe.map((p) =>
        p.livelli.map((l, k) => {
          const punto = p.sassi[k];
          if (!punto) return null;
          const stato = statoDi(l, corrente, stelle);
          const nuovo = evento?.tipo === 'scoperta' && p.n === evento.tappa;
          return (
            <Sasso
              key={l.id}
              numero={l.numero}
              gioco={l.gioco}
              stato={stato}
              stelle={stelle[l.id] ?? 0}
              stelleDx={stato === 'fatto' ? spostaStelline(punto, percorso, largo) : 0}
              rif={stato === 'attuale' ? rifCorrente : undefined}
              className={`pointer-events-auto ${stato === 'attuale' ? 'z-[11]' : 'z-10'} ${nuovo ? 'appari' : ''}`}
              style={{ ...posto(punto, alto), ...(nuovo ? ({ '--ritardo': `${SCOPERTA.sassi + k * 80}ms` } as CSSProperties) : {}) }}
              onTocca={() => {
                suona('tap');
                onLivello(l);
              }}
            />
          );
        }),
      )}

      {/* Isola d'oro: tutte e 15 le stelle, una bandierina sul monumento. */}
      {tappe.map(
        (p) =>
          p.tipo === 'isola' &&
          p.livelli.every((l) => (stelle[l.id] ?? 0) === 3) && <Bandierina key={`b-${p.n}`} style={posto(p.monumento, alto)} />,
      )}

      {attuale && qui && fumetto && (
        <Fumetto
          gioco={attuale.gioco}
          spostamento={fumetto.spostamento}
          distanza={fumetto.distanza}
          sotto={fumetto.sotto}
          className={`z-[22] ${evento ? 'appari' : ''}`}
          style={{
            ...posto(qui, alto),
            ...(evento
              ? ({ '--ritardo': `${evento.tipo === 'scoperta' ? SCOPERTA.fumetto : SALTO.fumetto}ms` } as CSSProperties)
              : {}),
          }}
        />
      )}
    </div>
  );
}
