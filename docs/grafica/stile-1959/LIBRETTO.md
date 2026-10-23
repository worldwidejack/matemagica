# Libretto del 1959: il film d'origine smontato inquadratura per inquadratura

> 23 ottobre 2026 · branch `claude/decompilazione-1959` · si legge col catalogo e coi provini sul Mac.
> L'ispirazione d'origine di Matemagica è «Paperino nel mondo della Matemagica» (Disney, 1959). È ancora
> protetto: vale **la regola del 1959** (CLAUDE.md), lo spirito sì, la cosa no.
> **Qui c'è solo testo nostro.** Video, fotogrammi, trascrizione e schede stanno sul Mac in
> `_handoff/mathmagic-1959/` (ignorata da git) e in Diorama, nel mondo «Riferimenti · film 1959», come
> riferimenti esterni: si studiano, non si allegano mai a un generatore e non entrano nel canone.
> I dialoghi non si trascrivono qui: si raccontano con parole nostre.
>
> **Notazione.** `I001`…`I261` = le inquadrature del catalogo (`_handoff/mathmagic-1959/catalogo.json`). I tempi
> sono `m:ss` del nostro file (26:45, 25 fps). Per l'animazione si ragiona in secondi e in **f24** (fotogrammi a
> 24, come il libretto Duolingo): il riversamento ha circa 20 immagini vere al secondo portate a 25, quindi i
> fotogrammi del file non sono quelli della pellicola.

## In tre righe

1. **Com'è fatto.** 261 inquadrature in 26:45. La camera è ferma nell'88% dei casi: tutto il movimento sta
   dentro il disegno. Le idee matematiche si mostrano su un **fondo buio**, una forma alla volta, in piani
   lunghissimi (fino a 58 s); le reazioni del protagonista sono tagli corti (mediana 2,9 s). Un quinto del film
   è ripresa dal vero (musicisti, natura, un campione di biliardo), usata come prova.
2. **Il percorso.** Dal concreto all'astratto all'infinito: una corda che suona → una stella → il rettangolo d'oro
   → il mondo (arte, corpo, natura) → i giochi → la mente in ordine → le forme pure che diventano invenzioni →
   stelle dentro stelle → porte che non finiscono. Ogni passo nasce da un oggetto del passo prima.
3. **Il meccanismo che prendiamo.** Il paesaggio è fatto della materia che insegna; la geometria si accende nel
   buio e si posa sul mondo; una voce guida e provoca uno scettico che alla fine dice da solo la parola chiave;
   ogni capitolo ha il suo colore. **Non prendiamo** personaggi, disegni, gag, musica, dialoghi, inquadrature.

---

## Come è stato fatto

