import { useState } from 'react';
import { SENTIERO } from '@/content/sentiero';
import { useProfilo } from '@/profilo/store';

/**
 * Attrezzi da test (Jack, 14/11): solo con `?dev` nel link, poi il telefono se lo ricorda
 * (`?dev=0` lo spegne). «Da capo» cancella il profilo e riparte da «Perché sei qui?»;
 * «Salta» dà 3 stelle al primo livello ancora da fare e torna al sentiero.
 */
const CHIAVE = 'matemagica-attrezzi';

function attivi(): boolean {
  try {
    const q = new URLSearchParams(location.search).get('dev');
    if (q !== null) localStorage.setItem(CHIAVE, q === '0' ? '0' : '1');
    return localStorage.getItem(CHIAVE) === '1';
  } catch {
    return new URLSearchParams(location.search).has('dev');
  }
}

/** Ricarica la pagina senza `?dev=…` né altri parametri di prova: si riparte dal sentiero. */
function ricarica() {
  location.replace(location.pathname);
}

export function Attrezzi() {
  const [acceso] = useState(attivi);
  const [aperto, setAperto] = useState(false);
  if (!acceso) return null;

  const daCapo = () => {
    useProfilo.getState().azzera();
    ricarica();
  };
  const salta = () => {
    const st = useProfilo.getState();
    const prossimo = SENTIERO.find((l) => (st.stelleLivelli[l.id] ?? 0) === 0);
    if (prossimo) useProfilo.setState({ stelleLivelli: { ...st.stelleLivelli, [prossimo.id]: 3 }, benvenuto: { ...st.benvenuto, fatto: true } });
    ricarica();
  };

  return (
    <div className="fixed top-1/2 left-0 z-[100] flex -translate-y-1/2 flex-col items-start gap-1.5">
      <button
        onClick={() => setAperto((a) => !a)}
        aria-label="Attrezzi da test"
        className="rounded-r-xl bg-inchiostro/70 px-1.5 py-2 text-base leading-none text-panna-50"
      >
        🛠
      </button>
      {aperto && (
        <div className="ml-1 flex flex-col gap-1.5 rounded-xl bg-inchiostro/90 p-2 text-sm font-bold text-panna-50">
          <button onClick={daCapo} className="rounded-lg bg-panna-100 px-3 py-2 text-left text-inchiostro">
            ↺ Da capo
          </button>
          <button onClick={salta} className="rounded-lg bg-oro-400 px-3 py-2 text-left text-inchiostro">
            ⏭ Salta livello
          </button>
        </div>
      )}
    </div>
  );
}
