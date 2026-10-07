import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('#root non trovato');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Funziona anche offline, una volta installato (solo in produzione: in sviluppo darebbe fastidio).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
