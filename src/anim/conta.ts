import { useEffect, useState } from 'react';
import { suona } from '@/audio/sfx';
import { menoMovimento } from './orologio';

/**
 * Un numero che sale fino al suo valore (pagella, fine del luogo): parte dopo
 * `attesa` ms, arriva in `durata` ms frenando alla fine, col «tick» che sale di tono.
 * Con «meno movimento» il numero c'è subito.
 */
export function useConta(valore: number, durata = 650, attesa = 0): number {
  const [mostrato, setMostrato] = useState(() => (menoMovimento() || valore <= 0 ? valore : 0));

  useEffect(() => {
    if (menoMovimento() || valore <= 0) return;
    let rif = 0;
    let ultimoTick = 0;
    const inizio = performance.now() + attesa;
    const passo = (ora: number) => {
      const t = Math.min(1, Math.max(0, (ora - inizio) / durata));
      const frenata = 1 - (1 - t) ** 3;
      setMostrato(Math.round(valore * frenata));
      if (t > 0 && t < 1 && ora - ultimoTick > 70) {
        ultimoTick = ora;
        suona('tick', t);
      }
      if (t < 1) rif = requestAnimationFrame(passo);
    };
    rif = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(rif);
  }, [valore, durata, attesa]);

  return mostrato;
}
