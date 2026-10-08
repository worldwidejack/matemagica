import type { Limiti, Stelle } from './regole';
import type { RiepilogoPartita } from '@/profilo/store';

/** Cosa consegna un motore (arcade o rompicapo) a fine partita. */
export type FinePartita = {
  punteggio: number;
  stelle: Stelle;
  bravuraDopo: number;
  /** Due o tre numeri da mostrare nel risultato (es. "Giuste 18/20"). */
  dati: { etichetta: string; valore: string }[];
  /** Per le missioni del giorno. */
  comboMax?: number;
  puliti?: number;
};

export type PlayProps = {
  bravura: number;
  record: number;
  /** Fascia di difficoltà del livello del sentiero; assente in Palestra. */
  limiti?: Limiti;
  /** Riga sopra il titolo, es. "Livello 7". */
  etichetta?: string;
  /** In Palestra il pulsante principale è "Ancora una!", nel sentiero "Continua". */
  inPalestra?: boolean;
  /** Chi monta il motore salva la partita e restituisce il riepilogo da mostrare. */
  onFine: (f: FinePartita) => RiepilogoPartita;
  /** `dopo` è true se si esce dalla schermata di risultato (partita finita). */
  onEsci: (dopo: boolean) => void;
};

export const SCOSSA: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-9px)' },
  { transform: 'translateX(8px)' },
  { transform: 'translateX(-5px)' },
  { transform: 'translateX(3px)' },
  { transform: 'translateX(0)' },
];
