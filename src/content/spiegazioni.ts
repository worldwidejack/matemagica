import type { GameId } from '../engine/cartuccia.ts';

/**
 * La mini-lezione che compare la prima volta che un gioco arriva nel sentiero.
 * Tre righe al massimo: si legge in piedi in 15 secondi.
 * Bozze di Claude: papà le rivede (vedi docs/papa/).
 */
export type Spiegazione = {
  come: string;
  trucco: string;
  esempio: string;
};

export const SPIEGAZIONI: Record<GameId, Spiegazione> = {
  'piu-grande': {
    come: 'Due espressioni, una sopra l’altra. Tocca quella che vale di più, prima che finisca il tempo.',
    trucco: 'Non serve il risultato esatto: arrotonda e confronta. 19 × 6 è quasi 20 × 6 = 120.',
    esempio: '17 × 3 oppure 49 + 4?  →  51 contro 53: vince la somma.',
  },
  coppie: {
    come: 'Una griglia di numeri e un numero magico. Tocca due numeri che insieme lo formano: spariscono.',
    trucco: 'Per ogni numero chiediti “quanto manca?”. Alcuni numeri sono esche: non hanno compagno.',
    esempio: 'Numero magico 10: 3 va con 7, 6 va con 4.',
  },
  catena: {
    come: 'Parte un numero, poi passano le operazioni una alla volta. Alla fine scegli il risultato.',
    trucco: 'Tieni a mente un numero solo, aggiornalo a ogni passo. Non cercare di ricordare tutta la catena.',
    esempio: '7  → +5  → ×2  → −3   =  21',
  },
  stima: {
    come: 'Un calcolo troppo lungo per pochi secondi e tre risposte. Scegli la più vicina.',
    trucco: 'Arrotonda i numeri a cifre tonde e fai il conto facile. 38 × 21 è circa 40 × 20 = 800.',
    esempio: '38 × 21 ≈ ?  600 · 800 · 1 100  →  800',
  },
  bersaglio: {
    come: 'Hai alcuni numeri e un bersaglio. Combinali due alla volta con + − × ÷ fino ad arrivarci.',
    trucco: 'Parti dal bersaglio: è vicino a un prodotto dei tuoi numeri? Poi aggiusta con + e −.',
    esempio: 'Numeri 3, 4, 6 · bersaglio 18  →  3 × 4 = 12, 12 + 6 = 18',
  },
  bilancia: {
    come: 'Bilance in equilibrio con forme misteriose. Scopri quanto pesa la forma chiesta.',
    trucco: 'Parti dalla bilancia più semplice. Quello che sai da una, usalo nelle altre.',
    esempio: '🔺🔺🔺 = 12  →  ogni 🔺 pesa 4',
  },
  regola: {
    come: 'Una fila di numeri nasconde una regola. Scrivi il numero che viene dopo.',
    trucco: 'Guarda i salti tra un numero e l’altro. Se i salti non sono uguali, guarda come cambiano i salti.',
    esempio: '2, 5, 8, 11, ?  →  si aggiunge sempre 3  →  14',
  },
};
