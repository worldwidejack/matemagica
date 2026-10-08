import { useState } from 'react';
import { suona } from '@/audio/sfx';
import { nomeTappa } from '@/content/sentiero';
import { OBIETTIVI, avanzamento, completata, giornataVuota, missioniDel } from '@/profilo/giornata';
import { giornoLocale, livelloDa, statoFiamma } from '@/profilo/progressione';
import { useProfilo } from '@/profilo/store';
import { Icona, Scheda } from './kit';
import { livelloCorrente } from './progressi';
import { SfidaDelGiorno } from './SfidaDelGiorno';

/** Barra in cima: fiamma, stelle, il cerchio "Oggi" (obiettivo + missioni), suono. */
export function Intestazione({ onSfida }: { onSfida: () => void }) {
  const xp = useProfilo((p) => p.xp);
  const streak = useProfilo((p) => p.streak);
  const muto = useProfilo((p) => p.muto);
  const setMuto = useProfilo((p) => p.setMuto);
  const stelleLivelli = useProfilo((p) => p.stelleLivelli);
  const giornataSalvata = useProfilo((p) => p.giornata);
  const obiettivo = useProfilo((p) => p.benvenuto.obiettivo);
  const setObiettivo = useProfilo((p) => p.setObiettivo);
  const salvaFiamma = useProfilo((p) => p.salvaFiamma);
  const [aperta, setAperta] = useState(false);

  const oggi = giornoLocale(new Date());
  const giornata = giornataSalvata.giorno === oggi ? giornataSalvata : giornataVuota(oggi);
  const { giorni: fiamma, protetta } = statoFiamma(streak, oggi, salvaFiamma);
  const giocatoOggi = streak.ultimoGiorno === oggi;
  const stelle = Object.values(stelleLivelli).reduce<number>((s, n) => s + n, 0);
  const missioni = missioniDel(oggi);
  const fatte = missioni.filter((m) => completata(m, giornata)).length;
  const quota = Math.min(1, giornata.partite / obiettivo);
  const liv = livelloDa(xp);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-notte-900/85 px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 backdrop-blur-md">
        <div className="titolo mr-auto flex items-baseline gap-2 text-panna-50">
          <span className="text-xl font-semibold">Matemagica</span>
          <span className="text-xs whitespace-nowrap text-panna-100/60">liv. {liv.livello}</span>
        </div>
        <Chip>
          {/* La fiamma è grigia finché oggi non giochi; il ghiaccio dice che la tiene un salva-fiamma. */}
          <span aria-hidden className={giocatoOggi ? '' : 'opacity-60 grayscale'}>
            {protetta ? '🧊' : '🔥'}
          </span>
          <span className={fiamma > 0 ? '' : 'opacity-50'}>{fiamma}</span>
        </Chip>
        <Chip>
          <span className="text-oro-500" aria-hidden>
            ★
          </span>
          {stelle}
        </Chip>
        <button
          onClick={() => {
            suona('tap');
            setAperta(true);
          }}
          className="relative h-10 w-10"
          aria-label={`Oggi: ${giornata.partite} partite su ${obiettivo}, ${fatte} missioni su 3`}
        >
          <Anello quota={quota} />
          <span className="titolo absolute inset-0 flex items-center justify-center text-sm font-semibold text-panna-50">
            {fatte}/3
          </span>
        </button>
        <button onClick={() => setMuto(!muto)} className="p-1 text-panna-100/80" aria-label={muto ? 'Attiva i suoni' : 'Togli i suoni'}>
          <Icona nome={muto ? 'muto' : 'suono'} />
        </button>
      </header>

      {aperta && (
        <div className="fixed inset-0 z-40 flex items-end bg-notte-950/60 backdrop-blur-sm" onClick={() => setAperta(false)}>
          <div className="animate-sale mx-auto w-full max-w-md p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" onClick={(e) => e.stopPropagation()}>
            <Scheda className="p-5">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0">
                  <Anello quota={quota} scuro />
                  <span className="titolo absolute inset-0 flex items-center justify-center text-lg font-semibold">
                    {Math.min(giornata.partite, obiettivo)}/{obiettivo}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Oggi</h2>
                  <p className="text-inchiostro-chiaro">
                    {quota >= 1 ? 'Obiettivo del giorno raggiunto!' : `Obiettivo: ${obiettivo} ${obiettivo === 1 ? 'partita' : 'partite'}`}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2" role="radiogroup" aria-label="Obiettivo del giorno">
                {OBIETTIVI.map((o) => (
                  <button
                    key={o.partite}
                    role="radio"
                    aria-checked={obiettivo === o.partite}
                    onClick={() => {
                      suona('tap');
                      setObiettivo(o.partite);
                    }}
                    className={`flex-1 rounded-2xl px-2 py-2 text-sm ${
                      obiettivo === o.partite ? 'bg-oro-400 font-bold' : 'bg-panna-50 text-inchiostro-chiaro'
                    }`}
                  >
                    {o.nome}
                    <span className="block text-xs">{o.durata.replace(' al giorno', '')}</span>
                  </button>
                ))}
              </div>
              <h3 className="mt-5 text-lg font-semibold">Missioni del giorno</h3>
              <ul className="mt-2 flex flex-col gap-3">
                {missioni.map((m) => {
                  const a = avanzamento(m, giornata);
                  const ok = a >= m.obiettivo;
                  return (
                    <li key={m.id} className="rounded-2xl bg-panna-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={ok ? 'line-through opacity-60' : ''}>{m.testo}</span>
                        <span className="shrink-0 text-sm font-bold text-oro-600">{ok ? '✓' : `+${m.premioXp} XP`}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-panna-200">
                        <div className="h-full rounded-full bg-oro-500 transition-[width]" style={{ width: `${(a / m.obiettivo) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-5">
                <SfidaDelGiorno
                  onGioca={() => {
                    setAperta(false);
                    onSfida();
                  }}
                />
              </div>
              <p className="mt-4 text-center text-sm text-inchiostro-chiaro">
                Sei alla tappa {Math.floor(livelloCorrente(stelleLivelli) / 5) + 1} · {nomeTappa(Math.floor(livelloCorrente(stelleLivelli) / 5) + 1)}
                {salvaFiamma > 0 && ` · 🧊 ×${salvaFiamma}`}
              </p>
            </Scheda>
          </div>
        </div>
      )}
    </>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="titolo flex items-center gap-1 rounded-full bg-panna-100/95 px-2.5 py-1 text-base font-semibold text-inchiostro tabular-nums shadow">
      {children}
    </span>
  );
}

/** Anello di avanzamento dell'obiettivo del giorno. */
function Anello({ quota, scuro }: { quota: number; scuro?: boolean }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
      <circle cx="18" cy="18" r={r} fill="none" strokeWidth="4" stroke={scuro ? 'var(--color-panna-200)' : 'rgb(255 255 255 / 0.2)'} />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        stroke="var(--color-oro-400)"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - quota)}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}
