import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SENTIERO } from '@/content/sentiero';
import { FAMIGLIA_DI, Segnalino, altezzaDi, appoggioDi } from './Segnalino';
import { MARGINE, NEBBIA, PEZZI, RAPPORTO, VISTA, postoDi } from './SentieroPaese';
import linea from '../../public/paese/sentiero.json';

/**
 * Legge 3 di «Oltre la porta»: ogni vittoria cambia il luogo. Sopra il gioco c'è il pezzo
 * di paese dove sei (lo stesso del sentiero): il tuo segnalino col gatto, la nebbia, e
 * dietro la nebbia il livello dopo. A ogni vittoria la nebbia arretra e sulla strada
 * conquistata si accende una stellina, che resta. A fine livello la nebbia ha scoperto
 * il segnalino dopo: si intravede dove si va.
 */

const N = 40;
/** Il paese disegnato a questa altezza: due segnalini stanno in una finestra da telefono. */
const STRISCIA = 300;

type Lucina = { x: number; y: number; k: number };

export function Luogo({
  indice,
  progresso,
  vittorie,
  alto = 168,
  finale = false,
}: {
  /** Il livello (da 0) che si sta giocando. */
  indice: number;
  /** 0-1: quanto la nebbia si è ritirata verso il livello dopo. */
  progresso: number;
  /** Quante vittorie finora: una stellina per ognuna. */
  vittorie: number;
  /** Altezza della finestra in px. */
  alto?: number;
  /** Fine livello: il segnalino dopo esce dalla nebbia. */
  finale?: boolean;
}) {
  const rif = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(375);
  useLayoutEffect(() => {
    const el = rif.current;
    if (!el) return;
    const f = () => setW(el.clientWidth);
    f();
    const o = new ResizeObserver(f);
    o.observe(el);
    return () => o.disconnect();
  }, []);

  const S = Math.max(STRISCIA, alto + 40);
  const largo = S * RAPPORTO;
  const distanza = ((1 - 2 * MARGINE) * largo) / (N - 1);
  const xDi = (i: number) => postoDi(i, N).x * largo;
  const yStrada = (x: number) => {
    const t = Math.min(linea.y.length - 1, Math.max(0, (x / largo) * (linea.w / linea.step)));
    const k = Math.floor(t);
    const a = linea.y[k] ?? 62;
    const b = linea.y[Math.min(linea.y.length - 1, k + 1)] ?? a;
    return ((a + (b - a) * (t - k)) * S) / 100;
  };
  const bordo = (c: number) => xDi(Math.min(c, N - 1)) + VISTA * distanza;
  const SFUMA = Math.max(70, distanza * 0.4);

  const x0 = xDi(indice);
  const p = Math.max(0, Math.min(1, finale ? 1 : progresso));
  const bordoOra = bordo(indice) + (bordo(indice + 1) - bordo(indice)) * p;
  // La camera: il tuo segnalino a un quarto della finestra, il prossimo verso destra.
  // A fine livello scorre fino a inquadrare tutti e due: si vede dove si va.
  const x1 = xDi(Math.min(indice + 1, N - 1));
  const mira = finale ? (x0 + x1) / 2 - W / 2 : x0 - W * 0.24;
  const camX = Math.max(0, Math.min(largo - W, mira));
  // In verticale: la strada a due terzi della finestra.
  const camY = Math.max(0, Math.min(S - alto, yStrada(finale ? (x0 + x1) / 2 : x0) - alto * 0.66));

  // Le stelline: ognuna nasce sulla strada appena liberata dalla nebbia, e resta.
  const [lucine, setLucine] = useState<Lucina[]>([]);
  const bordoRif = useRef(bordoOra);
  useEffect(() => {
    setLucine((l) => {
      if (vittorie <= l.length) return vittorie === 0 ? [] : l;
      const nuove = [...l];
      for (let k = l.length; k < vittorie; k++) {
        const da = x0 + 34;
        const a = Math.max(da + 20, Math.min(bordoRif.current, bordoOra) - SFUMA * 0.35);
        // Sparse in modo fisso (niente Math.random: stessa partita, stesso disegno).
        const f = ((k * 0.618) % 1 + 0.15) % 1;
        const x = da + (a - da) * f;
        nuove.push({ x, y: yStrada(x) - 4 - ((k * 7) % 11), k });
      }
      return nuove;
    });
    bordoRif.current = bordoOra;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vittorie]);

  const pezziVisti = Array.from({ length: PEZZI }, (_, i) => i).filter((i) => {
    const w = largo / PEZZI;
    const da = Math.min(camX, Math.max(0, x0 - W * 0.24));
    return i * w < Math.max(camX, da) + W + 10 && (i + 1) * w > da - 10;
  });
  const qui = SENTIERO[indice];
  const dopo = SENTIERO[indice + 1];

  const segnalino = (i: number, stato: 'attuale' | 'chiuso' | 'aperto') => {
    const l = SENTIERO[i];
    if (!l) return null;
    const fam = FAMIGLIA_DI[l.gioco];
    return (
      <div
        key={l.id}
        className="absolute"
        style={{
          left: xDi(i),
          top: (postoDi(i, N).y * S) / 100,
          transform: appoggioDi(fam) === 'centro' ? 'translate(-50%, -50%)' : 'translate(-50%, -88%)',
          zIndex: stato === 'chiuso' ? 2 : 6,
          pointerEvents: 'none',
        }}
      >
        <Segnalino famiglia={fam} stato={stato} numero={l.numero} stelle={0} etichetta="" onTocca={() => {}} />
        {i === indice && (
          <img
            src={`${import.meta.env.BASE_URL}personaggi/gatto.webp`}
            alt=""
            draggable={false}
            className="pointer-events-none absolute"
            style={{ height: 64, right: '100%', bottom: 0, marginRight: -6 }}
          />
        )}
        {i === indice + 1 && finale && (
          <span
            className="animate-pop absolute left-1/2 -translate-x-1/2 rounded-full bg-oro-400 px-2 text-[12px] leading-[20px] font-black whitespace-nowrap text-inchiostro"
            style={{ bottom: altezzaDi(fam) + 8 }}
          >
            il prossimo
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      ref={rif}
      aria-hidden
      className="relative w-full overflow-hidden"
      style={{ height: alto, background: '#060b24' }}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: largo,
          height: S,
          transform: `translate(${-camX}px, ${-camY}px)`,
          transition: 'transform 1100ms cubic-bezier(.45,0,.2,1)',
        }}
      >
        {pezziVisti.map((i) => (
          <img
            key={i}
            src={`${import.meta.env.BASE_URL}paese/p${i + 1}.webp`}
            alt=""
            draggable={false}
            className="absolute top-0 h-full"
            style={{ left: (largo / PEZZI) * i, width: largo / PEZZI }}
          />
        ))}
        {qui && segnalino(indice, 'attuale')}
        {dopo && segnalino(indice + 1, finale ? 'aperto' : 'chiuso')}
        {lucine.map((l) => (
          <span key={l.k} className="absolute" style={{ left: l.x, top: l.y, zIndex: 5, transform: 'translate(-50%, -50%)' }}>
            <span className="animate-pop block">
              <svg viewBox="0 0 24 24" width={18} height={18} className="drop-shadow-[0_0_6px_var(--color-oro-400)]">
                <path
                  d="M12 1.5 14.2 9.8 22.5 12 14.2 14.2 12 22.5 9.8 14.2 1.5 12 9.8 9.8Z"
                  fill="var(--color-oro-400)"
                  stroke="var(--color-inchiostro)"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="anello-luce pointer-events-none absolute top-1/2 left-1/2 h-10 w-10 rounded-full border-2 border-oro-300" />
          </span>
        ))}
        {/* La nebbia: la stessa del sentiero. Arretra a ogni vittoria. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 4 }}>
          <div
            className="absolute top-0 bottom-0 left-0"
            style={{
              width: largo + SFUMA,
              transform: `translateX(${bordoOra - SFUMA}px)`,
              transition: 'transform 700ms cubic-bezier(.2,.8,.3,1)',
              background: `linear-gradient(90deg, rgba(${NEBBIA},0) 0, rgba(${NEBBIA},0.55) ${SFUMA * 0.45}px, rgba(${NEBBIA},0.94) ${SFUMA}px, rgb(${NEBBIA}) 100%)`,
            }}
          />
        </div>
      </div>
      {/* Bordo basso sfumato nel colore del gioco. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-notte-900" />
    </div>
  );
}
