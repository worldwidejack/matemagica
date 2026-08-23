import type { LoreEntry } from '@/state/types';

/**
 * Schermate "lore": aneddoti tra un mondo e l'altro, mai meccaniche.
 * Vincolo di scrittura: si leggono in piedi, in fila alla posta, in 20 secondi.
 */
export const LORE: LoreEntry[] = [
  {
    id: 'algebra-algoritmo',
    title: 'Due parole nate dallo stesso uomo',
    body:
      'Nel IX secolo, a Baghdad, al-Khwarizmi scrive un trattato sul "riportare e bilanciare" — ' +
      'al-jabr. Da quella parola nasce "algebra". E dal suo stesso nome, latinizzato in ' +
      'Algoritmi, nasce "algoritmo". Due pilastri del mondo moderno, e sono entrambi ' +
      'il ricordo di una persona sola.',
  },
];
