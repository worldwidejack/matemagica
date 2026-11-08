import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ascolta, menoMovimento } from '@/anim/orologio';
import { SENTIERO, type Livello } from '@/content/sentiero';
import type { Stelle } from '@/engine/regole';
import { useProfilo } from '@/profilo/store';
import { Bottone } from './kit';
import { livelloAperto, livelloCorrente } from './progressi';
import { SfidaDelGiorno } from './SfidaDelGiorno';
import type { StatoSasso } from './sentiero/pezzi';
import { FAMIGLIA_DI, Segnalino, altezzaDi, appoggioDi, larghezzaDi } from './Segnalino';
import linea from '../../public/paese/sentiero.json';
import camm from '../../public/paese/gatto-cammina.json';

/**
 * Il paese della matemagica (mondo 1959): il sentiero è una striscia orizzontale
 * che si scorre da sinistra a destra; i sassi stanno sulla strada dipinta.
 * Prova per il telefono: prende il posto delle isole solo sul preview, non su main.
 */
const PEZZI = 8;
const RAPPORTO = linea.w / linea.h; // larghezza / altezza della striscia
const MARGINE = 0.035;
/** Il gatto fermo (sentiero) e quello che cammina: misure a schermo. */
const GATTO_FERMO = { h: 64, w: 51 };
const CAMM_H = 58;
const CAMM_W = Math.round((camm.w / camm.h) * CAMM_H);
/** Metri di strada per ogni disegno della camminata (6 disegni = un passo doppio). */
const PASSO = 13;
/** Quanto paese si vede davanti al gatto, in livelli, e quanto è morbido il bordo della nebbia. */
const VISTA = 0.55;
const NEBBIA = '6, 10, 34';

function statoDi(l: Livello, corrente: number, stelle: Record<string, Stelle>): StatoSasso {
  const i = l.numero - 1;
  if (i === corrente) return 'attuale';
  if ((stelle[l.id] ?? 0) > 0) return 'fatto';
  return livelloAperto(i, stelle) ? 'aperto' : 'chiuso';
}

/** Dove sta il livello i (di n): frazione in x, percentuale in y sulla strada. */
function postoDi(i: number, n: number): { x: number; y: number } {
  const x = MARGINE + (1 - 2 * MARGINE) * (n <= 1 ? 0 : i / (n - 1));
  const k = Math.min(linea.y.length - 1, Math.round((x * linea.w) / linea.step));
  return { x, y: linea.y[k] ?? 62 };
}

