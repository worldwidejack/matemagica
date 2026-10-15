import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { suona } from '@/audio/sfx';
import { FOGLI, type NomeFoglio } from '@/anim/manifest';
import { pesoFogli, precaricaFogli } from '@/anim/precarica';
import { Scatto } from '@/anim/Scatto';
import { StratoScoppi, scoppia } from '@/anim/scoppi';
import { FiltriTremolio } from '@/anim/Tremolio';
import { SCOSSA } from '@/engine/partita';

/**
 * Pagina di prova del motore delle animazioni a scatti (/prova.html): non fa parte del
 * gioco. Serve a vederle dal telefono prima di metterle nell'app. I disegni sono di prova.
 */

const NOMI = Object.keys(FOGLI) as NomeFoglio[];

export function Prova() {
  const [pronti, setPronti] = useState(false);

  useEffect(() => {
    const inizio = performance.now();
    void precaricaFogli().then(() => {
      setPronti(true);
      console.info(`fogli pronti in ${Math.round(performance.now() - inizio)} ms`);
    });
  }, []);

  return (
    <div className="mx-auto min-h-full max-w-md px-4 pt-6 pb-16">
      <FiltriTremolio />
      <StratoScoppi tocco="tocco" />

      <h1 className="text-2xl font-black">Animazioni a scatti</h1>
      <p className="mt-1 text-sm text-white/60">
        Prova del motore: 12 disegni al secondo, come un cartone. I disegni sono di prova (ChatGPT), non quelli
        finali. Ogni bottone, quando lo tocchi, fa partire il «tocco».
      </p>
      <p className="mt-2 text-xs text-white/40">
        {pronti ? `${NOMI.length} animazioni pronte · ${pesoFogli().toFixed(0)} KB in tutto` : 'Carico le animazioni…'}
      </p>

      <Sezione titolo="Nel gioco" nota="Tocca quella che vale di più.">
        <DemoPartita />
      </Sezione>

      <Sezione titolo="Tocca dove vuoi" nota="Il tocco parte sotto il dito.">
        <div
          data-scoppio
          className="flex h-40 items-center justify-center rounded-3xl border-2 border-dashed border-white/20 text-white/40"
        >
          tocca qui, anche a raffica
        </div>
      </Sezione>

      <Sezione titolo="Le animazioni" nota="Tocca per rivederla.">
        <Catalogo />
      </Sezione>

      <Sezione titolo="Il tremolio" nota="I contorni che vibrano come disegnati a mano.">
        <DemoTremolio />
      </Sezione>

      <a href="/" className="mt-10 block text-center text-sm text-turchese-300 underline">
        Torna al gioco
      </a>
    </div>
  );
}

function Sezione({ titolo, nota, children }: { titolo: string; nota: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-oro-400">{titolo}</h2>
      <p className="mb-3 text-sm text-white/50">{nota}</p>
      {children}
    </section>
  );
}

