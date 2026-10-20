# Libretto dei momenti: Duolingo smontato per il gatto di Matemagica

> 18 ottobre 2026 · branch `claude/libretto-duolingo` · si legge con i fogli di provini (`W…`, `A…`).
> **I provini non sono nel repo** (il repo è pubblico e sono fotogrammi di Duolingo e di video altrui,
> decisione di Jack del 18/10). Stanno sul Mac in `_handoff/duolingo/provini/`, cartella che git ignora,
> insieme ai video sorgente (`_handoff/duolingo/video/`) e agli strumenti di misura (`_handoff/duolingo/strumenti/`).
> Regola di Jack: da Duolingo si copia **la grammatica** (tempi, anticipo, esagerazione, camera, suono, legame
> con il giocatore), **mai i disegni, le pose o le gag**.
> Notazione: **f12** = fotogramma 12 a 24 fps (0,5 s). I tempi in millisecondi sono misurati, le traduzioni in
> fotogrammi sono arrotondate (1 f ≈ 42 ms).

## In tre righe

1. **Cosa ho visto.** Ho fatto due lezioni vere sul web senza account: Matematica fino alla fine, Spagnolo fino a
   finire i cuori. Le ho misurate con un registratore messo nella pagina (eventi al millisecondo, keyframe CSS,
   fotogrammi del personaggio a 24 fps). Poi ho smontato 9 video pubblici dell'app (fine lezione, serie, lega,
   cuori, apertura) e il talk ufficiale degli animatori Duolingo.
2. **Le regole più forti.** (1) Il gioco risponde **entro un fotogramma** dal tocco. (2) Le pose arrivano **di
   scatto, in un fotogramma**, e poi **si tengono a lungo**. (3) **Anticipo lungo per le feste** (0,3-0,75 s),
   corto o nullo per le reazioni. (4) **Una cosa alla volta**: titolo, personaggi, XP, bonus, precisione,
   pulsante. (5) **La festa è proporzionata** a quello che hai fatto, e chi sbaglia non viene punito: il gioco
   resta quieto e il personaggio dice la risposta giusta.
3. **Cosa manca.** Una registrazione fatta da Jack sul suo telefono (vibrazione e suono veri, 60 fps puliti), la
   lega con i personaggi, la fine di un'unità, il «leggendario». Dettagli in fondo.

---

## Come è stato fatto

| Fonte | Cosa | Affidabilità sui tempi |
|---|---|---|
| **Lezione vera, web** (duolingo.com, ospite, 768×1024) | Matematica: onboarding, 15 domande (3 sbagliate apposta, fino a 10 giuste di fila), fine lezione, serie, obiettivo, missione, forziere, percorso. Spagnolo: cuori, coppie, combo a 5, due personaggi Rive, cuori finiti. | **Alta**: ogni evento con `performance.now()`, durate ed easing letti dai keyframe del browser, fotogrammi Lottie (SVG) e Rive (canvas) catturati a 24 fps nella pagina. |
| **9 video YouTube dell'app** (ok di Jack del 18/10, ~48 MB in `_handoff/duolingo/video/`, ignorata da git) | Fine lezione ×9 + 3 speciali, serie 99→100 e traguardo 100, lega, torneo, cuori finiti, apertura app, combo con dialogo, talk Duocon 2023. | **Media**: 30/60 fps ricampionati a 24; registrazioni altrui (alcune vecchie di 1-3 anni). |
| **Fonti scritte** (blog Duolingo, Rive, LottieFiles, stampa) | Come costruiscono i personaggi e perché. | Nessun numero sui tempi: le misure qui sono nostre. |

Niente file `.riv` o `.json` scaricati dal loro CDN: solo quello che si vede sullo schermo.

Gli strumenti si riusano per studiare qualsiasi altra app o gioco web (`_handoff/duolingo/strumenti/`):
`registratore.js` va incollato nella pagina e registra eventi, keyframe e fotogrammi a 24 fps, poi compone il
foglio dentro la pagina; `provino.sh` fa un foglio di provini da un video (ffmpeg, numeri a 24 fps, ritaglio);
`appunti_misure.md` contiene le misure grezze.

---

## Fonti scritte, in breve (con parole mie)

