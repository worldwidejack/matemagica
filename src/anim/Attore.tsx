import { useState, type CSSProperties } from 'react';
import { FOGLI, type Foglio, type NomeFoglio } from './manifest';
import { Scatto } from './Scatto';

type Props = {
  nome: NomeFoglio;
  /** Altezza in px CSS del personaggio com'è nel primo fotogramma (seduto, fermo). */
  altezza: number;
  giro?: number;
  pausa?: boolean;
  onFine?: () => void;
  className?: string;
  style?: CSSProperties;
};

/**
 * Un personaggio animato grande quanto il suo corpo: la scatola misura il personaggio fermo
 * (`corpo` del foglio), il resto del fotogramma (la coda che si muove, il salto) esce dai
 * bordi senza spostare niente. Così due animazioni dello stesso personaggio, alla stessa
 * `altezza`, si danno il cambio senza scalini.
 */
export function Attore({ nome, altezza, giro, pausa, onFine, className, style }: Props) {
  const f: Foglio = FOGLI[nome];
  const [cx = 0, cy = 0, cw = f.w, ch = f.h] = f.corpo ?? [];
  const k = altezza / ch;
  return (
    <div className={`relative shrink-0 ${className ?? ''}`} style={{ width: cw * k, height: altezza, ...style }} aria-hidden>
      <Scatto
        nome={nome}
        larghezza={f.w * k}
        giro={giro}
        pausa={pausa}
        onFine={onFine}
        className="absolute max-w-none"
        style={{ left: -cx * k, top: -cy * k }}
      />
    </div>
  );
}

/** Il gatto che aspetta: batte gli occhi, muove la coda, si guarda attorno. In ciclo. */
export function GattoVivo({ altezza, className, style }: { altezza: number; className?: string; style?: CSSProperties }) {
  return <Attore nome="gatto-aspetta" altezza={altezza} className={className} style={style} />;
}

const FINE = { 1: 'gatto-fine-1', 2: 'gatto-fine-2', 3: 'gatto-fine-3' } as const;

/**
 * Il gatto a fine partita: con 1, 2 o 3 stelle fa la sua scena (si stira, salta, mette il
 * cappello), senza stelle resta lì ad aspettare. Le stelle della schermata cadono ai
 * fotogrammi 18, 27 e 36 della scena (a 24 al secondo: 750, 1125 e 1500 ms).
 */
export function GattoFine({ stelle, altezza, pausa, className }: { stelle: number; altezza: number; pausa?: boolean; className?: string }) {
  const [finita, setFinita] = useState(false);
  const scena = stelle === 1 || stelle === 2 || stelle === 3 ? FINE[stelle] : null;
  // La scena delle 2 stelle torna alla posa di partenza: da lì il gatto riprende ad aspettare.
  if (!scena || (stelle === 2 && finita)) return <GattoVivo altezza={altezza} className={className} />;
  return <Attore nome={scena} altezza={altezza} pausa={pausa} onFine={() => setFinita(true)} className={className} />;
}

/** I millisecondi a cui cade la stella numero `i` (1, 2, 3) nella scena di fine partita. */
export const msStella = (i: number) => Math.round(((9 + i * 9) / 24) * 1000);
