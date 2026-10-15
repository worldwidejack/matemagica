/**
 * Un solo requestAnimationFrame per tutte le animazioni a scatti dell'app: gira solo
 * finché qualcuno ascolta, e il browser lo ferma da solo quando la pagina non si vede.
 */

type Ascoltatore = (ora: number) => void;

const ascoltatori = new Set<Ascoltatore>();
let giro = 0;

function tic(ora: number): void {
  for (const a of ascoltatori) a(ora);
  giro = ascoltatori.size > 0 ? requestAnimationFrame(tic) : 0;
}

/** Chiama `a` a ogni fotogramma dello schermo; restituisce la funzione per smettere. */
export function ascolta(a: Ascoltatore): () => void {
  ascoltatori.add(a);
  if (!giro) giro = requestAnimationFrame(tic);
  return () => {
    ascoltatori.delete(a);
  };
}

/** Chi ha chiesto meno movimento nelle impostazioni del telefono. */
export function menoMovimento(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