/** Quesito finto come in «Chi è più grande?»: sulla giusta scoppia la stella. */
function DemoPartita() {
  const [q, setQ] = useState(() => nuovoQuesito());
  const [sbagliata, setSbagliata] = useState<number | null>(null);
  const [giuste, setGiuste] = useState(0);

  const rispondi = (i: number, e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (q.valori[i] === Math.max(...q.valori)) {
      scoppia('giusto', r.left + r.width / 2, r.top + r.height / 2, 260);
      suona('giusto');
      setGiuste((g) => g + 1);
      setSbagliata(null);
      setTimeout(() => setQ(nuovoQuesito()), 450);
    } else {
      suona('sbagliato');
      e.currentTarget.animate(SCOSSA, { duration: 400, easing: 'ease-in-out' });
      setSbagliata(i);
      setTimeout(() => setSbagliata(null), 400);
    }
  };

  return (
    <div className="rounded-3xl bg-notte-700 p-4">
      <div className="mb-3 flex justify-between text-sm text-white/60">
        <span>Quale è più grande?</span>
        <span className="font-bold text-oro-400">{giuste} giuste</span>
      </div>
      <div className="flex flex-col gap-3">
        {q.testi.map((t, i) => (
          <button
            key={`${q.id}-${i}`}
            onClick={(e) => rispondi(i, e)}
            className={`rounded-2xl bg-notte-600 py-7 text-4xl font-black transition-transform active:scale-95 ${sbagliata === i ? 'bg-pericolo-400/30' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

let idQuesito = 0;
function nuovoQuesito() {
  const coppia = () => {
    const a = 2 + Math.floor(Math.random() * 9);
    const b = 2 + Math.floor(Math.random() * 9);
    return { testo: `${a} + ${b}`, valore: a + b };
  };
  let x = coppia();
  let y = coppia();
  while (x.valore === y.valore) y = coppia();
  return { id: idQuesito++, testi: [x.testo, y.testo], valori: [x.valore, y.valore] };
}

function Catalogo() {
  const [giri, setGiri] = useState<Record<string, number>>({});
  const [lento, setLento] = useState(false);

  return (
    <>
      <label className="mb-3 flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" checked={lento} onChange={(e) => setLento(e.target.checked)} className="h-5 w-5" />
        al rallentatore (3 disegni al secondo: si vede ogni disegno)
      </label>
      <div className="grid grid-cols-2 gap-3">
        {NOMI.map((n) => {
          const f = FOGLI[n];
          return (
            <button
              key={n}
              onClick={() => setGiri((g) => ({ ...g, [n]: (g[n] ?? 0) + 1 }))}
              className="flex flex-col items-center rounded-2xl bg-notte-700 p-3"
            >
              <div className="flex h-36 items-center justify-center">
                <Scatto nome={n} larghezza={130} giro={(giri[n] ?? 0) * 2 + (lento ? 1 : 0)} fps={lento ? 3 : undefined} />
              </div>
              <span className="mt-1 font-bold">{n}</span>
              <span className="text-xs text-white/50">
                {f.fotogrammi} disegni · {f.fps} al secondo{f.loop ? ' · in loop' : ''} · {f.kb} KB
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function DemoTremolio() {
  const [livello, setLivello] = useState<'spento' | 'tremolio' | 'tremolio-forte'>('tremolio');
  const classe = livello === 'spento' ? '' : livello;

  return (
    <div className="rounded-3xl bg-notte-700 p-4">
      <div className="mb-4 flex gap-2">
        {(['spento', 'tremolio', 'tremolio-forte'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLivello(l)}
            className={`flex-1 rounded-full py-2 text-sm font-bold ${livello === l ? 'bg-oro-400' : 'bg-notte-600'}`}
          >
            <span className={livello === l ? 'text-notte-900' : 'text-white/70'}>
              {l === 'spento' ? 'spento' : l === 'tremolio' ? 'leggero' : 'forte'}
            </span>
          </button>
        ))}
      </div>
      {/* Il tremolio va sul contorno (lo strato dietro), il testo resta nitido sopra. */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full py-6 text-center text-4xl font-black">
          <div className={`absolute inset-0 rounded-2xl border-[3px] border-oro-400 bg-notte-600 ${classe}`} />
          <span className="relative">7 + 5</span>
        </div>
        <button className="relative px-10 py-3 text-xl font-black">
          <span className={`absolute inset-0 rounded-full border-[3px] border-notte-900 bg-oro-400 ${classe}`} />
          <span className="relative text-notte-900">Continua →</span>
        </button>
        <div className={`flex gap-4 text-5xl ${classe}`}>
          <span>★</span>
          <span>◆</span>
          <span>●</span>
        </div>
      </div>
      {'stella-trema' in FOGLI && (
        <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
          <Scatto nome={'stella-trema' as NomeFoglio} larghezza={90} />
          <p className="text-sm text-white/60">
            Questo invece è un disegno fermo a cui lo script ha dato il tremolio: 3 disegni in loop, non costa calcolo.
          </p>
        </div>
      )}
    </div>
  );
}
