import { useEffect, useRef, useState } from 'react';
import { SENTIERO, type Livello } from '@/content/sentiero';
import type { Stelle } from '@/engine/regole';
import { useProfilo } from '@/profilo/store';
import { Bottone } from './kit';
import { livelloAperto, livelloCorrente } from './progressi';
import { SfidaDelGiorno } from './SfidaDelGiorno';
import type { StatoSasso } from './sentiero/pezzi';
import { FAMIGLIA_DI, Segnalino, appoggioDi } from './Segnalino';
import linea from '../../public/paese/sentiero.json';

/**
 * Il paese della matemagica (mondo 1959): il sentiero è una striscia orizzontale
 * che si scorre da sinistra a destra; i sassi stanno sulla strada dipinta.
 * Prova per il telefono: prende il posto delle isole solo sul preview, non su main.
 */
const PEZZI = 8;
const RAPPORTO = linea.w / linea.h; // larghezza / altezza della striscia
const MARGINE = 0.035;

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

export function SentieroPaese({ onLivello, onSfida }: { onLivello: (l: Livello) => void; onSfida: () => void }) {
  const stelle = useProfilo((p) => p.stelleLivelli);
  const corrente = livelloCorrente(stelle);
  const livelli = SENTIERO.slice(0, 40);
  const rifScorri = useRef<HTMLDivElement>(null);
  const [alto, setAlto] = useState(() => Math.min(560, Math.round(window.innerHeight * 0.62)));

  useEffect(() => {
    const f = () => setAlto(Math.min(560, Math.round(window.innerHeight * 0.62)));
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  // All'apertura la strada si porta sul sasso a cui sei arrivato.
  useEffect(() => {
    const el = rifScorri.current;
    if (!el) return;
    const { x } = postoDi(Math.min(corrente, livelli.length - 1), livelli.length);
    el.scrollLeft = x * alto * RAPPORTO - el.clientWidth / 2;
  }, [corrente, alto, livelli.length]);

  const largo = alto * RAPPORTO;
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

      <div ref={rifScorri} className="overflow-x-auto overflow-y-hidden" style={{ height: alto, scrollbarWidth: 'none' }}>
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
                  onTocca={() => onLivello(l)}
                />
                {stato === 'attuale' && (
                  <img
                    src="/personaggi/gatto.webp"
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute"
                    style={{ height: 64, right: '100%', bottom: 0, marginRight: -6 }}
                  />
                )}
              </div>
            );
          })}
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