export function SentieroPaese({
  onLivello,
  onSfida,
  appenaFatto,
  onVisto,
}: {
  onLivello: (l: Livello) => void;
  onSfida: () => void;
  /** Il livello che ha appena preso la prima stella: il suo segnalino sboccia. */
  appenaFatto?: string;
  onVisto?: () => void;
}) {
  const stelle = useProfilo((p) => p.stelleLivelli);
  const corrente = livelloCorrente(stelle);
  const livelli = SENTIERO.slice(0, 40);
  const rifScorri = useRef<HTMLDivElement>(null);
  const [daSbocciare] = useState(() => appenaFatto ?? new URLSearchParams(location.search).get('cammino') ?? undefined);
  // Completato un livello: fiore → il gatto cammina fino al sasso dopo (la camera lo segue) → la nebbia si ritira.
  const [cammino] = useState<{ da: number; a: number } | null>(() => {
    const da = daSbocciare ? SENTIERO.slice(0, 40).findIndex((l) => l.id === daSbocciare) : -1;
    const a = livelloCorrente(stelle);
    return da >= 0 && a > da && a < 40 && !menoMovimento() ? { da, a } : null;
  });
  const [fase, setFase] = useState<'fiore' | 'cammina' | 'fine'>(cammino ? 'fiore' : 'fine');
  const rifGatto = useRef<HTMLSpanElement>(null);
  const rifNebbia = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (appenaFatto) onVisto?.();
  }, [appenaFatto, onVisto]);
  const [alto, setAlto] = useState(() => Math.min(560, Math.round(window.innerHeight * 0.62)));

  useEffect(() => {
    const f = () => setAlto(Math.min(560, Math.round(window.innerHeight * 0.62)));
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  const largo = alto * RAPPORTO;
  const n = livelli.length;
  const distanza = ((1 - 2 * MARGINE) * largo) / (n - 1); // px fra un sasso e il prossimo

  /** Dove sta il gatto fermo accanto al sasso i: centro in x e piedi in y (px della striscia). */
  const gattoDi = (i: number) => {
    const p = postoDi(i, n);
    const l = livelli[i];
    const fam = l ? FAMIGLIA_DI[l.gioco] : 'fiore-a';
    const mh = altezzaDi(fam);
    const y0 = (p.y * alto) / 100;
    return {
      x: p.x * largo - larghezzaDi(fam) / 2 + 6 - GATTO_FERMO.w / 2,
      y: y0 + (appoggioDi(fam) === 'centro' ? mh / 2 : 0.12 * mh),
    };
  };
  /** Dove finisce la nebbia quando sei arrivato al livello c. */
  const bordoNebbia = (c: number) => postoDi(Math.min(c, n - 1), n).x * largo + VISTA * distanza;
  const SFUMA = Math.max(120, distanza * 0.4);

  // All'apertura la strada si porta sul sasso a cui sei arrivato (o, se c'è la sequenza, dove parte il gatto).
  useLayoutEffect(() => {
    const el = rifScorri.current;
    if (!el) return;
    if (cammino) {
      el.scrollLeft = Math.max(0, gattoDi(cammino.da).x - el.clientWidth * 0.45);
      return;
    }
    const { x } = postoDi(Math.min(corrente, n - 1), n);
    el.scrollLeft = x * largo - el.clientWidth / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corrente, alto, n]);

  // Il fiore sboccia (circa 1,7 s), poi parte il gatto.
  useEffect(() => {
    if (!cammino) return;
    const t = window.setTimeout(() => setFase('cammina'), 1700);
    return () => window.clearTimeout(t);
  }, [cammino]);

  // Il cammino: il gatto, la camera e la nebbia vanno insieme, tutto da un solo orologio.
  useEffect(() => {
    if (!cammino || fase !== 'cammina') return;
    const el = rifScorri.current;
    const gatto = rifGatto.current;
    const nebbia = rifNebbia.current;
    if (!el || !gatto || !nebbia) return;
    const A = gattoDi(cammino.da);
    const B = gattoDi(cammino.a);
    const dist = B.x - A.x;
    const durata = Math.max(1800, dist / 0.11); // ~110 px al secondo
    const e0 = bordoNebbia(cammino.da);
    const e1 = bordoNebbia(cammino.a);
    const yStrada = (x: number) => {
      const k = Math.min(linea.y.length - 1, Math.max(0, Math.round(((x + GATTO_FERMO.w / 2) / largo) * linea.w / linea.step)));
      return ((linea.y[k] ?? 62) * alto) / 100;
    };
    const dA = A.y - yStrada(A.x);
    const dB = B.y - yStrada(B.x);
    const max = Math.max(0, largo - el.clientWidth);
    let t0 = 0;
    const stop = ascolta((ora) => {
      if (!t0) t0 = ora;
      const p = Math.min(1, (ora - t0) / durata);
      const e = p * p * (3 - 2 * p);
      const x = A.x + dist * e;
      const y = yStrada(x) + dA + (dB - dA) * e;
      const f = Math.floor(((x - A.x) / PASSO)) % camm.n;
      gatto.style.transform = `translate(${x - CAMM_W / 2}px, ${y - CAMM_H}px)`;
      gatto.style.backgroundPosition = `${(f / (camm.n - 1)) * 100}% 0`;
      // La camera sta un po' davanti al gatto e, camminando, si sposta ancora più avanti.
      el.scrollLeft = Math.min(max, Math.max(0, x - el.clientWidth * (0.45 - 0.15 * e)));
      nebbia.style.transform = `translateX(${e0 + (e1 - e0) * e - SFUMA}px)`;
      if (p >= 1) {
        stop();
        setFase('fine');
      }
    });
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cammino, fase]);

  const inSequenza = !!cammino && fase !== 'fine';
  const partenza = cammino ? gattoDi(cammino.da) : null;
  const attuale = SENTIERO[corrente];

  return (
    <div className="min-h-dvh pb-24" style={{ background: '#060b24' }}>
      <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+3.9rem)] z-[27] mx-auto flex max-w-md justify-end px-3">
        <div className="pointer-events-auto">
          <SfidaDelGiorno compatta onGioca={onSfida} />
        </div>
      </div>

      <div className="px-6 pt-24 pb-4 text-center">
        <h1 className="text-5xl font-semibold text-panna-50">Matemagica</h1>
        <p className="titolo mt-2 text-lg text-panna-100/80 italic">Il paese dei numeri</p>
      </div>

      <div
        ref={rifScorri}
        className="overflow-y-hidden"
        style={{ height: alto, scrollbarWidth: 'none', overflowX: inSequenza ? 'hidden' : 'auto' }}
      >
        <div className="relative" style={{ width: largo, height: alto }}>
          <div className="absolute inset-0 flex">
            {Array.from({ length: PEZZI }, (_, i) => (
              <img
                key={i}
                src={`/paese/p${i + 1}.webp`}
                alt=""
                draggable={false}
                loading={i < 2 ? 'eager' : 'lazy'}
                className="h-full"
                style={{ width: `${100 / PEZZI}%` }}
              />
            ))}
          </div>
          {livelli.map((l, i) => {
            const p = postoDi(i, livelli.length);
            const fam = FAMIGLIA_DI[l.gioco];
            const stato = statoDi(l, corrente, stelle);
            return (
              <div
                key={l.id}
                className="absolute"
                style={{
                  left: `${p.x * 100}%`,
                  top: `${p.y}%`,
                  transform: appoggioDi(fam) === 'centro' ? 'translate(-50%, -50%)' : 'translate(-50%, -88%)',
                  zIndex: stato === 'attuale' ? 3 : 2,
                }}
              >
                <Segnalino
                  famiglia={fam}
                  stato={stato}
                  numero={l.numero}
                  stelle={stelle[l.id] ?? 0}
                  etichetta={`Livello ${l.numero}${stato === 'chiuso' ? ', chiuso' : ''}`}
                  sboccia={daSbocciare === l.id}
                  onTocca={() => onLivello(l)}
                />
                {stato === 'attuale' && !inSequenza && (
                  <img
                    src="/personaggi/gatto.webp"
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute"
                    style={{ height: 64, right: '100%', bottom: 0, marginRight: -6, animation: cammino ? 'comparsa 300ms' : undefined }}
                  />
                )}
              </div>
            );
          })}
          {/* Il gatto fermo accanto al sasso da cui parte, poi quello che cammina. */}
          {inSequenza && partenza && fase === 'fiore' && (
            <img
              src="/personaggi/gatto.webp"
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-0 top-0"
              style={{ height: GATTO_FERMO.h, zIndex: 5, transform: `translate(${partenza.x - GATTO_FERMO.w / 2}px, ${partenza.y - GATTO_FERMO.h}px)` }}
            />
          )}
          {inSequenza && partenza && fase === 'cammina' && (
            <span
              ref={rifGatto}
              className="pointer-events-none absolute left-0 top-0"
              style={{
                width: CAMM_W,
                height: CAMM_H,
                zIndex: 5,
                transform: `translate(${partenza.x - CAMM_W / 2}px, ${partenza.y - CAMM_H}px)`,
                backgroundImage: `url(${import.meta.env.BASE_URL}paese/gatto-cammina.webp)`,
                backgroundSize: `${camm.n * 100}% 100%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          )}
          {/* La nebbia: copre il paese che non hai ancora raggiunto e si ritira a ogni livello. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 4 }}>
            <div
              ref={rifNebbia}
              className="absolute top-0 bottom-0 left-0"
              style={{
                width: largo + SFUMA,
                transform: `translateX(${bordoNebbia(cammino && fase !== 'fine' ? cammino.da : corrente) - SFUMA}px)`,
                background: `linear-gradient(90deg, rgba(${NEBBIA},0) 0, rgba(${NEBBIA},0.55) ${SFUMA * 0.45}px, rgba(${NEBBIA},0.94) ${SFUMA}px, rgb(${NEBBIA}) 100%)`,
              }}
            />
          </div>
        </div>
      </div>

      {attuale && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[26] flex justify-center px-6">
          <Bottone freccia className="pointer-events-auto w-full max-w-xs" onClick={() => onLivello(attuale)}>
            Continua
          </Bottone>
        </div>
      )}
    </div>
  );
}
