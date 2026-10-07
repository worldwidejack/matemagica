import { useCallback, useEffect, useState } from 'react';
import { setMutoAudio, suona } from '@/audio/sfx';
import type { FinePartita } from '@/engine/ArcadeShell';
import type { GameId } from '@/engine/cartuccia';
import { GIOCHI, type VoceGioco } from '@/games/registro';
import { giornoLocale, livelloDa, streakViva } from '@/profilo/progressione';
import { useProfilo } from '@/profilo/store';

/**
 * B1: una home con il profilo e i giochi. Il sentiero arriva in B2 e prende il
 * posto della lista; la navigazione resta a stato (niente router finché non serve).
 */
export default function App() {
  const [inGioco, setInGioco] = useState<GameId | null>(null);
  const muto = useProfilo((p) => p.muto);

  useEffect(() => setMutoAudio(muto), [muto]);

  const voce = GIOCHI.find((g) => g.id === inGioco);
  if (voce?.Play) return <Partita voce={voce} onEsci={() => setInGioco(null)} />;
  return <Home onGioca={setInGioco} />;
}

function Partita({ voce, onEsci }: { voce: VoceGioco; onEsci: () => void }) {
  const bravura = useProfilo((p) => p.bravura[voce.id] ?? 0);
  const record = useProfilo((p) => p.record[voce.id] ?? 0);
  const registra = useProfilo((p) => p.registraPartita);
  const onFine = useCallback(
    (f: FinePartita) =>
      registra({ gioco: voce.id, punteggio: f.esito.punteggio, stelle: f.stelle, bravuraDopo: f.bravuraDopo }),
    [registra, voce.id],
  );
  const Play = voce.Play;
  if (!Play) return null;
  return <Play bravura={bravura} record={record} onFine={onFine} onEsci={onEsci} />;
}

function Home({ onGioca }: { onGioca: (id: GameId) => void }) {
  const { xp, streak, muto, setMuto, stelleMigliori, bravura } = useProfilo();
  const liv = livelloDa(xp);
  const fiamma = streakViva(streak, giornoLocale(new Date()));

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pt-4 pb-10">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-turchese-500/20 text-xl font-black text-turchese-300">
          {liv.livello}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{liv.grado}</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-notte-600">
            <div
              className="h-full rounded-full bg-turchese-400 transition-[width] duration-700"
              style={{ width: `${(liv.xpNelLivello / liv.xpPerIlProssimo) * 100}%` }}
            />
          </div>
        </div>
        <div className={`text-lg font-bold ${fiamma > 0 ? 'text-oro-400' : 'text-white/30'}`} aria-label="Giorni di fila">
          🔥 {fiamma}
        </div>
        <button
          onClick={() => setMuto(!muto)}
          className="text-2xl"
          aria-label={muto ? 'Attiva i suoni' : 'Togli i suoni'}
        >
          {muto ? '🔇' : '🔊'}
        </button>
      </header>

      <h1 className="font-display mt-10 text-center text-5xl font-black tracking-tight">
        Mate<span className="text-oro-400">magica</span>
      </h1>
      <p className="mt-2 text-center text-white/60">Allena la mente, un gioco alla volta.</p>

      <ul className="mt-10 flex flex-col gap-3">
        {GIOCHI.map((g) => {
          const pronto = Boolean(g.Play);
          const s = stelleMigliori[g.id] ?? 0;
          return (
            <li key={g.id}>
              <button
                disabled={!pronto}
                onClick={() => {
                  suona('tap');
                  onGioca(g.id);
                }}
                className={[
                  'flex w-full items-center gap-4 rounded-3xl px-5 py-4 text-left transition-transform',
                  pronto
                    ? 'border-2 border-oro-500/60 bg-notte-700 shadow-[0_0_24px_rgb(245_183_49/0.25)] active:scale-95'
                    : 'bg-notte-800 text-white/35',
                ].join(' ')}
              >
                <span className="text-3xl">{pronto ? (g.tipo === 'arcade' ? '⚡' : '🧩') : '🔒'}</span>
                <span className="flex-1">
                  <span className="block text-lg font-bold">{g.titolo}</span>
                  <span className="text-sm text-white/50">
                    {pronto
                      ? `${g.tipo === 'arcade' ? 'Arcade' : 'Rompicapo'} · bravura ${(bravura[g.id] ?? 0).toFixed(1)}`
                      : 'In arrivo'}
                  </span>
                </span>
                {pronto && (
                  <span className="text-xl tracking-tighter">
                    {[1, 2, 3].map((i) => (
                      <span key={i} className={i <= s ? 'text-oro-400' : 'text-white/15'}>
                        ★
                      </span>
                    ))}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
