import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { Prove } from './dev/Prove.tsx';

const root = document.getElementById('root');
// Solo in sviluppo: ?prova=risultato apre le schermate di prova (src/dev).
const prova = import.meta.env.DEV ? new URLSearchParams(location.search).get('prova') : null;
if (!root) throw new Error('#root non trovato');

createRoot(root).render(
  <StrictMode>
    {import.meta.env.DEV && prova ? <Prove quale={prova} /> : <App />}
  </StrictMode>,
);

// Funziona anche offline, una volta installato (solo in produzione: in sviluppo darebbe fastidio).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
