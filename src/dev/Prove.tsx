import { Risultato } from '@/engine/Risultato';
import { MEDAGLIE } from '@/profilo/medaglie';
import type { RiepilogoPartita } from '@/profilo/store';

/**
 * Schermate di prova, SOLO in sviluppo (`?prova=risultato`): per guardare
 * feste, medaglie e tappa completata senza doverle vincere giocando.
 */
export function Prove({ quale }: { quale: string }) {
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
  return (
    <div className="mx-auto min-h-full max-w-md">
      <Risultato
        titolo="Il Quadrato magico"
        etichetta="Livello 10"
        fine={{ punteggio: 1240, stelle: 3, bravuraDopo: 3.9, dati: [{ etichetta: 'Risolti', valore: '5/5' }, { etichetta: 'Aiuti', valore: '0' }] }}
        riepilogo={riepilogo}
        onAncora={() => location.reload()}
        onEsci={() => location.reload()}
      />
    </div>
  );
}
