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
    // Papà (16/10): «è sempre così? o si svia dando quel trucco?». No, non sempre: il
    // prodotto porta alla soluzione circa 1 volta su 2 a metà gioco, quasi mai all'inizio.
    trucco: 'Un punto di partenza, non una regola: quanto manca al bersaglio? C’è un prodotto vicino? Se non torna, cambia strada.',
    // L'esempio vecchio (3, 4, 6 → 18) si faceva in un passo solo: 3 × 6.
    esempio: 'Numeri 4, 5, 3 · bersaglio 23  →  4 × 5 = 20, 20 + 3 = 23',
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
  quadrato: {
    come: 'Una griglia di numeri (3 × 3, più avanti 4 × 4): ogni riga, colonna e diagonale fa la stessa somma. Riempi le caselle vuote.',
    trucco: 'Cerca la riga (o colonna, o diagonale) a cui manca un numero solo. Poi chiediti: quanto vale il centro?',
    esempio: '8 · 1 · 6  →  somma 15: in ogni riga, colonna e diagonale.',
  },
  divisori: {
    come: 'Compare un cristallo con un numero. Gira lo scalpello sull’anello fino a un numero che lo divide, poi spingilo verso il centro: il cristallo si spacca nei due numeri che moltiplicati lo danno.',
    trucco: 'Prima guarda l’ultima cifra: pari si spacca col 2, 0 o 5 col 5. Somma le cifre: se fa 3, 6 o 9 si spacca col 3. Quando nessuno dei tre funziona, prova 7, 11, 13… uno per volta, a mente.',
    esempio: '91 non è pari, non finisce per 5, 9 + 1 = 10 non va col 3. Col 7? 7 × 13 = 91: si spacca in 7 e 13.',
  },
  aree: {
    come: 'Sotto la figura c’è un rettangolo d’oro: tira il suo angolo finché è grande quanto la figura, poi spingilo su.',
    trucco: 'Non contare i quadretti uno a uno: chiudi la figura nel rettangolo che la contiene e togli quello che avanza. Ogni triangolo d’angolo è metà del suo rettangolo.',
    esempio: 'Rettangolo 6 × 4 = 24, meno due triangoli da 3: restano 18. Fai un rettangolo 6 × 3.',
  },
  sudoku: {
    come: 'Una griglia 4 × 4 (più avanti 6 × 6) divisa in riquadri: in ogni riga, colonna e riquadro ci vanno tutti i numeri, da 1 a 4 (o da 1 a 6), una volta sola. Tieni premuta una casella vuota e scorri sul numero.',
    trucco: 'Cerca la casella a cui resta un numero solo. Quando non ce n’è, cambia domanda: in questa riga (o riquadro) il 3 dove può andare? Se c’è un posto solo, è lì. I segni < > aiutano: la punta indica la casella più piccola.',
    esempio: 'Riga 1, colonna 4: la riga ha già 2 e 3, la colonna il 4 → lì va l’1.',
  },
  misto: {
    come: 'Un quesito per gioco, sempre diverso: confronti, catene, stime e coppie mescolati.',
    trucco: 'Leggi il nome del gioco sopra al quesito prima di tutto: cambia il modo di pensare.',
    esempio: '17 × 3 o 49 + 4?  →  poi una catena  →  poi una stima…',
  },
};
