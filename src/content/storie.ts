/**
 * Le storie di matematica: premi lungo il sentiero, e carte della collezione.
 * Vincolo di scrittura: si leggono in piedi, in 20 secondi (max ~70 parole).
 *
 * QUI SCRIVE PAPÀ. Le prime sono bozze di Claude, da controllare (fatti e
 * tono) e da sostituire con le storie che papà racconta volentieri.
 */
export type Storia = {
  id: string;
  /** Il nome sulla carta della collezione. */
  carta: string;
  emoji: string;
  titolo: string;
  testo: string;
  autore: 'papà' | 'bozza';
};

export const STORIE: Storia[] = [
  {
    id: 'gauss',
    carta: 'Gauss bambino',
    emoji: '🧒',
    titolo: 'La somma che durò un minuto',
    testo:
      'Si racconta che il maestro del piccolo Carl Friedrich Gauss, per tenere buona la classe, chiese di sommare tutti i numeri da 1 a 100. Gauss rispose quasi subito: 5050. Aveva visto che 1 + 100, 2 + 99, 3 + 98… fanno sempre 101. E di coppie così ce ne sono 50.',
    autore: 'bozza',
  },
  {
    id: 'al-khwarizmi',
    carta: 'al-Khwarizmi',
    emoji: '📜',
    titolo: 'Due parole, un uomo solo',
    testo:
      'Nel IX secolo, a Baghdad, al-Khwarizmi scrive un trattato sul “completare e bilanciare”: al-jabr. Da quella parola nasce “algebra”. E dal suo nome, tradotto in latino come Algoritmi, nasce “algoritmo”. Due parole che oggi sono ovunque, nate dalla stessa persona.',
    autore: 'bozza',
  },
  {
    id: 'lo-shu',
    carta: 'La tartaruga Lo Shu',
    emoji: '🐢',
    titolo: 'Il quadrato sul guscio',
    testo:
      'Una leggenda cinese racconta che dal fiume Lo uscì una tartaruga con strani segni sul guscio: i numeri da 1 a 9 disposti in un quadrato 3 × 3. In ogni riga, colonna e diagonale la somma era sempre 15. È il quadrato magico più antico che si conosca.',
    autore: 'bozza',
  },
  {
    id: 'eratostene',
    carta: 'Eratostene',
    emoji: '🌍',
    titolo: 'Misurare la Terra con un bastone',
    testo:
      'Circa 2200 anni fa Eratostene sapeva che a Siene, a mezzogiorno del solstizio, il Sole non faceva ombra. Nello stesso momento, ad Alessandria, un bastone faceva un’ombra di circa 7 gradi: un cinquantesimo di cerchio. Moltiplicò per 50 la distanza tra le due città e ottenne la circonferenza della Terra, sbagliando di pochissimo.',
    autore: 'bozza',
  },
  {
    id: 'fibonacci',
    carta: 'Fibonacci',
    emoji: '🐇',
    titolo: 'I conigli di Pisa',
    testo:
      'Nel 1202 Leonardo da Pisa, detto Fibonacci, porta in Europa le cifre indo-arabe che usiamo ancora. Nel suo libro c’è un problema di conigli che si riproducono: 1, 1, 2, 3, 5, 8, 13… ogni numero è la somma dei due prima. Quella sequenza oggi si ritrova nei semi del girasole e nelle pigne.',
    autore: 'bozza',
  },
  {
    id: 'zero',
    carta: 'Lo zero',
    emoji: '0️⃣',
    titolo: 'Il numero che non c’era',
    testo:
      'Per migliaia di anni si è contato senza lo zero. In India, attorno al VII secolo, il matematico Brahmagupta scrive le regole per usarlo come un numero vero: cosa succede se lo sommi, lo sottrai, lo moltiplichi. Senza lo zero non potremmo scrivere 105 e distinguerlo da 15.',
    autore: 'bozza',
  },
  {
    id: 'archimede',
    carta: 'Archimede',
    emoji: '🛁',
    titolo: 'Eureka!',
    testo:
      'Il re di Siracusa sospettava che la sua corona non fosse d’oro puro. Archimede, si racconta, trovò la soluzione facendo il bagno: un corpo immerso sposta tanta acqua quanto il suo volume. Bastava confrontare l’acqua spostata dalla corona e da un blocco d’oro dello stesso peso. Corse per strada gridando “Eureka!”: ho trovato!',
    autore: 'bozza',
  },
  {
    id: 'ramanujan',
    carta: 'Ramanujan',
    emoji: '🚕',
    titolo: 'Il taxi numero 1729',
    testo:
      'Il matematico Hardy andò a trovare in ospedale il geniale Ramanujan e gli disse che il suo taxi aveva un numero noioso: 1729. «No», rispose Ramanujan, «è molto interessante: è il più piccolo numero che si scrive come somma di due cubi in due modi diversi». 1³ + 12³ e 9³ + 10³.',
    autore: 'bozza',
  },
];
