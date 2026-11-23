import type { GameId } from '@/engine/cartuccia';
import { Risultato } from '@/engine/Risultato';
import { GIOCHI } from '@/games/registro';
import { MEDAGLIE } from '@/profilo/medaglie';
import type { RiepilogoPartita } from '@/profilo/store';

/**
 * Schermate di prova, SOLO in sviluppo (`?prova=risultato`): per guardare
 * feste, medaglie e tappa completata senza doverle vincere giocando.
 */
export function Prove({ quale }: { quale: string }) {
  const q = new URLSearchParams(location.search);
  const stelle = Math.max(0, Math.min(3, Number(q.get('stelle') ?? 3))) as 0 | 1 | 2 | 3;
  const m0 = MEDAGLIE[0];
  const m1 = MEDAGLIE[4];
  const riepilogo: RiepilogoPartita = {
    xpGuadagnati: 64,
    livelloPrima: 4,
    livelloDopo: 5,
    bravuraPrima: 3.2,
    bravuraDopo: 3.9,
    recordPrima: 900,
    streak: 3,
    fiammaAccesa: true,
    missioniNuove: [],
    obiettivoRaggiunto: true,
    partiteOggi: 3,
    obiettivo: 3,
    medaglieNuove: m0 && m1 ? [{ medaglia: m0, grado: 1 }, { medaglia: m1, grado: 2 }] : [],
    salvaVinto: true,
    salvaUsati: quale === 'salvata' ? 1 : 0,
    tappaCompletata: 2,
  };
  // ?prova=gioco&id=bilancia&b=9&luogo=3: un gioco solo, alla bravura e nel luogo che vuoi.
  if (quale === 'gioco') {
    const id = (q.get('id') ?? 'stima') as GameId;
    const voce = GIOCHI[id];
    const b = Number(q.get('b') ?? 3);
    const luogo = q.get('luogo');
    if (!voce) return <p className="p-6 text-panna-50">Gioco sconosciuto: {id}</p>;
    return (
      <div className="mx-auto grid min-h-full max-w-md grid-cols-[minmax(0,1fr)]">
        <voce.Play
          bravura={b}
          record={0}
          limiti={luogo !== null ? [Math.max(0, b - 1), Math.min(10, b + 1)] : undefined}
          luogo={luogo !== null ? Number(luogo) : undefined}
          etichetta={luogo !== null ? `Livello ${Number(luogo) + 1}` : 'Palestra'}
          inPalestra={luogo === null}
          onFine={() => riepilogo}
          onEsci={() => location.reload()}
        />
      </div>
    );
  }
  return (
    <div className="mx-auto min-h-full max-w-md">
      <Risultato
        titolo="Il Quadrato magico"
        etichetta="Livello 10"
        fine={{ punteggio: 1240, stelle, bravuraDopo: 3.9, dati: [{ etichetta: 'Risolti', valore: '5/5' }, { etichetta: 'Aiuti', valore: '0' }] }}
        riepilogo={riepilogo}
        onAncora={() => location.reload()}
        onEsci={() => location.reload()}
      />
    </div>
  );
}
