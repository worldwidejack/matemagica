import type { Storia } from './storie.ts';

/**
 * Le carte delle stelle: il premio di ogni costellazione del sentiero oltre la
 * torre (una per tappa, al quinto livello). Un fatto vero di cielo e numeri,
 * da leggere in piedi in 20 secondi.
 *
 * Bozze di Claude, controllate su fonti di astronomia: papà può riscriverle.
 * L'ordine è quello di COSTELLAZIONI in sentiero.ts.
 */
export const STELLE: Storia[] = [
  {
    id: 'stella-orsa-maggiore',
    carta: 'Orsa Maggiore',
    emoji: '🐻',
    titolo: 'Il Grande Carro indica la strada',
    testo:
      'Sette stelle fanno il Grande Carro. Prendi le due stelle del bordo, lontano dal manico: la distanza tra loro, ripetuta circa cinque volte nella stessa direzione, porta alla Stella Polare. Per secoli i marinai hanno trovato il Nord così, con una misura e una moltiplicazione.',
    autore: 'bozza',
  },
  {
    id: 'stella-cassiopea',
    carta: 'Cassiopea',
    emoji: '👑',
    titolo: 'La W del cielo',
    testo:
      'Cinque stelle disegnano una W (o una M, dipende dall’ora). Cassiopea sta dalla parte opposta del Grande Carro rispetto alla Stella Polare: quando il Carro è basso sull’orizzonte, Cassiopea è alta. Le due girano intorno alla Polare, sempre una di fronte all’altra.',
    autore: 'bozza',
  },
  {
    id: 'stella-orione',
    carta: 'Orione',
    emoji: '🏹',
    titolo: 'Tre stelle in fila',
    testo:
      'La cintura di Orione sono tre stelle quasi perfettamente allineate. Prolunga quella linea verso il basso a sinistra e arrivi a Sirio, la stella più brillante del cielo notturno. In alto c’è Betelgeuse, una gigante rossa così grande che, al posto del Sole, inghiottirebbe Marte.',
    autore: 'bozza',
  },
  {
    id: 'stella-lira',
    carta: 'Lira',
    emoji: '🎵',
    titolo: 'La prossima Stella Polare',
    testo:
      'L’asse della Terra oscilla come una trottola: fa un giro intero in circa 26.000 anni. Per questo la Stella Polare non è sempre la stessa. Tra circa 12.000 anni il Nord sarà indicato da Vega, la stella più brillante della Lira.',
    autore: 'bozza',
  },
  {
    id: 'stella-cigno',
    carta: 'Cigno',
    emoji: '🦢',
    titolo: 'Il triangolo d’estate',
    testo:
      'Deneb, la coda del Cigno, con Vega e Altair forma un grande triangolo che d’estate sta quasi sopra la testa. Deneb sembra la più debole delle tre, ma è la più lontana: è quasi duecentomila volte più luminosa del Sole e la sua luce viaggia verso di noi da un paio di millenni.',
    autore: 'bozza',
  },
  {
    id: 'stella-andromeda',
    carta: 'Andromeda',
    emoji: '🌌',
    titolo: 'La luce più vecchia che vedi',
    testo:
      'In un cielo buio, vicino ad Andromeda si vede una macchiolina: è un’altra galassia, a circa 2,5 milioni di anni luce. È la cosa più lontana visibile a occhio nudo. La luce che ti arriva negli occhi è partita quando sulla Terra camminavano i primi esseri umani.',
    autore: 'bozza',
  },
  {
    id: 'stella-pegaso',
    carta: 'Pegaso',
    emoji: '🐎',
    titolo: 'Il Grande Quadrato',
    testo:
      'Quattro stelle brillanti formano il Grande Quadrato di Pegaso, il cavallo alato. Una curiosità: un angolo del quadrato, la stella Alpheratz, non è di Pegaso ma di Andromeda. Le costellazioni sono confini disegnati dagli uomini, come quelli delle regioni sulla carta.',
    autore: 'bozza',
  },
  {
    id: 'stella-perseo',
    carta: 'Perseo',
    emoji: '☄️',
    titolo: 'Le lacrime di San Lorenzo',
    testo:
      'Ogni agosto la Terra attraversa la scia di polvere di una cometa. I granelli bruciano nell’aria e sembrano arrivare da Perseo: sono le Perseidi. Nella notte migliore se ne contano fino a un centinaio all’ora, lontano dalle luci. Basta sdraiarsi e guardare in su.',
    autore: 'bozza',
  },
  {
    id: 'stella-drago',
    carta: 'Drago',
    emoji: '🐉',
    titolo: 'La Polare delle piramidi',
    testo:
      'Quando in Egitto si costruivano le piramidi, circa 4.700 anni fa, la stella che indicava il Nord non era la nostra Polare: era Thuban, nella coda del Drago. Colpa (o merito) della trottola lenta dell’asse terrestre, che cambia la Polare nei millenni.',
    autore: 'bozza',
  },
  {
    id: 'stella-gemelli',
    carta: 'Gemelli',
    emoji: '👯',
    titolo: 'Una stella, sei stelle',
    testo:
      'Castore e Polluce sono le teste dei Gemelli. A occhio Castore sembra una stella sola, ma col telescopio si scopre che è un sistema di sei stelle che girano l’una intorno all’altra: tre coppie, che a loro volta ballano insieme.',
    autore: 'bozza',
  },
  {
    id: 'stella-scorpione',
    carta: 'Scorpione',
    emoji: '🦂',
    titolo: 'Il rivale di Marte',
    testo:
      'Il cuore dello Scorpione è Antares, rossa come Marte: il suo nome vuol dire proprio “rivale di Marte”. È una supergigante: il suo diametro è circa 700 volte quello del Sole. Se fosse al posto del Sole, arriverebbe oltre l’orbita di Marte.',
    autore: 'bozza',
  },
  {
    id: 'stella-sagittario',
    carta: 'Sagittario',
    emoji: '🎯',
    titolo: 'Il centro della galassia',
    testo:
      'Guardando verso il Sagittario guardi verso il centro della nostra galassia, la Via Lattea, a circa 26.000 anni luce. Lì c’è un buco nero quattro milioni di volte più pesante del Sole. Il Sole gli gira intorno: un giro dura circa 230 milioni di anni.',
    autore: 'bozza',
  },
  {
    id: 'stella-aquila',
    carta: 'Aquila',
    emoji: '🦅',
    titolo: 'La trottola schiacciata',
    testo:
      'Altair, la stella più brillante dell’Aquila, gira su se stessa in circa 9 ore: il Sole ci mette quasi un mese. Gira così veloce che si è schiacciata: all’equatore è più larga di circa un quinto che da polo a polo.',
    autore: 'bozza',
  },
  {
    id: 'stella-corona-boreale',
    carta: 'Corona Boreale',
    emoji: '💍',
    titolo: 'La stella che si risveglia',
    testo:
      'Sette stelle disegnano un semicerchio: la Corona. Lì c’è una stella speciale, T Coronae Borealis: di solito è invisibile, ma circa ogni 80 anni esplode e per qualche giorno diventa brillante come la Polare. È successo nel 1866 e nel 1946.',
    autore: 'bozza',
  },
  {
    id: 'stella-delfino',
    carta: 'Delfino',
    emoji: '🐬',
    titolo: 'Il nome scritto al contrario',
    testo:
      'Due stelle del Delfino si chiamano Sualocin e Rotanev. Leggile al contrario: Nicolaus Venator, cioè Niccolò Cacciatore, l’assistente dell’astronomo Giuseppe Piazzi all’osservatorio di Palermo. Le battezzò così all’inizio dell’Ottocento, e nessuno se ne accorse per anni.',
    autore: 'bozza',
  },
  {
    id: 'stella-leone',
    carta: 'Leone',
    emoji: '🦁',
    titolo: 'La notte delle stelle cadenti',
    testo:
      'A novembre le stelle cadenti sembrano arrivare dal Leone: sono le Leonidi. Di solito sono poche, ma nel novembre del 1833 ne caddero così tante (decine di migliaia all’ora) che in America molti pensarono che il cielo stesse finendo.',
    autore: 'bozza',
  },
];

/** Tutte le carte del gioco: le storie di papà e le carte delle stelle. */
export function trovaCarta(id: string, storie: Storia[]): Storia | undefined {
  return storie.find((s) => s.id === id) ?? STELLE.find((s) => s.id === id);
}