- **Due sistemi che girano insieme.** Nel talk Duocon 2023 gli animatori Alex Chopjian e Jasmine Vahidsafa
  spiegano che ogni personaggio delle lezioni ha due macchine in Rive. Una fa **solo le bocche**, chiamate in
  qualsiasi ordine dal codice. L'altra fa **il corpo**, che parte da *fermo* e va in *giusta* o *sbagliata*
  secondo la risposta. Girano insieme, così la bocca parla senza rompere la reazione.
  ([video](https://www.youtube.com/watch?v=fgOqvyPif3g), [blog visemi](https://blog.duolingo.com/world-character-visemes))
- **Pochi pezzi, combinazioni infinite.** Hanno scelto Rive al posto di un motore di gioco per mescolare pochi
  asset in tantissime combinazioni. Ci sono 10 personaggi, ognuno con 20+ bocche, e i tempi delle bocche escono
  in automatico dall'audio, fonema per fonema. Da fermi i personaggi fanno cenni con la testa, battono le ciglia
  e muovono le sopracciglia di continuo.
- **Lily (videochiamata).** Da ferma mescola 8 animazioni di testa × 8 di corpo (oltre 64 combinazioni, niente
  loop che si ripete). L'attesa del server diventa «sta pensando». Il principio dichiarato, da Chuck Jones:
  massimo effetto con il minimo dei fotogrammi. E «restare nel personaggio»: hanno ridotto gli occhi spalancati
  perché la facevano sembrare troppo contenta. Pezzi separati (occhi, sopracciglia, bocca) sovrapposti come in
  una stampa risograph. File sotto 1 MB, consegne ogni lunedì.
  ([Rive](https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life))
- **Il traguardo della serie è un «power-up»**: Duo cambia fisicamente. Prima avevano dei palloncini col numero,
  «poca energia». Hanno fatto più passate grezze solo su tempi e ritmo prima di rifinire. Le animazioni dei
  traguardi hanno alzato dell'1,7% i nuovi utenti ancora attivi dopo 7 giorni.
  ([blog traguardi](https://blog.duolingo.com/streak-milestone-design-animation/),
  [blog serie](https://blog.duolingo.com/how-duolingo-streak-builds-habit))
- **Forme semplici apposta.** Il Duo del 2019 è fatto di poche forme per metterlo in posa facilmente, con occhi
  grandi per espressioni leggibili. Il primo Duo che piangeva dopo una lezione fallita era «minaccioso» ed è
  stato ammorbidito.
  ([Design Week](https://www.designweek.co.uk/issues/2-6-january-2019/duolingo-owl-receives-makeover-as-app-becomes-more-gamified),
  [forme](https://blog.duolingo.com/shape-language-duolingos-art-style/))
- **Il corpo come lingua universale.** Lo sguardo di un personaggio dirige l'attenzione; l'espressione dice
  successo o confusione. È il motivo per cui usano personaggi in un'app per tutte le lingue (talk Duocon).
- Squadra: un «Design Studio» interno (animazione, personaggi, suono) cresciuto comprando gli studi Gunner,
  Hobbes e Animade. Gli annunci di lavoro chiedono After Effects + Rive. Prima di Rive usavano migliaia di file
  Lottie ([LottieFiles](https://lottiefiles.com/case-studies/duolingo)).

**Come è costruito sul web** (visto nella pagina): Duo dell'onboarding e la festa di fine lezione sono **Lottie
in SVG a 60 fps, interpolati e fluidi**. Ogni «stato» è un'animazione Lottie diversa: quella vecchia si spegne e
la nuova si accende nello stesso fotogramma. I personaggi nelle domande e il fuoco della serie sono **Rive su
canvas**. Pulsanti, fasce e schede sono **CSS** con durate fisse (300/400/500 ms).

---

## I momenti

Ogni scheda: evento che lo scatena → cosa fa il personaggio (anticipo, azione, esagerazione, tenuta, ritorno) →
durata a 24 fps → inquadratura e cambi di schermata → suono → legame con il giocatore.

### M1 · Risposta giusta (lezione senza personaggio)
| | |
|---|---|
| **Evento** | «Check» con la risposta giusta (Matematica web). |
| **Personaggio** | Nessuno: nelle lezioni di Matematica non c'è un personaggio dentro la domanda. |
| **Cosa succede** | La fascia verde in basso **appare di colpo** (nessuno scorrimento) con una lode a rotazione: «Amazing! / Nice job! / Great job! / Good job! / Great! / Nicely done! / Nice!». La risposta scelta diventa verde. La barra di avanzamento si allunga (400 ms ease) e l'anello in punta fa un **boing**: scala 0,7 → 1,1 → 0,9 → 1. |
| **Durata** | Fascia e suono entro **f0-f1** (20-40 ms dal clic). Barra e boing **10 f**. |
| **Inquadratura** | Ferma. Cambia solo il fondo dello schermo. |
| **Suono** | Lo **stesso** «ding» (1,17 s) a ogni risposta giusta, 2-6 ms dopo la fascia. |
| **Legame** | Immediato e uguale ogni volta: la varietà sta nelle parole, non nel suono. |
| **Provini** | `W04_giusta_fascia_verde.jpg` |

### M2 · Risposta sbagliata
| | |
|---|---|
| **Evento** | «Check» con la risposta sbagliata. |
| **Cosa succede** | Fascia rossa «Incorrect · Correct Answer: 6», di colpo. **Niente scossa, niente personaggio arrabbiato.** La barra avanza lo stesso (la domanda tornerà alla fine, vedi M10). |
| **Durata** | **f1-f2** (60 ms). La prima volta in assoluto ci sono 480 ms di puntini sul pulsante e il suono a 850 ms: è il caricamento, non una scelta di regia. |
| **Suono** | Una nota bassa e corta (1,04 s), diversa dal ding. |
| **Legame** | Mostra subito la soluzione: l'errore serve a insegnare, non a punire. |
| **Provini** | `W05_sbagliata_fascia_rossa.jpg` |

### M3 · Personaggio dentro la domanda: risposta giusta
| | |
|---|---|
| **Evento** | Giusta in una domanda con un personaggio Rive (Spagnolo: il signore con «water»). |
| **Anticipo** | f0-f2 fermo, poi **f3-f7 gira la testa verso di te con gli occhi chiusi**: la battuta di ciglia copre il cambio di disegno. |
| **Azione** | **f9, di scatto**: frontale, mano aperta alzata, sorriso. |
| **Tenuta** | f9-f68 (**~2,5 s**): dice la parola giusta («agua») con la bocca sincronizzata e qualche battito di ciglia. |
| **Ritorno** | f65-f70 di nuovo occhi chiusi mentre torna di tre quarti, f71 riposo. |
| **Inquadratura** | Ferma; il personaggio è piccolo, in alto a sinistra, accanto al fumetto. |
| **Suono** | La voce del personaggio (1,2 s) **insieme** al ding. |
| **Legame** | Il personaggio ti guarda (gira la testa verso di te) e ripete quello che hai detto. |
| **Provini** | `W26_signore_giusta_busto.jpg`, `W27_signore_giusta_ritorno.jpg` |

### M4 · Personaggio dentro la domanda: risposta sbagliata
| | |
|---|---|
| **Evento** | Sbagliata in una domanda con personaggio. Visti due caratteri diversi. |
| **Orso (pigro, impassibile)** | Anticipo f1-f2 occhi a fessura, **f3-f4 occhi chiusi e testa giù**. **f5 di scatto** la «presa»: occhi spalancati e storti, orecchie su. Tenuta f5-f72 (**~3 s**) mentre pronuncia la risposta giusta. f75-f81 una battuta di ciglia lunga, poi torna alla faccia annoiata, palpebre basse. |
| **Signore (bonario)** | **Nessun anticipo**: le spallucce a palmi in su ci sono già a **f1**, testa piegata, occhi chiusi. Tenuta f1-f33 (~1,3 s) mentre dice la risposta giusta. Braccia giù con una battuta di ciglia a f34-f40. |
| **Esagerazione** | Gli occhi: la differenza tra prima e dopo la presa è enorme, il resto del corpo quasi non si muove. |
| **Suono** | Nota bassa + **la voce che dice la soluzione** (1,3-1,5 s). |
| **Legame** | Reazione nel carattere del personaggio (l'orso giudica, il signore allarga le braccia) e sempre la risposta giusta detta ad alta voce. |
| **Provini** | `W23_orso_sbagliata_provini.jpg`, `W24_orso_sbagliata_faccia.jpg`, `W25_orso_sbagliata_faccia_ritorno.jpg`, `W28_signore_sbagliata_spallucce.jpg` |

### M5 · Coppie (è il nostro «Coppie magiche»)
| | |
|---|---|
| **Evento** | Tocco di una tessera, coppia giusta, coppia sbagliata (Spagnolo, «Select the matching pairs»). |
| **Tocco** | La tessera si riempie dal centro in 150 ms (ease-in, **4 f**), poi boing 1 → 1,1 → 1 in 180 ms (ease-out, **4 f**). |
| **Coppia giusta** | Verdi **subito**, con **scintille** sulle tessere, boing; dopo **330 ms (8 f)** si spengono in grigio, fuori dal gioco. |
| **Coppia sbagliata** | Rosse dopo 150 ms; boing 1 → 1,1 → 1 e poi un **secondo tremolio che si smorza** 1 → 1,05 → 1 → 1,025 → 1 (270 ms). Dopo **600 ms (14 f)** tornano neutre in 300 ms (7 f). **Costa un cuore.** |
| **Suono** | Per ogni coppia giusta di fila **una nota più alta**: i file si chiamano `Match_Correct_A_A_01 … 05`. La parola viene pronunciata. Per l'errore, `Match_Incorrect` (0,37 s). |
| **Legame** | Il suono che sale racconta la serie senza bisogno di scritte. |
| **Provini** | `W20_coppie_sbagliata.jpg`, `W21_coppie_giusta.jpg` |

### M6 · Combo: «N IN A ROW»
| | |
|---|---|
| **Evento** | Risposte giuste di fila. |
| **Cosa succede** | Da **2** di fila compare la scritta «2 IN A ROW» sopra la punta della barra, solo mentre c'è la fascia. **A 6 di fila la barra e la scritta diventano oro** e restano oro finché dura la serie. Se sbagli sparisce tutto, **senza un effetto «combo persa»**. |
| **Durata** | La scritta entra nello stesso fotogramma della fascia. |
| **Suono** | Uguale al ding normale. |
| **Legame** | La serie si vede crescere di grado (niente → numero → colore), non di volume. |
| **Provini** | `W06_combo_due_di_fila.jpg`, `W07_combo_sei_di_fila_oro.jpg` |

### M7 · Combo: intermezzo a 5 di fila
| | |
|---|---|
| **Evento** | 5 giuste di fila (Spagnolo web). Nella Matematica web non c'era. |
| **Personaggio** | Dopo il Continue la domanda scivola via (400 ms ease-out). A **~410 ms** Duo **sbuca dal bordo in basso a sinistra**: si vede solo la testa, l'ala saluta, gli occhi si guardano intorno (sguardo a destra, a sinistra, al centro, battiti di ciglia). Il fumetto dice «You're getting good at this!». |
| **Variante (web 2022)** | Due personaggi salgono dal bordo in basso con **due fumetti**: un mini dialogo tra di loro. |
| **Inquadratura** | Schermata intermedia vuota; il personaggio entra **dal bordo del quadro**, come se spuntasse da sotto il palco. |
| **Legame** | Interrompe il ritmo solo quando stai andando bene, e per poco. |
| **Provini** | `W22_combo_cinque_duo_sbuca.jpg`, `A20_combo_dialogo_web2022.jpg` |

### M8 · Cuore perso
| | |
|---|---|
| **Evento** | Errore in una lezione con i cuori. |
| **La prima volta** | Lo schermo si scurisce (velo in 300 ms) e un **riflettore**, un cerchio chiaro, illumina il contatore dei cuori in alto a destra. Dopo 500 ms un elemento della scena (con ogni probabilità il riflettore) cresce 1 → 1,4 in 500 ms. Si apre un riquadro «Each mistake costs 1 heart!» con 5 cuori, l'ultimo grigio. Spiega la regola **una volta sola**. |
| **Le altre volte** | Il contatore passa da 5 a 4 entro **1 f** e l'icona del cuore **si sgonfia**: 1 → 0,6 → 1 in 500 ms (**12 f**). |
| **Legame** | La perdita si mostra rimpicciolendo; le vincite invece rimbalzano in su (1,1). |
| **Provini** | `W19_primo_cuore_riflettore.jpg` |

### M9 · Cuori finiti
| | |
|---|---|
| **Evento** | Ultimo cuore perso. |
| **Web** | Lo stesso riflettore sul contatore (0, cuore grigio) e un riquadro «You ran out of hearts. Have a free refill on us to keep going!» con Duo **fermo** (disegno statico) che regge un mazzo di cuori. |
| **App** | Schermata scura con Duo che spunta dal basso stringendo l'ultimo cuore e sagome di cuori grigi intorno. **Quasi immobile per 5 s.** |
| **Legame** | La sconfitta è il momento **più quieto** di tutta l'app: nessuno spettacolo, una via d'uscita subito (ricarica, pratica). |
| **Provini** | `W29_cuori_finiti.jpg`, `A17_cuori_finiti_app.jpg` |

### M10 · Errori che tornano
| | |
|---|---|
| **Evento** | Fine delle domande nuove, se c'erano errori. |
| **Cosa succede** | Le domande sbagliate tornano con l'etichetta arancione «PREVIOUS MISTAKE». La serie di giuste continua: io ci sono arrivato a 10 di fila. |
| **Legame** | Non si chiude una lezione con un errore aperto. |
| **Provini** | `W08_errori_che_tornano.jpg` |

### M11 · Fine lezione (web, Matematica)
| | |
|---|---|
| **Evento** | Continue dopo l'ultima risposta. |
| **Cambio di schermata** | **Taglio netto**: la schermata nuova c'è dopo 27 ms. «Lesson Complete!» in giallo. |
| **Anticipo** | **f2-f19 (0,75 s)**: Duo e una ragazza **accucciati**, con un tremolio. È l'anticipo più lungo di tutta l'app. |
| **Azione** | f20 stacco (si allungano), **f21-f30 salto** con raggi gialli dietro la ragazza e scintille da f24, bocche spalancate. |
| **Esagerazione** | f31-f57: capriole, scambio di posto, giravolta (a f45 la ragazza è di spalle), salto a stella, Duo che vola. |
| **Tenuta** | f58-f61 atterraggio (la gonna che si allarga fa da squash); da **f61** posa di vittoria a braccia in su, **in loop** con scintille a caso circa ogni secondo, finché non premi. |
| **Schede** | XP (bordo oro) a ~90 ms; precisione «GOOD!» (bordo verde) a **~925 ms**. Ogni scheda: scala 0 → 1 in 50 ms, poi il bordo da grigio a colore in 50 ms; l'intestazione sale di 30 px in 200 ms; **cifre a rullo** come un contachilometri (300 ms dopo 250 ms). |
| **Suono** | Musica di festa (2,38 s) che parte **con l'anticipo** (~96 ms), non con il salto: il salto cade a ~0,8 s, dentro la musica. |
| **Legame** | XP e precisione sono i tuoi; la coreografia è la stessa per tutti. |
| **Provini** | `W10_fine_lezione_provini_0-1.5s.jpg`, `W11_…1.5-3s.jpg`, `W12_…3-12s.jpg`, `W09_fine_lezione_schermo.jpg` |

### M12 · Fine lezione (app: 9 coreografie, stesso copione)
| | |
|---|---|
| **Evento** | Fine lezione nell'app (tema scuro). Ogni volta una coppia diversa: Duo + un personaggio del mondo. |
| **Copione comune** | (1) I due sono già in scena; anticipo di **~8 f** (accucciati, un braccio che carica). (2) **Salto con raggi gialli** tra f8 e f18. (3) **Il titolo entra lettera per lettera**: tra f9 e f13 le lettere esplodono una dopo l'altra, più grandi del dovuto, e si assestano. (4) Atterraggio verso f21-f30. (5) **Tableau tenuto** con un piccolo loop: in qualche coreografia ci sono **fotogrammi strisciati («smear»)** su gambe e braccia, ogni ~16 f. |
| **Cascata** | XP entra a **~2,2 s** e conta per ~0,5 s. «COMBO BONUS» salta fuori a ~3,5 s e gli XP salgono ancora (17 → 22). La riga della precisione a **~4,4 s**, conta fino a 100% con l'etichetta «PERFECT!». **Il pulsante Continue arriva per ultimo, a ~5,5-5,9 s.** |
| **Inquadratura** | Palco fisso: titolo in alto, personaggi al centro, numeri in basso, pulsante in fondo. |
| **Legame** | Le etichette (COMBO BONUS, PERFECT!) arrivano solo se le hai guadagnate. |
| **Provini** | `A01_fine_lezione_indice_9_animazioni.jpg`, `A02…A10_fine_lezione_1…9.jpg`, `A11_fine_lezione_4_cascata_schede.jpg` |

### M13 · Fine lezione «speciali»: la festa proporzionata
| | |
|---|---|
| **Evento** | Fine lezione con prestazioni particolari (app su tablet). |
| **«Perfect lesson!»** | Dissolvenza al buio, **8 f di buio vuoto** (una pausa per respirare), poi titolo e personaggi insieme. Schiena contro schiena per 8 f, si girano, un braccio carica, raggi, saluto, **f52 di scatto** nella posa finale con petali che volano. |
| **«Seriously???» (lezione finita in pochissimi secondi)** | Duo appare a f3 **appisolato e sgonfio**, tiene 12 f; da f15 a f23 si gonfia piano (9 f di carica); **f24 di scatto** gli esce l'anima con le ali e la bocca spalancata, il corpo resta giù vuoto; tenuta che galleggia. |
| **«When's the parade?»** | Abbraccio (4 f), Duo si deforma in una forma piatta e lunghissima (4 f), carro a strisce (10 f) che sale (12 f), **f32 di scatto** tableau: Duo in piedi sulla testa del compagno. |
| **Grammatica** | Carica lenta → **un fotogramma** di svolta → tenuta. Il titolo cambia con la prestazione e la gag lo segue. |
| **Provini** | `A14_fine_lezione_perfect.jpg`, `A12_fine_lezione_seriously.jpg`, `A13_fine_lezione_parade.jpg` |

### M14 · Serie di giorni allungata
| | |
|---|---|
| **Evento** | Prima lezione del giorno. |
| **App (99 → 100)** | Uscita a tendina in diagonale della schermata prima. «99 day streak!» **grigio, spento, fermo per 15 f**. **Le cifre rotolano** in su come un contachilometri (7 f). «100» bianco e la scritta diventa arancione. **f30 nasce la fiamma**: piccola, poi alta e stretta (f31-f33), poi larga e bassa (f34-f35), poi oscilla fino a f40 (squash e stretch, ~10 f). Il calendario della settimana sale da sotto (6 f); il pallino di oggi si accende con una fiammella (~8 f). |
| **Web (1 giorno)** | Fuoco Rive + «1 day streak» + settimana con oggi segnato; ~1 s per accendersi. |
| **Legame** | Il numero passa da **freddo a vivo**: il cambio si vede come un oggetto fisico che rotola e prende fuoco. |
| **Provini** | `A15_serie_99_100.jpg`, `W13_serie_fuoco.jpg` |

### M15 · Traguardo della serie (100 giorni)
| | |
|---|---|
| **Evento** | Giorno di traguardo. |
| **Cosa succede** | Fiamma e calendario si spengono (12 f): **il palco si svuota** e resta solo «100». Il numero scende piano verso il centro (~16 f, la camera si riassesta). Un piccolo Duo appare sopra (f30) e balla (~30 f). Poi si allunga e cambia colore (~40 f di **carica**). **f102: lampo, lo sfondo diventa tutto arancione** e Duo è trasformato. Tenuta con battito d'ali. |
| **Durata** | ~4 s di costruzione per **un fotogramma** di svolta. |
| **Inquadratura** | Cambio di colore di tutto lo sfondo nel momento della svolta. |
| **Legame** | Più è importante il numero, più è lunga la carica. |
| **Provini** | `A16_serie_traguardo_100.jpg` |

### M16 · Missione e forziere
| | |
|---|---|
| **Missione** | «Earn 10 XP»: la barra resta **ferma a 0/10 per ~1 s** (il tempo di leggerla), poi si riempie in 400 ms ease. |
| **Forziere** | Entra scorrendo da destra in 3 f (807 → 489 → 259 → 218 px: grande primo passo, poi si assesta). **f5-f15 chiuso, con un tremolio** (anticipo 11 f). **f16 schiacciato**, f17 allungato, **f18 scoppia aperto** con le gemme, f19-f25 oscilla destra-sinistra smorzando, f26-f31 si raddrizza e le gemme brillano, f32-f37 le particelle svaniscono. Dopo, un luccichio ogni tanto. |
| **Legame** | «You earned 5 gems!»: il premio arriva dopo il gesto. |
| **Provini** | `W16_forziere_provini.jpg`, `W15_missione_barra.jpg` |

### M17 · Lega e torneo
| | |
|---|---|
| **Promozione** | Classifica → **taglio netto** sul distintivo già a piena misura. Fermo 8 f, poi un **riflesso bianco attraversa il distintivo in diagonale** (~12 f), svanisce, fermo. Nessun personaggio. |
| **Torneo sbloccato** | Taglio sulla gemma iridescente che luccica (~1 s). Le linee interne si disegnano e la gemma diventa un cubo (8 f), poi il colore si spegne fino al nero (12+ f). |
| **Legame** | Gli oggetti preziosi non saltano: brillano. |
| **Provini** | `A18_lega_promozione.jpg`, `A19_torneo_sbloccato.jpg` |

### M18 · Percorso: il prossimo livello
| | |
|---|---|
| **Cosa succede** | Il nodo da fare ha l'etichetta «START» che **ondeggia** su e giù di 8 px, 1 s, all'infinito. Sul sentiero ci sono personaggi e un forziere come tappe. |
| **Legame** | Il prossimo passo è l'unica cosa che si muove. |
| **Provini** | `W17_percorso_nodo_start.jpg` |

### M19 · Onboarding: il personaggio fa da regista
| | |
|---|---|
| **Evento** | Prime schermate, prima della lezione. |
| **Parla** | Fumetto che entra con scala 0 → 1 in 300 ms (**7 f**); il vecchio sparisce in 300 ms. Il testo si scrive a macchina (~11 ms a lettera). **Il pulsante resta spento finché Duo non ha finito di scrivere** (~0,9 s dal clic). |
| **Inquadratura** | **Grande al centro** quando parla da solo; **piccolo nell'angolo in alto a sinistra** quando sullo schermo servono le risposte. Il cambio avviene con lo scorrimento della schermata: esce a sinistra di 200 px e entra da destra di 200 px, con dissolvenza, 400 ms ease-in-out (**10 f**). |
| **Oggetti di scena** | Cambia oggetto secondo il momento: cartellina e matita per le domande, cannone di coriandoli per «Let's get this party started!», calendario in fiamme per l'obiettivo. Il cannone: **f3-f7 si accuccia (anticipo 5 f), f8 scoppio**, f9-f14 coriandoli ad arco, f15-f22 cadono e svaniscono. |
| **Reazione alle scelte** | Ogni scelta ha la sua risposta nel fumetto **entro 30 ms**: «We'll help you build confidence with math!», «You'll be 2x more likely to complete the course!». |
| **Provini** | `W01_onboarding_duo_coriandoli.jpg`, `W02_onboarding_duo_al_centro.jpg`, `W03_onboarding_duo_nell_angolo.jpg`, `W14_obiettivo_serie_duo_commenta.jpg` |

### M20 · Attese: apertura e caricamento
| | |
|---|---|
| **Apertura app** | L'icona si ingrandisce fino a riempire lo schermo: la faccia di Duo dell'icona **diventa** la schermata verde. Gli occhi guardano lenti a destra e a sinistra per ~8 s, poi **due battiti di ciglia a 21 f l'uno dall'altro**, poi gli occhi si ingrandiscono ed entri nell'app. |
| **Caricamento lezione** | Duo che fischietta con una nota musicale + «LOADING…» + una curiosità. |
| **Legame** | L'attesa è riempita dal personaggio, che non sta mai del tutto fermo. |
| **Provini** | `A21_apertura_app_occhi.jpg`, `W18_caricamento_duo.jpg` |

### M21 · Cambi di schermata e di domanda
| | |
|---|---|
| **Domanda → domanda** | La fascia sparisce subito; la domanda vecchia e la nuova si incrociano (dissolvenza + spostamento) in 400 ms ease-out (**10 f**). |
| **Passi in sequenza** | Scorrimento orizzontale di 200 px + dissolvenza, 400 ms ease-in-out (**10 f**). |
| **Premi** | **Taglio netto**, a volte preceduto da 8 f di buio (app). Tra le schermate della fine lezione, scorrimento in blocco a sinistra. |
| **Indicare un elemento** | Velo scuro + **riflettore** sull'elemento (i cuori). |

---

## Regole che si ripetono (la grammatica)

### Tempi tipici
| Cosa | ms | **f a 24 fps** | Easing |
|---|---|---|---|
| Risposta del gioco dopo il tocco (fascia, suono, stato del personaggio) | 10-60 | **0-1** | taglio, nessuna transizione |
| Tocco su un tasto: riempimento + boing | 150 + 180 | **4 + 4** | ease-in, poi ease-out con rimbalzo |
| Fumetto che entra / esce | 300 | **7** | ease |
| Boing di conquista (0,7 → 1,1 → 0,9 → 1) | 400 | **10** | ease-in-out a tre tempi |
| Cambio di domanda / di passo | 400 | **10** | ease-out / ease-in-out |
| Sgonfio di una perdita (1 → 0,6 → 1) | 500 | **12** | ease |
| Errore in una coppia: rosso, doppio tremolio, ritorno | 600 + 300 | **14 + 7** | ease-out |
| Anticipo di una reazione | 0-170 | **0-4** | — |
| Anticipo di una festa | 330-750 | **8-18** | — |
| Carica di un traguardo | 1.600-4.000 | **40-100** | lenta, crescente |
| Svolta (la posa nuova) | — | **1** | scatto |
| Tenuta dopo la svolta | 1.300-3.000 | **30-70** | con piccolo movimento secondario |
| Battiti di ciglia in attesa (a coppie) | ~900 tra i due | **21 tra i due** | — |
| Elementi in cascata (fine lezione app) | 800-1.200 l'uno dall'altro | **20-30** | ognuno col suo pop |

### Le regole
1. **Prima la risposta, poi lo spettacolo.** Il gioco reagisce nel fotogramma del tocco (fascia, suono, colore,
   cambio di stato del personaggio). L'eventuale anticipo del personaggio è *dentro* la reazione, mai un ritardo
   prima della reazione.
2. **Pose a scatto, tenute lunghe.** La posa importante arriva in **un fotogramma**: la presa dell'orso (f5), la
   mano del signore (f9), il lampo del traguardo (f102). Poi resta **1,5-3 s** con poco movimento: ciglia, bocca,
   un piccolo ondeggiare. È il «massimo effetto con il minimo dei fotogrammi» che citano loro.
3. **L'anticipo misura l'importanza.** Reazione a una risposta: 0-4 f. Fine lezione: 8-18 f di accucciata.
   Forziere: 11 f chiuso. Traguardo: ~4 s di carica. Più è grande il premio, più è lunga l'attesa che lo precede.
4. **La battuta di ciglia copre il cambio.** Girate di testa e ritorni passano per gli occhi chiusi (signore,
   f3-f7 e f65-f70); in attesa ci sono sguardi lenti e ogni tanto due battiti ravvicinati; lo sguardo che si
   sposta indica dove guardare.
5. **Una cosa alla volta.** Titolo → personaggi → XP → bonus → precisione → pulsante, a 0,8-1,2 s l'uno
   dall'altro, ognuno col suo «pop». Il personaggio tiene la scena: il pulsante resta spento finché non ha finito
   di parlare (onboarding) o finché la cascata non è finita (fine lezione app).
6. **Vincere rimbalza, perdere si sgonfia.** Le vincite superano la misura e tornano (1,1 → 0,9 → 1); le perdite
   rimpiccioliscono (0,6); l'errore in una coppia trema e si smorza. Mai scosse violente.
7. **La festa è proporzionata.** Scritta da 2 di fila, oro da 6, intermezzo a 5. Titolo e gag della fine lezione
   cambiano con precisione e velocità. Traguardi con trasformazione e colore pieno. La **sconfitta è quieta**:
   cuori finiti = immagine quasi ferma e una via d'uscita subito.
8. **Chi sbaglia riceve la risposta, non una predica.** Fascia con la soluzione; il personaggio la **dice ad alta
   voce**; gli errori tornano alla fine.
9. **Il suono conta la serie.** Coppie giuste = una nota più alta ciascuna. La risposta giusta normale ha sempre
   lo stesso ding. La musica di festa parte con l'anticipo, così il salto cade sul tempo.
10. **Il personaggio entra dai bordi e cambia taglio.** Grande al centro per parlare, piccolo nell'angolo per
    assistere, spunta dal bordo per incoraggiare, sparisce quando serve concentrazione (Matematica). Il palco si
    svuota prima di un traguardo; lo sfondo cambia colore nel momento della svolta.

### Quante pose
- Personaggio nelle domande: **fermo + giusta + sbagliata** (più le bocche, a parte). Ogni reazione è una
  manciata di pose chiave: anticipo (1-2), svolta (1), tenuta (1 con secondario), ritorno (1-2).
- Fine lezione: 3-5 «colpi» (anticipo, salto, 1-2 gag, atterraggio) e un loop di tenuta.
- In attesa: sguardi + battiti di ciglia + piccoli rimbalzi; nessuna posa importante.

### Quando entra ed esce il personaggio
- **C'è** quando parla, reagisce o festeggia; **non c'è** dentro le domande di Matematica (concentrazione).
- **Entra**: già in scena al taglio (fine lezione), dal bordo del quadro (combo), dall'icona (apertura).
- **Esce**: con la schermata (scorre via insieme a lei), mai con un'uscita sua da fermare.

---

## Traduzione per Matemagica

### Il filtro anni '50 a scatti
Lo stile scelto (S5, «Paperino nel mondo della Matemagica») è animazione **limitata**, come quella UPA: poche
pose, tenute lunghe, campi di colore piatto che cambiano con l'emozione, iridi che si chiudono, fotogrammi
strisciati, didascalie. **La grammatica di Duolingo ci sta dentro quasi da sola.** Le loro svolte in un
fotogramma diventano i nostri disegni chiave, le tenute diventano pose ferme con un dettaglio che si muove
(coda, ciglia), il cambio di colore del traguardo è esattamente un «color field» anni '50. La differenza: dove
Duolingo interpola fluido a 60 fps, il gatto **cambia disegno a passo 2 (12 disegni/s) o 3 (8 disegni/s)**,
mentre camera, scritte e pulsanti si muovono fluidi dal codice. Questo contrasto *è* il look.

**Da non copiare** (sono loro): coriandoli col cannone, l'anima che esce dal corpo, il carro della parata, la
fenice, le ali che battono, il fischiettare, le spallucce a palmi in su identiche, il cuore stretto in mano, la
fascia verde/rossa con le stesse parole. Prendiamo tempi e struttura, inventiamo le gag.

### Evento del motore → momento Duolingo → idea per il gatto

Eventi confermati nel codice (`src/engine/`, `src/ui/`, `src/App.tsx`). «d» = disegni a passo 2.

| Evento in Matemagica | Dove nasce | Momento Duolingo più vicino | Prima idea per il gatto nero (anni '50, a scatti) | Durata (f a 24) | Camera / schermata (dal codice) | Suono |
|---|---|---|---|---|---|---|
| **Risposta giusta** | `ArcadeShell` → `premia()`, `PuzzleShell` → `onTry` risolto | M1, M3 | Nel fotogramma del tocco: **cenno secco** con la testa e la coda che si drizza a punto esclamativo (2 d), tenuta, ritorno. Variante ogni tanto: strizza un occhio. | svolta f0, tenuta 12-16 f, ritorno 4 f | nessuna: è il campo di gioco che conta | `giusto` già sale con la combo: bene così |
| **Risposta sbagliata** | `punisci()` (vita, combo a 0, scossa), `onTry` errore | M2, M4 | La «presa»: 2 f di occhi a fessura, **scatto** a occhi enormi e baffi dritti (1 d), tenuta; poi indica la risposta giusta con la zampa. Variante bonaria: si gratta un orecchio. | anticipo 2-4 f, tenuta 24-36 f | la `SCOSSA` orizzontale di 400 ms del campo è più punitiva di Duolingo: proposta, tremolio di scala smorzato solo sull'elemento sbagliato (regola 6) | `sbagliato` corto e basso |
| **Timeout** (tempo scaduto) | `risposta(null)` | M2 | Il gatto sbadiglia o guarda un orologio da taschino: nessuna colpa, è il tempo. | 16-24 f | come la sbagliata | uguale |
| **Combo** (sale il moltiplicatore) | `annuncioCombo` + `suona('combo')` | M6, M7 | Prima soglia: scritta sopra il campo. Soglia alta: il gatto **spunta dal bordo del quadro** (prima le orecchie, poi gli occhi) con una battuta di una riga, e se ne va. Soglia massima: il colore d'accento passa all'oro (`oro-*`). | entra 6-8 f, tenuta 24 f, esce 6 f | il gatto entra dal bordo; il campo non si ferma (in arcade il tempo corre) | `combo` |
| **Vite finite** | `vite <= 0` → `chiudi()` | M8, M9 | Momento **quieto**: un'iride anni '50 si chiude sul contatore delle vite e su un gatto piccolo, seduto di spalle, che si gira e alza le spalle. Poi «Riprova» subito. | iride 10 f, tenuta 24-48 f | iride (riflettore) dal codice | niente fanfara: una nota sola |
| **Una vita persa** | `st.vite--` | M8 | L'icona della vita **si sgonfia** (1 → 0,6 → 1). La prima volta in assoluto: iride sul contatore e una riga del gatto che spiega la regola. | 12 f | iride solo la prima volta | — |
| **Fine partita 1★ / 2★ / 3★** | `Risultato` (stelle a 350 + i·380 ms) | M11, M12, M13 | Vedi sotto: **il primo momento da produrre**. | 1★ ~1,5 s · 2★ ~2 s · 3★ ~3 s | taglio + 8 f di pausa; 3★ con cambio di colore pieno dello sfondo | `fine` sotto l'anticipo, `stella` sui colpi |
| **Nuovo record** | `nuovoRecord` | M12 (etichette guadagnate) | Etichetta «Nuovo record!» che salta fuori da sola, **dopo** il punteggio, con il gatto che si gira a guardarla (lo sguardo dirige). | 8 f | — | un «ding» in più |
| **XP** | `riepilogo.xpGuadagnati` | M11 (cifre a rullo) | Il numero **rotola** come un contachilometri; nessun gesto del gatto (non tutto è suo). | 7-12 f | — | tic delle cifre |
| **Livello giocatore su** | `livelloDopo > livelloPrima` | M17 | Taglio sul nuovo grado (`GRADI`), già a piena misura, attraversato da un **riflesso**; il gatto si toglie il cappello. | fermo 8 f, riflesso 12 f | taglio netto | `livello` |
| **Serie di giorni** | `riepilogo.streak > 1` | M14, M15 | Il numero di ieri **grigio e fermo**, poi rotola a quello di oggi e prende colore. Il gatto **accende un fiammifero** (anticipo: lo sfrega 2-3 volte) e la fiammella nasce con squash e stretch. Ai traguardi (7, 30, 100) il palco si svuota, carica lunga e **cambio di colore di tutto lo sfondo**: il gatto in un costume da festa. | 1 giorno ~1,5 s; traguardo 3-4 s | sfondo a campo pieno al traguardo | crescendo + colpo |
| **Livello sbloccato sul sentiero** | `livelloAperto()` (≥1★ al precedente) | M18 | Il gatto **cammina a scatti** fino al sasso nuovo e si siede accanto; il sasso ondeggia piano (8 px, 1 s) finché non lo tocchi. | camminata 12-24 f, poi loop | la camera segue il gatto e si ferma sul sasso | passi |
| **Gioco nuovo in Palestra** | `giocoSbloccato()` | M16 (premio dopo il gesto) | Nella Palestra la carta del gioco arriva per ultima, con un piccolo boing. | 10 f | — | — |
| **Storia sbloccata / carta nuova** | `StoriaSchermo nuova` (`animate-carta`) | M16, M17 | Il gatto porta la carta coperta, la tocca due volte con la zampa (anticipo, come il forziere che trema), **la gira di scatto** e un riflesso la attraversa. | anticipo 10-12 f, giro 1-2 d, riflesso 12 f | taglio sulla carta | `livello` |
| **Debutto di un gioco** | `SpiegazioneSchermo` | M19 | Il gatto **grande al centro** con l'oggetto di scena del gioco (la bilancia per «La Bilancia», la lente per «Trova la regola»…). Testo a macchina da scrivere; «Ho capito, si gioca!» acceso **solo quando ha finito**. Quando parte il gioco **si rimpicciolisce in un angolo** o esce. | fumetto 7 f, cambio di taglio 10 f | da primo piano a campo lungo | battitura leggera |
| **Pronto** (prima della partita) | `Pronto` | M20 | Attesa viva: sguardi lenti a destra e a sinistra, ogni tanto due battiti di ciglia ravvicinati (21 f), la coda che si muove. | loop | — | — |
| **Aiuto** (rompicapo) | `PuzzleShell` → `aiuto()` | Lily che «pensa» | Il gatto si liscia i baffi pensieroso (2-3 d) e **fa scivolare** un biglietto con l'aiuto. Un aiuto costa: niente festa. | 8-12 f | — | carta che scivola |
| **Soluzione, momento «aha»** | `salta()` → «La soluzione», o risolto pulito «Perfetto!» | M4 (dice la risposta), M13 | Pulito: **scatto** a occhi spalancati e coda a punto esclamativo, sfondo che lampeggia del colore d'accento per 1-2 f. Saltato: il gatto spiega la soluzione passo per passo, con calma (è il momento di insegnare). | anticipo 4 f, svolta 1 d, tenuta 24 f | lampo di 1-2 f | nota alta |
| **Coppie magiche** | `onHit` / `onMiss` parziali | **M5** | Coppia giusta: verde + scintille + **una nota più alta ogni coppia di fila**, poi la coppia si spegne dopo 8 f. Sbagliata: tremolio smorzato in 14 f e ritorno in 7. Il gatto guarda soltanto. | come Duolingo | — | scala che sale (5 note) |

### Il primo momento da produrre: fine partita 1★ / 2★ / 3★

Agganciato ai tempi che `Risultato.tsx` usa già: le stelle entrano a **350 + i·380 ms** →
★1 a **f18**, ★2 a **f27**, ★3 a **f36** (una ogni ~9 f, cioè 3 disegni a passo 3). Il suono `livello` per il
livello su arriva dopo l'ultima stella.

| Fotogrammi | 1★ «Bene! Si sta scaldando.» | 2★ «Partita completa!» | 3★ «Perfetta. Da mago.» |
|---|---|---|---|
| **f0-f7** | Taglio sul palco con **8 f di pausa** (scuro o vuoto). | uguale | uguale |
| **f8-f17** (anticipo) | Gatto seduto che guarda in su le tre caselle vuote (1 d, coda che si muove). | Si accuccia appena (2 d). | **Accucciata lunga**: orecchie basse, coda arricciata, tremolio (4-5 d a passo 2): è l'anticipo da festa. |
| **f18** ★1 | Cenno con la testa nel fotogramma della stella. | Orecchie dritte di scatto. | Orecchie dritte di scatto. |
| **f27** ★2 | — | **Salto** (svolta in 1 d), atterraggio a f33 in posa. | Occhi enormi, si solleva sulle punte. |
| **f36** ★3 | — | — | **Il colpo**: salto con il trucco da mago (gag nostra da inventare), **sfondo che diventa un campo di colore pieno** nello stesso fotogramma, titolo che entra **lettera per lettera** (4-5 f). |
| **tenuta** | Alza le spalle con simpatia e indica «Rigioca». Loop di sguardi. | Posa a coda alta, loop. | Tableau tenuto, loop con un luccichio ogni ~1 s. |
| **cascata** | Punteggio che rotola → dati → XP, ognuno ~20 f dopo il precedente. | uguale | + «Nuovo record!» se c'è, per ultimo |

Proposte collegate:
- **0★** («La prossima parte più facile. Riprova!», anche dopo le vite finite): niente festa, la scena quieta
  delle vite finite e il gatto che indica «Rigioca».
- **Pulsante «Continua» attivo subito, ma un tocco completa la cascata** invece di saltarla: le partite sono
  corte e si rigiocano spesso, non possiamo tenere il giocatore 5,5 s come l'app di Duolingo.
- La musica `fine` parte **col taglio** (sotto l'anticipo), e i colpi delle stelle cadono sui suoi tempi.
- Rompicapo: stessa scena, ma con 3★ = «tutti, senza aiuti, ≤1 sbaglio»: è il «Perfect lesson» nostro e
  merita la gag più grande.

### Dizionario minimo di pose per il rig (After Effects → sprite)
Ogni stato è una composizione di AE renderizzata a 12 o 8 disegni al secondo. Il codice scambia lo stato quando
arriva l'evento, come fa Duolingo accendendo e spegnendo le animazioni. Bocca e occhi sono un livello a parte,
così il gatto può «parlare» sopra qualsiasi posa (i due sistemi di Duolingo).

| Stato | Disegni a passo 2 | Loop? |
|---|---|---|
| fermo (sguardi, ciglia, coda) | 6-8 | sì |
| giusta (cenno) · giusta 2 (occhiolino) | 4 + 4 | no |
| sbagliata (presa) · sbagliata 2 (orecchio) | 6 + 6 | no |
| spunta dal bordo (combo) | 4 entrata + 4 uscita | no |
| fine 1★ / 2★ / 3★ | 6 / 10 / 16 | coda in loop |
| vite finite (di spalle, si gira) | 6 | no |
| primo piano che parla (debutto) | 4 + bocche | sì |
| cammina (sentiero) | 6 | sì |
| porta e gira la carta | 8 | no |
| fiammifero (serie) | 8 | no |

---

## Cosa manca

- **Registrazione di Jack dal suo telefono** (lezione, fine lezione, serie): darebbe vibrazione, sincronia vera
  del suono e 60 fps puliti. I video YouTube sono di altri, compressi, a volte vecchi (2021-2025).
- Non visti: **promozione di lega con personaggi**, **fine unità**, **livello leggendario**, **DuoRadio**,
  ricarica dei cuori nell'app, scrigni delle leghe.
- L'**entrata** dell'intermezzo a 5 di fila sul web l'ho misurata nei tempi ma non catturata a fotogrammi (ho
  preso solo la tenuta); nell'app non l'ho trovata.
- La fine lezione di Spagnolo non l'ho raggiunta: ho finito i cuori apposta per vedere M9.
- Gli attacchi dell'audio nei video dell'app non sono misurati: i tempi del suono vengono solo dal web.

---

## Indice dei provini (sul Mac, in `_handoff/duolingo/provini/`)

**Web (misurati nella pagina, fotogrammi a 24 fps):**
`W01` coriandoli dell'onboarding · `W02`/`W03` Duo al centro e nell'angolo · `W04`/`W05` fasce giusta e
sbagliata · `W06`/`W07` combo 2 di fila e oro a 6 · `W08` errori che tornano · `W09`-`W12` fine lezione
(schermo + provini 0-1,5 / 1,5-3 / 3-12 s) · `W13` serie · `W14` Duo commenta l'obiettivo · `W15` missione ·
`W16` forziere · `W17` percorso · `W18` caricamento · `W19` primo cuore e riflettore · `W20`/`W21` coppie ·
`W22` combo a 5, Duo dal bordo · `W23`-`W25` orso, sbagliata · `W26`/`W27` signore, giusta · `W28` signore,
sbagliata · `W29` cuori finiti.

**App (video YouTube ricampionati a 24 fps):**
`A01` indice delle 9 fine lezione · `A02`-`A10` fine lezione 1-9, primi 3 s · `A11` cascata delle schede ·
`A12` «Seriously???» · `A13` «When's the parade?» · `A14` «Perfect lesson!» · `A15` serie 99 → 100 · `A16`
traguardo 100 · `A17` cuori finiti · `A18` promozione di lega · `A19` torneo · `A20` combo con dialogo (web
2022) · `A21` apertura app · `A22` fotogrammi del talk Duocon (stati, bocche, macchina a stati).

Video sorgente (in `_handoff/duolingo/video/`, non nel repo): «Every Duolingo Animation (After Lesson)» (Alexia
S. Hyena), «New animation on Duolingo: Characters speaking» (Sparky [GD]), «FASTEST DUOLINGO LESSON»
(ShibaPlayz), «What does Duolingo do on 100 day streak?» (OakWolf), «Me casually losing all my hearts»
(SpeedStacking Human), «Reaching the DIAMOND TOURNAMENT» (Master Awesome), «How we animate the Duolingo world»
(Duolingo, Duocon 2023), «Duolingo – screen recording» (Betsy Rodriguez), «STREAK SOCIETY» (ThisisJokyl989).
