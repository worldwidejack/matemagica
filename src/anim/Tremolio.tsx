import { useEffect, useRef } from 'react';
import { ascolta, menoMovimento } from './orologio';

/**
 * Il tremolio del disegno a mano («line boil» dei cartoni): i contorni si deformano un
 * poco e cambiano 12 volte al secondo, come se ogni fotogramma fosse ridisegnato.
 *
 * Si monta una volta (`<FiltriTremolio />`) e poi basta la classe `tremolio` (o
 * `tremolio-forte`) su qualsiasi elemento: bottoni, carte, icone, disegni.
 * Deforma anche le scritte: sui bottoni va sullo strato del contorno, col testo sopra
 * (esempio in `src/prova/Prova.tsx`). Costa calcolo a ogni scatto: pezzi piccoli e medi,
 * non sfondi interi. Per un disegno fermo che trema senza costi: `fogli.py --tremolio 3`.
 */
export function FiltriTremolio() {
  const leggero = useRef<SVGFETurbulenceElement>(null);
  const forte = useRef<SVGFETurbulenceElement>(null);

  useEffect(() => {
    if (menoMovimento()) return;
    let seme = 0;
    let ultimo = 0;
    return ascolta((ora) => {
      if (ora - ultimo < 1000 / 12) return;
      ultimo = ora;
      seme = (seme + 1) % 3; // tre disegni che si alternano: il classico giro del line boil
      leggero.current?.setAttribute('seed', String(seme + 1));
      forte.current?.setAttribute('seed', String(seme + 11));
    });
  }, []);

  return (
    <svg aria-hidden width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="tremolio" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence ref={leggero} type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={1} result="rumore" />
        <feDisplacementMap in="SourceGraphic" in2="rumore" scale={3} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="tremolio-forte" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence ref={forte} type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={11} result="rumore" />
        <feDisplacementMap in="SourceGraphic" in2="rumore" scale={6} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
