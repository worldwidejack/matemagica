import { useEffect, useSyncExternalStore } from 'react';
import type { NomeFoglio } from './manifest';
import { Scatto } from './Scatto';

/**
 * Animazioni «sopra a tutto», nel punto dello schermo che si è toccato.
 * `scoppia()` si chiama da qualsiasi file (anche fuori da React); `<StratoScoppi />`
 * va montato una volta sola, in cima all'app.
 */

type Scoppio = { id: number; nome: NomeFoglio; x: number; y: number; larghezza: number };

const MASSIMO = 12; // a tocchi rapidissimi non si accumulano all'infinito

let scoppi: Scoppio[] = [];
let prossimo = 1;
const ascoltatori = new Set<() => void>();

function avvisa(): void {
  for (const a of ascoltatori) a();
}

function iscrivi(a: () => void): () => void {
  ascoltatori.add(a);
  return () => {
    ascoltatori.delete(a);
  };
}

function leggi(): Scoppio[] {
  return scoppi;
}

/** Fa partire l'animazione `nome` centrata nel punto (x, y) dello schermo, in px CSS. */
export function scoppia(nome: NomeFoglio, x: number, y: number, larghezza = 120): void {
  scoppi = [...scoppi.slice(-(MASSIMO - 1)), { id: prossimo++, nome, x, y, larghezza }];
  avvisa();
}

function togli(id: number): void {
  scoppi = scoppi.filter((s) => s.id !== id);
  avvisa();
}

type Props = {
  /** Se c'è, ogni tocco su un bottone (o su un elemento con `data-scoppio`) fa partire questa. */
  tocco?: NomeFoglio;
  larghezzaTocco?: number;
};

export function StratoScoppi({ tocco, larghezzaTocco = 110 }: Props) {
  const lista = useSyncExternalStore(iscrivi, leggi);

  useEffect(() => {
    if (!tocco) return;
    const giu = (e: PointerEvent) => {
      const bersaglio = e.target instanceof Element ? e.target.closest('button:not(:disabled), [data-scoppio]') : null;
      if (bersaglio) scoppia(tocco, e.clientX, e.clientY, larghezzaTocco);
    };
    document.addEventListener('pointerdown', giu, { capture: true, passive: true });
    return () => document.removeEventListener('pointerdown', giu, { capture: true });
  }, [tocco, larghezzaTocco]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {lista.map((s) => (
        <Scatto
          key={s.id}
          nome={s.nome}
          larghezza={s.larghezza}
          onFine={() => togli(s.id)}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: s.x, top: s.y }}
        />
      ))}
    </div>
  );
}