| Fonte | Cosa | Affidabilità |
|---|---|---|
| **Il film intero** (`video/film.mp4`, 640×480, 25 fps, doppiaggio italiano) | Misurato fotogramma per fotogramma (40.145): luce, colore, istogrammi, flusso ottico (camera), differenze fra fotogrammi (ritmo dei disegni, tenute). | Alta sui tempi in secondi; media sui colori (riversamento vecchio, colori spenti rispetto al Technicolor). |
| **Tagli** | La Moviola ne trovava 331, il nostro rilevatore 308: 240 in comune. I 304 punti in disaccordo, le dissolvenze candidate e le inquadrature brevissime sono stati **guardati uno per uno**. Poi, descrivendo, sono saltate fuori altre 6 transizioni nascoste. | Alta. I 70 «tagli» in più della Moviola erano animazione veloce a due (il disegno cambia tanto in un fotogramma), sfarfallii nei passaggi al nero, code di lampi. |
| **Descrizioni** | Scritte guardando inizio, metà e fine di ogni inquadratura (e l'interno di quelle lunghe): cosa succede, camera, transizione, concetto e come è reso, gag, suono, dispositivi. | Alta su cosa si vede. Il suono è descritto da quello che si vede e dal parlato, non ascoltato strumento per strumento. |
| **Parlato** | whisper large-v3 sul film intero (`audio/whisper_it_mc0.json`), agganciato alle inquadrature. La voce copre il **69%** del film. | Buona sulla voce narrante; approssimata sulla voce del protagonista (famosa per essere incomprensibile); sulle parti solo musicali whisper inventa parole: sono segnate come dubbie nel catalogo. |

Il film in numeri:

| | |
|---|---|
| Inquadrature | **261**; durata media 6,2 s, mediana 3,8 s |
| Transizioni (in entrata) | **193 tagli**, **59 dissolvenze** (mediana 0,44 s ≈ 11 f24, da 0,2 a 1,6 s), **7 passaggi al nero** (0,4-0,9 s), **1 lampo** |
| Camera | ferma in **230** su 261. Nelle 31 che si muovono: carrelli avanti per *entrare* (nella valle, negli occhi, in una testa), panoramiche e avvicinamenti nelle riprese dal vero, qualche carrello che segue una camminata o rivela |
| Dal vero | **51** inquadrature, 5:23 (20%): musicisti (1:11), arte e natura (1:56), biliardo (2:16) |
| Parlato | 69% del tempo; 0% nei titoli, 38% nel capitolo della musica, 99% nella mente |
| Ritmo dei disegni (parti animate) | 97 inquadrature **a due** (~12 disegni/s), 48 a movimento continuo, 32 a tre-quattro (6-8/s), 21 a pose tenute |

### I capitoli

| # | Tempo | Inq. | Durata | Inq. media | Parlato | Colore di fondo (misurato) | Le inquadrature più lunghe |
|---|---|---|---|---|---|---|---|
| 0 Titoli | 0:00-0:48 | 9 | 48 s | 5,3 s | 0% | notte, marrone, carbone | cartelli da ~6 s |
| 1 L'arrivo | 0:48-2:59 | 27 | 2:11 | 4,9 s | 55% | **blu notte**, blu ardesia | I011 13 s, I013 10 s |
| 2 Corda e musica | 2:59-6:54 | 56 | 3:55 | 4,2 s | 38% | **nero**, pietra, blu ardesia | **I038 37 s** (la corda) |
| 3 Pentagramma e sezione aurea | 6:54-8:41 | 6 | 1:47 | **17,8 s** | 74% | **nuvole blu, verdi, viola** | **I095 58 s**, I098 29 s |
| 4 Arte, corpo, natura | 8:41-13:06 | 39 | 4:25 | 6,8 s | 73% | cielo, pietra, poi colori veri | I116 45 s, I137 16 s |
| 5 I giochi | 13:06-21:21 | 89 | 8:15 | 5,6 s | 82% | **rosso vermiglio** sul nero, azzurro biliardo | I195 54 s, I218 36 s |
| 6 La mente | 21:21-21:59 | 7 | 38 s | 5,5 s | 99% | verde scuro, rosso scuro | I233 12 s |
| 7 Cerchio e triangolo | 21:59-25:01 | 19 | 3:02 | 9,6 s | 89% | blu notte, **rosso** | I241 40 s, I237 33 s |
| 8 L'infinito | 25:01-26:19 | 7 | 1:18 | 11,1 s | 92% | **blu cobalto**, rosso | I254 24 s, I259 22 s |
| 9 Coda | 26:19-26:45 | 2 | 27 s | — | 0% | nero stellato | — |

In tutti i capitoli fra il 44% e il 66% dell'immagine è quasi nera. Le lezioni pure (cap. 3, 7, 8) hanno le
inquadrature più lunghe; i giochi, con gli inseguimenti e il biliardo, le più tagliate.

---

## Il percorso didattico: l'ordine e i ponti

Il film è una catena: ogni idea nasce da un oggetto dell'idea prima. Il ponte è quasi sempre **un oggetto o una
forma che resta** mentre intorno cambia tutto, oppure **una domanda della voce**.

| # | Passo | Inq. | Come è reso | Il ponte verso il passo dopo |
|---|---|---|---|---|
| 1 | **La soglia** | I010 | Nel buio si apre una porta di luce; l'esploratore entra piccolissimo. | Il buio diventa paesaggio. |
| 2 | **Il mondo è fatto di numeri** | I011-I026 | Rocce, alberi, fiori, cascate e orme sono cifre; creature fatte di cerchio, rettangolo, triangolo; un uccello recita le cifre del pi greco. | La voce trova il punto debole dello scettico: gli piace la musica. |
| 3 | **Il salto nel tempo** | I031-I036 | Un turbine di scintille cambia l'abito e il luogo (Grecia). Poi il fondale si spegne: resta solo il protagonista nel buio. | Il palco vuoto prepara l'oggetto della lezione. |
| 4 | **La corda** | I037-I038 | Una sola linea bianca sul nero, 37 s: si pizzica, si divide a metà (stessa nota, più alta), poi a 2/3 e 3/4. Ogni frazione si **sente**. | Le corde divise diventano uno strumento; chi l'ha scoperto? |
| 5 | **I pitagorici** | I042-I092 | Una confraternita segreta, un simbolo sul palmo, una musica fatta insieme; un salto alla musica di oggi (dal vero) con le corde che si somigliano; l'iniziazione del protagonista. | **La stella sul palmo** diventa la stella nel cielo (I094 → I095). |
| 6 | **Pentagramma → sezione aurea → rettangolo d'oro → spirale** | I095-I098 | Su un cielo di nuvole scure i segmenti si accendono uno alla volta; la stella genera il pentagono, il pentagono il rettangolo, il rettangolo si annida in sé stesso e nasce la spirale. | **Il rettangolo resta fermo** e sotto arriva il mondo (I099). |
| 7 | **Il rettangolo d'oro nell'arte** | I099-I114 | Il rettangolo si posa, si riempie, si divide su un tempio, statue, una cattedrale, un ritratto, un grattacielo, un quadro moderno: in ordine di tempo, da 2.400 anni fa a ieri. | Dal quadro al corpo vivo (I115). |
| 8 | **Il corpo** | I115-I116 | Il rettangolo misura una ballerina vera; il protagonista prova a entrarci e non ci sta. | **La cornice resta** (un pentagono) e dentro, al suo posto, arrivano i fiori (I116). |
| 9 | **La natura** | I117-I137 | Dal vero: fiori e stelle marine a cinque punte, conchiglie e nautilo con la spirale disegnata sopra, pigne e girasoli, favi e occhi di mosca, ragnatele, cristalli; in dissolvenze sempre più strette, poi una raffica. | La simmetria dei cristalli diventa un caleidoscopio fatto del protagonista, che ne esce stordito: «una giostra» → i giochi. |
| 10 | **Gli scacchi** | I141-I177 | Il set si costruisce intorno a lui (riflettore, scacchiera, pezzi giganti); diventa grande e vede la partita dall'alto, come diagramma. | Annoiato dalla strategia: «anche gli altri giochi…». |
| 11 | **I campi da gioco** | I178-I189 | Ogni sport è una forma disegnata nel buio (rombo, rettangolo a strisce, cerchi, griglia); cambio d'abito a giravolta per ognuno. | Un gioco «da grandi»: due quadrati e tre sfere. |
| 12 | **Il biliardo** | I190-I226 | Un campione vero dall'alto; il calcolo **sulla sua fronte** in sovrimpressione; il sistema a diamanti come sottrazione, spiegato due volte con numeri diversi; il protagonista sbaglia i conti (groviglio) e poi riesce. | Il calcolo avviene nella testa: «il gioco più straordinario si fa nella mente». |
| 13 | **La mente in ordine** | I227-I233 | Si entra dagli occhi: la mente è una soffitta piena di cassetti etichettati (idee vecchie, approssimazioni, preconcetti, superstizioni, confusione); una scopa fa pulizia. | Una mente pulita è un foglio buio su cui pensare un cerchio perfetto. |
| 14 | **Forme pure → solidi → invenzioni** | I234-I252 | Il cerchio storto si raddrizza; ruotando diventa sfera, tagliato lente, poi strumenti ottici; rotolando ruota e macchine; il triangolo che gira è un cono, le sue sezioni orbite, fari, telescopi; una linea sul cono è molla e orologio. | «Pensa alla stella pitagorica»: si torna al simbolo del passo 5. |
| 15 | **L'infinito** | I253-I259 | Stelle dentro stelle; le linee si allungano in un corridoio di porte senza fine; sono chiuse, la chiave la dice il protagonista; le porte volano via nello spazio; una frase di Galileo. | — (il film non chiude: le porte restano da aprire) |

**Le tre regole del percorso.**
- **Dal concreto all'astratto, poi oltre.** Si parte da una cosa che si tocca e si sente (una corda) e si arriva a
  cose che esistono solo pensandole (il cerchio perfetto, l'infinito). Il mondo vero (dal vero) sta nel mezzo, come
  prova.
- **Il simbolo che torna.** La stella a cinque punte compare sul muro (I035), sul palmo (I045, I093), nel cielo
  (I095) e alla fine (I253): lega l'inizio della lezione con la sua conclusione.
- **Prima la forma, poi la cosa.** Il rettangolo prima del tempio, i due quadrati prima del biliardo, il cerchio
  prima della ruota: la forma astratta è presentata da sola, e il mondo ci si incastra dopo.

**Prendiamo:** la catena (ogni livello nasce da un oggetto del livello prima), il simbolo che torna, «prima la forma
poi la cosa», l'arco concreto → astratto → infinito. Coincide con quello che chiede papà (allenare la mente, non
preparare esami). **Non prendiamo:** l'ordine dei capitoli uno a uno, gli esempi scelti dal film nella stessa
sequenza (tempio, statue, cattedrale, ritratto, grattacielo), il biliardo spiegato col suo stesso metodo e gli
stessi numeri. L'ordine nostro lo decide papà (`docs/papa/03-il-viaggio.md`).

---

## Capitolo per capitolo

Per ognuno: come è costruito (i battiti, con le inquadrature), il meccanismo, cosa prendiamo e cosa no, e dove va da
noi (i nomi dei regni sono le proposte di `../mondo/MAPPA.md`, non decisioni).

### 0 · Titoli (0:00-0:48, I001-I009)
- **Costruzione.** Un cartello del distributore, poi un fondale notturno fisso con un albero spoglio, costellazioni
  a forma di diagramma e numeri nascosti fra le radici; i cartelli dei crediti si susseguono **in dissolvenza uno
  sopra l'altro** (6 dissolvenze di ~0,5 s), senza tagli.
- **Meccanismo.** Il mondo si presenta prima della storia: il fondale dei titoli è già fatto della materia del film.
- **Prendiamo:** l'avvio dell'app che mostra subito il mondo (forme nel cielo), il testo che entra sopra il testo in
  dissolvenza. **Non prendiamo:** il fondale, l'albero, il lettering.

### 1 · L'arrivo (0:48-2:59, I010-I036)
- **Costruzione.** Buio totale, una porta di luce si apre (I010, 9 s, nessun taglio). L'esploratore cammina in un
  paesaggio notturno di cifre (I011, 13 s; I012 con il fondale che scorre). Una matita viva gioca a tris da sola
  (I013, 10 s); tre reazioni brevissime del protagonista in 3,8 s (I014-I016). Cascata di cifre, sassi nel ruscello
  (I017), bosco di forme squadrate (I018). Tre uccelli-forma, uno recita il pi greco (I019, 10 s). La voce entra
  (I021) e risponde alle domande dello scettico; alberi coi numeri come frutti (I024); la valle al tramonto che
  promette il viaggio (I026, carrello avanti). Lo scettico protesta (I027-I030), viene agganciato con la musica,
  un turbine di scintille lo veste da greco (I032), il fondale greco si accende e si spegne (I033-I036).
- **Meccanismo.** Il paesaggio **è** la materia: numeri come natura. La guida è una voce senza corpo che sfida con
  affetto. Lo scettico è il pubblico: le sue obiezioni sono dette ad alta voce e diventano il motore.
- **Ritmo.** Esplorazione in piani lunghi (8-13 s), reazioni in raffiche di tagli da 1-2 s; si alternano.
- **Prendiamo:** la soglia nel buio come primo avvio; il mondo fatto di forme (non di cifre: regola del 1959); la
  guida che provoca chi dice «non fa per me»; l'aggancio a qualcosa che il giocatore già ama. **Non prendiamo:**
  l'esploratore col fucile, la matita viva, gli uccelli-forma, le orme numerate, la cascata di cifre.
- **Da noi:** l'Approdo delle forme, il primo avvio col gatto.

### 2 · La corda e la musica (2:59-6:54, I037-I092)
- **Costruzione.** «Per prima cosa ci vuole una corda»: una scia di luce trascina via il protagonista, poi **37
  secondi di una sola linea bianca sul nero** (I038). Ogni divisione arriva con una frase della voce, circa ogni 3
  s, e si sente una nota. Le corde diventano una lira, la lira sparisce (I039). Il tempio notturno, i pitagorici
  incappucciati, gli occhi nel buio, il simbolo sul palmo, la stretta di mano segreta (I042-I048): tagli da 1-4 s,
  piccoli e misteriosi. Il protagonista copia la loro camminata furtiva (I049). La sala segreta è una jam session
  (I050-I071): suonatori diafani, il protagonista che usa un'anfora come tamburo e balla. Le corde dell'arpa si
  sciolgono **in quelle di un contrabbasso vero** (I072): con lui 15 inquadrature dal vero di jazz e di orchestra
  (I072-I086), poi l'arpa vera torna lira antica (I087). I suonatori evaporano in scintille (I088-I091), Pitagora
  stringe la mano al protagonista e sparisce (I092).
- **Meccanismo.** Un oggetto solo, sul nero, che **suona**: la prova è sonora. La storia della scoperta come
  iniziazione a un segreto. La **dissolvenza di corrispondenza** (corda antica → corda moderna) collega epoche senza
  spiegarlo.
- **Prendiamo:** la lezione su fondo nero con un oggetto e un suono per ogni passo; il suono come prova (una
  frazione si sente); il segreto e l'iniziazione per sbloccare una storia; il passaggio da una cosa a un'altra
  attraverso la forma che hanno in comune. **Non prendiamo:** i pitagorici come sono disegnati, la jam, il tamburo
  d'anfora, le riprese dei musicisti, la musica.
- **Da noi:** l'isola dell'Armonia (Bilancia, Catena); la storia di Pitagora scritta da papà; il suono di ogni
  risposta come nota di una scala.

### 3 · Il pentagramma e la sezione aurea (6:54-8:41, I093-I098)
- **Costruzione.** La stella sul palmo (I093-I094) si stacca dalla mano in dissolvenza e resta sola su un cielo di
  nuvole scure: **58 secondi a camera ferma** (I095). I segmenti si accendono uno alla volta e si sommano; la stella
  cambia colore (oro, rosso); si scompone. Il pentagono cresce e genera la stella (I096), cinque rettangoli si
  fondono in uno (I097), il rettangolo d'oro si divide all'infinito e mostra la spirale (I098, 29 s).
- **Cadenza misurata (I095).** Un passo nuovo a 0, 11, 19, 26, 33, 38, 44, 48 s…: gli intervalli scendono da ~11
  s a ~2 s. Ogni passo coincide con una frase della voce. Il fondo cambia colore a ogni idea (blu → verde → viola).
- **Meccanismo.** **Forma isolata al centro**, tanto vuoto, una cosa alla volta, il colore che indica il pezzo di cui
  si parla. Una forma genera la successiva.
- **Prendiamo:** questo è il modello per le spiegazioni al debutto di un gioco e per il momento «aha» della
  soluzione: forma sola, passi legati alle frasi, accelerare quando l'idea è capita, nessun taglio. **Non
  prendiamo:** il cielo di nuvole dipinto così com'è, la stella come diagramma identico.
- **Da noi:** l'isola d'Oro; `SpiegazioneSchermo`; la soluzione dei rompicapo (`PuzzleShell`).

### 4 · Arte, corpo e natura (8:41-13:06, I099-I137)
- **Costruzione.** Il contorno del rettangolo d'oro resta fermo su un blu vuoto mentre il paesaggio gli scorre sotto
  finché il tempio non ci cade dentro (I099). Poi su ogni opera lo stesso gesto in tre tempi: **il rettangolo si
  posa, si riempie di arancio, si divide e si spegne** (I100-I114, 2-15 s l'una), con due passaggi al nero per i
  salti di secoli (I108, I111). Una ballerina vera misurata dal rettangolo (I115); il protagonista prova a entrarci
  in un piano di 45 s (I116): cadono rettangoli, ci gioca, non ci sta, finisce chiuso in un pentagono; nel
  pentagono, al suo posto, compaiono in dissolvenza una petunia, un fiore, un gelsomino, una stella marina. Poi 19
  inquadrature di natura dal vero quasi tutte legate da dissolvenze (I117-I135), alcune con il diagramma disegnato
  sopra (la stella su una pervinca, la spirale sul nautilo); una raffica di cristalli al microscopio, un'immagine
  ogni 0,2 s (I136); un caleidoscopio animato fatto del protagonista (I137).
- **Meccanismo.** **Il diagramma sovrapposto alla cosa vera**: la geometria trasparente si posa sul mondo e lo
  spiega. **La cornice che resta** mentre il contenuto cambia. La prova per accumulo: tanti esempi in fila, sempre
  più svelti. La comicità del fallimento consola (non tutti sono perfetti).
- **Prendiamo:** la sovrapposizione (giusto = la forma combacia col disegno); la cornice fissa con il contenuto che
  cambia (collezione: la stessa forma in cose diverse); l'accumulo che accelera; la regola «prima la forma, poi la
  cosa». **Non prendiamo:** le opere scelte e il loro ordine, le riprese dal vero, la ballerina, il caleidoscopio
  del protagonista.
- **Da noi:** l'isola d'Oro e l'isola della Spirale; la collezione delle storie.

### 5 · I giochi (13:06-21:21, I138-I226)
- **Costruzione.** Il protagonista stordito, poi interessato (I138-I140). **Il set si costruisce intorno a lui**:
  un riflettore nel nero, la scacchiera che compare sotto, i pezzi giganti che entrano (I141, 18 s). Una citazione
  di un libro famoso: diventa la bambina protagonista, i pezzi rossi lo accusano e lo inseguono (I142-I159, tagli da
  1-4 s); un dolcetto lo fa crescere in una raffica di 7 quadri da 0,2 s (I163-I169); da gigante vede la partita
  **dall'alto** come un diagramma, 20 s di partita che si gioca da sola fino allo scacco matto (I172-I176). Poi una
  giravolta per ogni sport: baseball (rombo), football (rettangolo a strisce), basket (cerchi), campana (griglia),
  ognuno disegnato a linee nel buio (I178-I189). Due quadrati e tre sfere diventano un biliardo (I190). Il
  protagonista tira e la bilia gli torna in testa (I192-I193). Il campione vero (I194-I215): 54 s dall'alto di
  colpi a tre sponde contati a voce, il tavolino che compare **sulla sua fronte** e la camera che ci entra
  (I206, I213), il diagramma coi diamanti e i numeri: due esempi dello stesso metodo (I207-I214). Il
  protagonista prova: entra nella sua testa e trova **un groviglio di linee e numeri** (I218, 36 s), la voce rifà
  il conto pulito e resta una linea sola; i numeri gli compaiono attorno alla testa scritti nell'aria (I222-I223);
  tira a caso e la bilia fa un giro impossibile (I225); esulta e il panno esplode (I226).
- **Meccanismo.** Ogni gioco è una forma. **Il pensiero reso visibile** (sovrimpressione sulla fronte, la camera che
  entra nella testa). **L'errore reso visibile** come groviglio, la soluzione come linea unica. La regola spiegata
  due volte con numeri diversi.
- **Prendiamo:** il set che si costruisce attorno al giocatore; vedere dall'alto per capire; il groviglio che si
  scioglie in una linea (perfetto per il Numero bersaglio e i rompicapo); la regola ripetuta con un secondo esempio
  dopo un errore. **Non prendiamo:** la citazione del libro e il travestimento, i pezzi degli scacchi parlanti, i
  costumi sportivi, il campione dal vero, il metodo del biliardo con gli stessi numeri.
- **Da noi:** l'isola dei Giochi (Numero bersaglio, Quadrato magico); un gioco nuovo possibile sui rimbalzi.

### 6 · La mente in ordine (21:21-21:59, I227-I233)
- **Costruzione.** La camera entra fra gli occhi (I227) fino al nero; dal nero si accende una soffitta piena di
  carte e schedari etichettati (I228-I229); una scopa fa pulizia (I230); fuori, la polvere esce dalle orecchie del
  protagonista e gli occhi girano (I231-I232); si scuote e sorride (I233).
- **Meccanismo.** **La mente è un luogo** in cui si entra dagli occhi. Le etichette dei cassetti fanno la diagnosi in
  una parola. Una gag fisica alleggerisce un messaggio serio.
- **Prendiamo:** la Palestra come stanza da riordinare, la nebbia che si dirada giocando; entrare «dentro la testa»
  come transizione verso il pensiero astratto. **Non prendiamo:** gli schedari con quelle etichette, la scopa, la
  polvere dalle orecchie.
- **Da noi:** la Soffitta della mente (= la Palestra).

### 7 · Cerchio e triangolo, le invenzioni (21:59-25:01, I234-I252)
- **Costruzione.** «Pensa a un cerchio perfetto»: la camera entra negli occhi (I234-I236); il cerchio nasce **storto
  e si corregge** (I237); col diametro dentro gira e diventa sfera, una fetta è una lente; strumenti ottici a linea
  dorata (I238); un lampo giallo a tutto schermo (I239). Il cerchio rotola: ruota, automobile, locomotiva,
  ingranaggi, aereo (I240, 18 s); il triangolo gira e fa un cono, le sue fette diventano orbite, faro, telescopio
  (I241, 40 s); un altro lampo (I243); una linea sul cono diventa trapano, molla, orologio, telefono (I243-I245);
  macchine fantastiche, ingranaggi, pendoli su fondi rossi (I246-I249); si esce dalla testa attraverso i dischi
  colorati (I250-I252).
- **Meccanismo.** **Catene di metamorfosi** senza tagli: una forma diventa la successiva nello stesso disegno,
  ~1-3 s a trasformazione, 6-10 anelli per catena. Due operazioni generano gli oggetti: **ruotare** e **tagliare**.
  Il lampo come punteggiatura fra due catene.
- **Prendiamo:** le animazioni di sblocco (la formina che diventa l'oggetto del gioco); rotazione e sezione come
  idee di gioco; il cerchio che nasce storto e si corregge (l'errore che si sistema da sé). **Non prendiamo:** le
  invenzioni in quell'ordine e con quei disegni, le macchine fantastiche.
- **Da noi:** un regno delle invenzioni più avanti; le animazioni di sblocco in `src/anim/`.

### 8 · L'infinito (25:01-26:19, I253-I259)
- **Costruzione.** Dagli occhi del protagonista, una stella rosa sul blu cobalto; dentro un'altra, un'altra, un'altra
  (I253); le linee si allungano in prospettiva e diventano un corridoio di porte senza fine (I254, 24 s). Le porte
  sono chiuse (I255-I256); il protagonista dice da solo qual è la chiave (I257, 1,2 s); le porte volano via nello
  spazio, una nebulosa, la frase di Galileo scritta a mano (I258-I259).
- **Meccanismo.** La **ricorsione** porta all'infinito senza dirlo. La **prospettiva centrale** è l'immagine
  dell'infinito. **La conquista è del protagonista**: la parola chiave la dice lui, non la voce. Il finale lascia le
  porte da aprire.
- **Prendiamo:** dopo l'ultima isola il sentiero continua (porte, livelli infiniti); il giocatore che conclude da
  solo; la frase di Galileo dall'originale del *Saggiatore* (pubblico dominio). **Non prendiamo:** il corridoio
  disegnato così, le porte rosse e gialle, il volo nello spazio.
- **Da noi:** la Porta dell'infinito, dopo l'ottava isola.

---

## I dispositivi visivi che tornano

Contati sulle descrizioni (un'inquadratura può averne più d'uno). L'elenco completo, inquadratura per inquadratura,
è nel campo `dispositivi` del catalogo.

| Dispositivo | Quante | Dove (esempi) | Come funziona, coi tempi | Prendiamo | Non prendiamo |
|---|---|---|---|---|---|
| **Il buio fa da lavagna** | 13 lezioni, ~50% dei fotogrammi quasi neri | I038, I095, I207, I237 | Fondo nero o notte dipinta; la matematica appare in linee chiare e calde. | Fondo scuro per le spiegazioni; la forma come unica luce. | Il nero piatto del film: da noi è la notte dipinta di S5. |
| **La forma isolata al centro** | 18 (mediana **9,9 s**) | I038, I095, I098, I174, I186 | Una cosa sola, tanto vuoto intorno; la camera non si muove. | Le spiegazioni e la soluzione. | — |
| **La linea che si traccia** | 18 | I013, I096, I123, I178 | La figura non compare: si disegna davanti a te, poi si trasforma. Tenute di 2-3 s fra un tratto e l'altro. | Ogni forma nuova nasce tracciata (12 disegni/s), mai a dissolvenza. | — |
| **Una cosa alla volta** | 6 lezioni | I038, I095, I207, I218 | Un passo per frase della voce, ogni 3-11 s, sempre più svelto. | La cadenza delle spiegazioni; il pulsante si accende alla fine (anche Duolingo, regola 5). | — |
| **Il colore che evidenzia** | 6 | I095, I101, I109, I207 | Il pezzo di cui si parla si accende (oro, arancio, rosso); il resto resta linea. | L'evidenza sui pezzi di un quesito. | — |
| **Il diagramma sopra la cosa vera** | 20 (mediana 5,9 s) | I099-I114, I123, I126, I212 | La geometria trasparente si posa, si riempie, si divide, si spegne. | Feedback del giusto: la forma combacia. | Le opere e le foto del film. |
| **Prima la forma, poi la cosa** | 3 + i campi | I099, I178-I190, I237 | La forma astratta da sola, poi il mondo ci si incastra o ne nasce. | Ordine dei livelli e delle spiegazioni. | — |
| **Metamorfosi e catene** | 19 + 6 catene (mediana 8 s) | I032, I137, I240, I241, I243 | Una forma diventa la successiva nello stesso disegno, ~1-3 s a passo. | Sblocchi, passaggi di isola, trasformazioni delle formine. | Le catene del film (ruota → auto → treno…). |
| **Dissolvenza di corrispondenza** | 12 | I072, I087, I094, I120, I127, I132 | Due cose con la stessa forma si fondono (corda → corda, riccio → fiore, favo → occhio). | Collegare una storia a un gioco attraverso la forma comune. | — |
| **La cornice che resta** | I116 (e I099) | I116 | La cornice è ferma, il contenuto cambia in dissolvenza. | La collezione; il «la stessa forma è ovunque». | Il protagonista chiuso nel pentagono. |
| **Entrare nella testa** | 7 (mediana 3,4 s) | I206, I213, I217, I227, I234-I236 | Carrello avanti verso gli occhi o la fronte; dentro, il pensiero è uno spazio buio con diagrammi. | Passaggio dal gioco alla spiegazione; il gatto che «pensa». | — |
| **L'errore visibile** | 4 | I218, I222, I223, I237 | Il conto sbagliato è un groviglio di linee e numeri; la soluzione lo sostituisce con una linea sola. | La soluzione dei rompicapo; l'aiuto. | — |
| **Il set si costruisce intorno** | 3 | I141, I190, I245 | Un riflettore accende il personaggio, poi compaiono il pavimento e gli oggetti. | L'ingresso in un gioco nuovo. | — |
| **Piccolo nel grande** | 10 | I010, I011, I024, I042, I256 | Il personaggio minuscolo in un paesaggio enorme. | Il sentiero e le isole (già in Sassi e isole). | — |
| **Il colore di capitolo** | 8 + misurato | tabella dei capitoli | Ogni capitolo cambia il colore di fondo: notte blu, pietra, nuvole, rosso, cobalto. | Il colore di ogni isola (`STILE.md`). | — |
| **Il cambio d'abito** | 5 | I032, I144, I178, I181, I188 | Una giravolta o un turbine cambia costume e mondo. | Il gatto con un oggetto di scena per ogni gioco (già nel libretto Duolingo). | I costumi del film. |
| **Dal vero come prova** | 51 (mediana 4 s) | I072-I086, I115-I136, I194-I215 | Quando serve la prova, il film passa alla ripresa vera; il cartone ci entra (I196, I204, I219). | Forse, più avanti: una foto vera nella collezione. | Le riprese del film. |
| **La raffica** | 8 | I136, I163-I169 | Quadri da 0,2 s (5 al secondo): per la crescita esagerata e per l'accumulo di esempi. | Il «tanti esempi» in un lampo; la combo. | — |
| **Le scintille** | 8 | I031-I032, I037-I039, I088-I093 | L'unico segno della magia: cambia abito, luogo, fa sparire. | Un solo segno per la magia del mondo. | Le scintille disegnate così. |
| **Porte e soglie** | 4 + inizio | I010, I045, I254-I259 | Si entra da una porta di luce, si finisce davanti a porte da aprire. | Inizio e fine del sentiero. | Il corridoio del film. |

---

## La grammatica dell'animazione limitata: tempi, tenute, anticipi

Misure dal catalogo (secondi; f24 = fotogrammi a 24, arrotondati).

### Tempi tipici

| Cosa | Durata misurata | f24 | Note |
|---|---|---|---|
| Reazione del protagonista (un'inquadratura) | mediana **2,9 s** (0,6-7,8) | ~70 | Spesso 2-3 reazioni di fila da 1-2 s (I014-I016: 3 in 3,8 s) |
| Lezione con forma isolata | mediana **9,9 s**, fino a 58 s | 240 → 1.380 | Camera ferma |
| Diagramma sopra la cosa vera | mediana 5,9 s | ~140 | Posa → riempi → dividi → spegni |
| Catena di metamorfosi | 15-40 s, ~1-3 s a passo | 24-72 a passo | Nessun taglio |
| Passo di una lezione | **3-11 s**, sempre più corto | 72-260 | Legato a una frase della voce |
| Dissolvenza | mediana **0,44 s** (0,2-1,6) | ~11 (5-38) | Cucitura, non pausa |
| Passaggio al nero | 0,4-0,9 s | 9-22 | Solo per i grandi salti (epoca, luogo, dentro la testa) |
| Lampo a tutto schermo | 1 fotogramma pieno, poi il bagliore | 1-3 | Punteggiatura fra due catene |
| Quadro di una raffica | **0,2 s** | ~5 | 5 quadri al secondo |
| Inseguimento | mediana 2,8 s a inquadratura, animazione continua | ~67 | Gli unici tagli serrati del film |
| Disegni al secondo | **a due** (~12/s) nella maggior parte; 6-8/s nelle pose parlate | — | Il riversamento non permette di contare i disegni esatti |

### Le regole
1. **La camera sta ferma, il disegno si muove.** 230 inquadrature su 261 a camera fissa. Nel disegno animato si
   muove quasi solo per *entrare* (in una valle, negli occhi, in una testa), per seguire una camminata sul fondale o
   per allontanarsi e rivelare; i movimenti liberi stanno nelle riprese dal vero.
2. **Lezione lunga, reazione corta.** Le idee hanno piani da 10 s a un minuto; il protagonista reagisce in tagli
   da 1-3 s, spesso in serie. È l'alternanza che tiene il ritmo: respiro lungo, battuta corta.
3. **L'immagine aspetta la voce.** Nelle lezioni un elemento nuovo arriva con ogni frase, e fra due frasi l'immagine
   resta ferma (tenute di 2-16 s: il diagramma del biliardo I211 sta fermo 16 s mentre la voce fa il conto).
4. **L'anticipo è nella voce e nel suono.** Prima che la cosa compaia, la voce la annuncia («attento», «pensa a…»,
   «sezioniamolo») o il fondale si svuota (I036, I037). L'anticipo fisico è riservato alle gag: la mira lunghissima
   prima del tiro sbagliato (I192, 9,6 s), la preparazione acrobatica (I221, I224), il dolcetto prima della crescita.
5. **Più è grande il salto, più forte la transizione.** Taglio per le reazioni; dissolvenza corta per i passi di
   una stessa idea; passaggio al nero per i salti di secoli o per entrare nella mente; lampo fra due catene di
   invenzioni; raffica per l'eccesso.
6. **Le forme si tracciano, i personaggi scattano.** Le linee della geometria crescono a vista; i personaggi
   cambiano posa a due, con tenute brevi (mediana della tenuta più lunga per inquadratura: 0,4 s).
7. **Accelerare quando l'idea è capita.** La stella (I095) passa da un passo ogni 11 s a uno ogni 2; la natura da
   dissolvenze di 1,6 s a una raffica di 0,2 s.
8. **Il fallimento è comico, mai punito.** Il protagonista non entra nel rettangolo, sbaglia i conti, la bilia gli
   torna in testa: la voce lo consola e rispiega con un altro esempio. Nessuno si fa male.

**Prendiamo** tutte le otto regole: stanno già dentro la grammatica Duolingo (`../duolingo/LIBRETTO.md`: pose a
scatto e tenute lunghe, l'anticipo misura l'importanza, una cosa alla volta, chi sbaglia riceve la risposta). Il
film aggiunge tre cose sue: **la lezione a camera ferma lunga**, **la forma che si traccia**, **la transizione che
cresce col salto**. **Non prendiamo** il riversamento (i tempi del film sono da rimisurare sul nostro: noi animiamo
a 12 disegni/s, `src/anim/`).

---

## Come la narrazione guida

- **Una voce senza corpo.** La guida è una voce calda e ironica che si presenta come lo spirito dell'avventura e non
  si vede mai. Parla nel 69% del film. Parla di più dove l'immagine è astratta (la mente 99%, l'infinito 92%, le
  invenzioni 89%) e meno dove c'è musica (il capitolo della musica 38%): **musica e spiegazione si danno il cambio**.
- **Domanda, risposta sbagliata, prova.** La voce chiede o propone («pensa a…»), il protagonista risponde a modo suo
  (spesso sbagliando o protestando), la voce mostra. Il protagonista sbaglia **per fretta**, non per stupidità.
- **L'arco dello scettico.** Scettico (I027) → agganciato dalla musica (I030) → conquistato dal ritmo (I056) →
  iniziato (I092) → misurato e «imperfetto» (I116) → giocatore (I141) → sbaglia i conti (I218-I223) → mente in
  ordine (I233) → pensa la forma perfetta (I237) → dice lui la parola chiave (I257). Ogni capitolo sposta l'arco di
  un passo.
- **Il protagonista guarda, noi guardiamo.** Prima di ogni meraviglia c'è il suo sguardo che si gira (I016, I020);
  le sue reazioni brevi dicono allo spettatore come sentirsi.
- **Poche parole scritte.** Il film non spiega scrivendo: le scritte sono i numeri dei diagrammi, le etichette della
  mente e la citazione finale.
- **Musica come colla.** Ogni capitolo ha il suo colore musicale (arcaico, jazz, sinfonico, carillon, meccanico) e
  le transizioni passano dentro la musica, non la interrompono. Nel capitolo della corda **il suono è la
  dimostrazione**.

**Prendiamo:** la guida che provoca con affetto; domanda → tentativo → prova; l'arco dello scettico come arco del
giocatore lungo il sentiero; la parola chiave detta dal giocatore (un gioco che si conclude con una risposta sua);
poche scritte, tanta forma; il suono come prova. **Da noi la guida ha un corpo (il gatto):** dal film prendiamo
che **durante la lezione la guida sparisce** e resta la forma, come Duolingo dentro le domande di matematica; il
gatto torna per reagire. **Non prendiamo:** la voce, i dialoghi, le battute, le canzoni.

---

## Le regole del mondo

1. **Il paesaggio è fatto della materia che si insegna.** Lì numeri e forme; da noi solo forme e motivi, mai cifre
   (regola del 1959).
2. **Il mondo obbedisce alla voce.** Se la guida dice «dividiamola», la corda si divide; se dice «pensa a un
   cerchio», il cerchio c'è.
3. **La magia ha un segno solo** (le scintille, una volta il fumo): cambia abiti, luoghi ed epoche.
4. **La geometria vive nel buio e si traccia da sola**; sul mondo vero si posa trasparente.
5. **Il vero entra quando serve una prova**, e il disegno può entrare nel vero.
6. **Scala e tempo sono liberi:** si diventa giganti per vedere dall'alto, si salta di secoli con un passaggio al
   nero.
7. **La mente è un luogo** e ci si entra dagli occhi.
8. **Nessun pericolo vero:** si viene sbalzati, travolti, schiacciati, e subito dopo si sta bene.
9. **Ogni capitolo ha il suo colore.**
10. **Il protagonista non è mai stupido:** è scettico e impaziente, e alla fine ha ragione lui.

**Prendiamo** le regole 1-10 come regole del mondo di Matemagica, con due adattamenti: forme invece di cifre (1) e
la guida col corpo del gatto (2, il gatto «comanda» le trasformazioni). **Non prendiamo** il modo in cui il film le
mette in scena.

---

## Traduzione per Matemagica

| Nel film | Dove va da noi | Idea concreta | Da decidere |
|---|---|---|---|
| La soglia nel buio (I010) | Primo avvio | La prima schermata è buia; si apre una fessura di luce e compare il gatto. | gusto (Lanterna) |
| Il paesaggio fatto di materia | Sassi e isole | Ogni isola costruita con le forme del suo gioco (pesi, catene, spirali). | in parte già in `STILE.md` |
| Una forma sola sul buio, un passo per frase | `SpiegazioneSchermo` | Il debutto di un gioco: forma isolata, 3-5 passi tracciati, uno ogni 3-6 s che accelera; pulsante acceso alla fine; il gatto esce di scena durante i passi. | tecnico: si fa |
| Il groviglio che diventa una linea (I218) | `PuzzleShell` → soluzione | Nel Numero bersaglio i tentativi sbagliati restano come linee grigie; la soluzione le sostituisce con una linea d'oro. | tecnico: si fa |
| Il diagramma che si posa sulla cosa | Risposta giusta | La forma corretta si posa e combacia (posa → riempi → spegni, ~1,5 s). | — |
| La regola ripetuta con un altro esempio | Errore | Dopo un errore, il gatto mostra la regola su un esempio diverso. | papà |
| Catene di metamorfosi | `src/anim/` sblocchi | Lo sblocco di un gioco: la formina si trasforma nell'oggetto del gioco in 3-4 passi a 12 disegni/s. | gusto |
| La transizione che cresce col salto | Navigazione | Taglio fra domande, dissolvenza corta (~11 f24) fra passi, nero (~0,5 s) fra isole, lampo allo sblocco. | tecnico |
| La cornice che resta | Collezione | La carta di una storia: la stessa forma, contenuti che cambiano dentro. | gusto |
| Il simbolo che torna | Sentiero | Una forma-simbolo che compare al primo livello, a metà e all'ultimo. | papà + gusto |
| Il colore di capitolo | Isole | Il colore di fondo cambia entrando in un'isola (palette misurata qui sopra e in `STILE.md`). | già proposto |
| La mente in ordine | Palestra | La Palestra come stanza in cui la nebbia si dirada giocando. | già proposto |
| L'infinito e le porte | Dopo l'ottava isola | Il sentiero continua: porte, costellazioni. | già proposto |
| Il suono come prova | `src/audio/sfx.ts` | Ogni rapporto giusto suona un intervallo (ottava, quinta, quarta). | gusto |

---

## Da non copiare (sono loro)

Il protagonista e i suoi costumi; la voce, i dialoghi, le battute, le canzoni e la musica; i pitagorici disegnati
così e la jam session; la matita viva e gli uccelli fatti di forme; i pezzi degli scacchi parlanti, la citazione del
libro e il dolcetto che fa crescere; gli schedari etichettati e la scopa; il corridoio di porte rosse; le riprese
dal vero; la serie di opere d'arte nello stesso ordine; il metodo del biliardo coi suoi numeri; i titoli. E mai,
nell'app o nei prompt, il nome del film, dello studio o del protagonista.

## Cosa manca

- Il suono non è stato analizzato strumento per strumento: musica ed effetti sono descritti da quello che si vede e
  dal parlato. Uno strumento di ascolto nella Moviola (musica / voce / effetti) lo toglierebbe.
- Il parlato del protagonista è approssimato (whisper non lo capisce); quello della voce narrante è buono.
- I colori sono quelli di un riversamento vecchio, più spenti dell'originale: vanno letti come rapporti fra capitoli,
  non come valori esatti.
- Il riversamento ha ~20 immagini vere al secondo: i disegni al secondo e le tenute brevi sono stime.

---

## I materiali (sul Mac, in `_handoff/mathmagic-1959/`, mai nel repo)

| Cosa | Dove |
|---|---|
| Il catalogo delle 261 inquadrature (tutti i campi) | `catalogo.json`, `catalogo.csv` |
| Tre fotogrammi chiave per inquadratura (inizio, metà, fine), 640×480 | `inquadrature/I001_1-inizio.jpg` … |
| Una scheda per inquadratura (i tre fotogrammi + dati e colori) | `schede/I001.jpg` … e in Diorama |
| I provini per capitolo (fotogramma di metà di ogni inquadratura) | `provini/cap0.jpg` … `cap9.jpg` |
| Le descrizioni scritte guardando, le correzioni dei tagli, i capitoli | `analisi/descrizioni.jsonl`, `analisi/correzioni.json`, `analisi/da_spezzare.json`, `analisi/capitoli.json` |
| Le misure di ogni fotogramma | `analisi/misure.npz`, `analisi/dg.npy` |
| Il parlato | `audio/whisper_it_mc0.json` (la prima passata `whisper_it.json` va in loop sulla musica: non usarla) |
| Gli strumenti per rifarlo su un altro film | `strumenti/` (misura → controllo dei tagli → inquadrature → chiavi → catalogo → Diorama) |
| Le 8 board e la tavolozza del primo giro | `board/` |

In Diorama: mondo **«Riferimenti · film 1959»**, un'entità di tipo *riferimento* per capitolo (`rif59-cap0` …
`rif59-cap9`), un asset per inquadratura con le note complete e il provino del capitolo. `prepara_generazione` li
rifiuta: verificato il 23/10 sull'archivio vero (10 capitoli rifiutati, 13 entità col canone controllate: zero
fotogrammi del film fra gli allegati).
