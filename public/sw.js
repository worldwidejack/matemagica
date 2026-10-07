/*
 * Service worker di Matemagica: il gioco si apre anche senza rete
 * (in fila alla posta il 4G va e viene).
 * - pagine: prima la rete (così arrivano gli aggiornamenti), se manca la cache;
 * - file statici (js, css, icone): prima la cache, poi la rete.
 * Per forzare un aggiornamento della cache basta cambiare VERSIONE.
 */
const VERSIONE = 'matemagica-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icona-192.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((chiavi) => Promise.all(chiavi.filter((k) => k !== VERSIONE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copia = r.clone();
          caches.open(VERSIONE).then((c) => c.put('/', copia));
          return r;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(
      (trovato) =>
        trovato ||
        fetch(req).then((r) => {
          if (r.ok) {
            const copia = r.clone();
            caches.open(VERSIONE).then((c) => c.put(req, copia));
          }
          return r;
        }),
    ),
  );
});
