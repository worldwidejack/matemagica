import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { StratoScoppi } from './anim/scoppi.tsx';
import { Prove } from './dev/Prove.tsx';
import { useProfilo } from './profilo/store';

const root = document.getElementById('root');
// Solo in sviluppo: ?prova=risultato apre le schermate di prova (src/dev).
const prova = import.meta.env.DEV ? new URLSearchParams(location.search).get('prova') : null;
// ?cammino=L4 (per provare la sequenza del paese): segna fatti i livelli fino al 4 e rivede fiore, gatto e nebbia.
const cammino = new URLSearchParams(location.search).get('cammino');
const nLiv = Number(cammino?.replace(/\D/g, ''));
if (cammino && nLiv > 0) {
  const st = useProfilo.getState();
  const stelleLivelli = { ...st.stelleLivelli };
  for (let k = 1; k <= nLiv; k++) stelleLivelli[`L${k}`] = stelleLivelli[`L${k}`] || 2;
  useProfilo.setState({ stelleLivelli, benvenuto: { ...st.benvenuto, fatto: true } });
}
if (!root) throw new Error('#root non trovato');

createRoot(root).render(
  <StrictMode>
    {import.meta.env.DEV && prova ? (
      <Prove quale={prova} />
    ) : (
      <>
        <App />
        {/* Gli scoppi (es. la stella sul monumento) vivono sopra tutte le schermate: uno strato solo. */}
        <StratoScoppi />
      </>
    )}
  </StrictMode>,
);

// L'altezza vera di una schermata: lo schermo meno i margini della tacca, letti dal body.
// All'avvio del guscio iOS le unità CSS arrivano a volte prima dei margini: si rimisura.
function misuraAlto() {
  const stile = getComputedStyle(document.body);
  const alto = window.innerHeight - parseFloat(stile.paddingTop) - parseFloat(stile.paddingBottom);
  if (alto > 0) document.documentElement.style.setProperty('--alto', `${alto}px`);
}
misuraAlto();
window.addEventListener('resize', misuraAlto);
window.visualViewport?.addEventListener('resize', misuraAlto);
for (const ms of [100, 400, 1200]) setTimeout(misuraAlto, ms);

// Funziona anche offline, una volta installato (solo in produzione: in sviluppo darebbe fastidio).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
