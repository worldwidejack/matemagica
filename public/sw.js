/*
 * Service worker di Matemagica: il gioco si apre anche senza rete
 * (in fila alla posta il 4G va e viene).
 * - pagine: prima la rete (così arrivano gli aggiornamenti), se manca la cache;
 * - tutto il resto (js, css, font, disegni delle isole e dei personaggi, icone):
 *   prima la cache, poi la rete.
 * All'installazione si mette da parte TUTTO quello che serve per aprire il gioco offline:
 * la pagina, i file con l'hash di questa versione (letti dalla pagina stessa: js, css,
 * font latini, fogli delle animazioni) e i disegni. Senza, al primo avvio o dopo un
 * aggiornamento (che cancella la cache vecchia) l'app offline si aprirebbe bianca.
 * Per forzare un aggiornamento della cache basta cambiare VERSIONE.
 */
const VERSIONE = 'matemagica-v3';

const FISSI = ['/', '/manifest.webmanifest', '/icona-192.png', '/favicon.svg'];

/** I disegni: se uno manca non blocca l'installazione, arriva dalla rete quando serve. */
const DISEGNI = [
  '/isole/isola-1.webp',
  '/isole/isola-2.webp',
  '/isole/isola-3.webp',
  '/isole/isola-4.webp',
  '/isole/nuvola-1.webp',
  '/isole/nuvola-2.webp',
  '/isole/nuvola-sx.webp',
  '/isole/nuvola-dx.webp',
  '/personaggi/mago.webp',
  '/personaggi/gatto.webp',
  ...['bersaglio', 'bilancia', 'catena', 'coppie', 'misto', 'piu-grande', 'quadrato', 'regola', 'stima'].map(
    (g) => `/giochi/${g}.webp`,
  ),
];

/** I file con l'hash di questa versione: quelli citati dalla pagina e, dentro js e css, quelli che citano loro. */
async function fileDellaVersione() {
  const html = await (await fetch('/', { cache: 'reload' })).text();
  const lista = new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]));
  for (const f of [...lista]) {
    if (!/\.(?:js|css)$/.test(f)) continue;
    const testo = await (await fetch(f)).text();
    for (const [trovato] of testo.matchAll(/\/assets\/[\w.-]+?\.(?:js|css|webp|woff2)/g)) {
      // Dei font bastano i latini: i testi sono in italiano.
      if (trovato.endsWith('.woff2') && !/-latin-(?:wght|full)-/.test(trovato)) continue;
      lista.add(trovato);
    }
  }
  return [...lista];
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(VERSIONE);
      await c.addAll([...FISSI, ...(await fileDellaVersione())]);
      await Promise.all(DISEGNI.map((d) => c.add(d).catch(() => undefined)));
    })(),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((chiavi) => Promise.all(chiavi.filter((k) => k !== VERSIONE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

/** Prima la cache, poi la rete (e quello che arriva si mette da parte). */
function primaLaCache(req) {
  return caches.match(req).then(
    (trovato) =>
      trovato ||
      fetch(req).then((r) => {
        if (r.ok) {
          const copia = r.clone();
          caches.open(VERSIONE).then((c) => c.put(req, copia));
        }
        return r;
      }),
  );
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const percorso = new URL(req.url).pathname;

  if (req.mode === 'navigate') {
    // ogni pagina nella sua casella: '/' è il gioco, '/prova.html' la prova delle animazioni
    const chiave = percorso.endsWith('.html') ? percorso : '/';
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copia = r.clone();
          caches.open(VERSIONE).then((c) => c.put(chiave, copia));
          return r;
        })
        .catch(() => caches.match(chiave)),
    );
    return;
  }

  e.respondWith(primaLaCache(req));
});
