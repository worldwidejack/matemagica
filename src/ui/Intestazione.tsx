import { useState } from 'react';
import { suona } from '@/audio/sfx';
import { nomeDellaTappa, titoloTappa } from '@/content/luoghi';
import { OBIETTIVI, avanzamento, completata, giornataVuota, missioniDel } from '@/profilo/giornata';
import { giornoLocale, livelloDa, statoFiamma } from '@/profilo/progressione';
import { useProfilo } from '@/profilo/store';
import { Icona, Oggetto, Scheda } from './kit';
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
  const tappa = Math.floor(livelloCorrente(stelleLivelli) / 5) + 1;

  return (
    <>
      {/* Fissa in cima, alta --testa: Casa comincia esattamente sotto. */}
      <header className="fixed inset-x-0 top-0 z-30 bg-carta pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-[3.75rem] max-w-md items-center gap-2 px-3">
        <div className="titolo mr-auto leading-none text-inchiostro">
          <span className="block text-[1.35rem] font-bold">Matemagica</span>
          <span className="mt-0.5 block text-xs font-semibold whitespace-nowrap text-inchiostro-chiaro">livello {liv.livello}</span>
        </div>
        <Chip>
          {/* La fiamma è spenta finché oggi non giochi; il ghiaccio dice che la tiene un salva-fiamma. */}
          {protetta ? (
            <Oggetto nome="ghiaccio" className="h-5" />
          ) : giocatoOggi ? (
            <Oggetto nome="fiamma" className="h-6" />
          ) : (
            <Icona nome="fiamma" className="h-5 w-5 text-inchiostro/35" />
          )}
          <span className={fiamma > 0 ? '' : 'opacity-50'}>{fiamma}</span>
        </Chip>
        <Chip>
          <Icona nome="stella" className="h-5 w-5 fill-oro-400 text-oro-600" />
          {stelle}
        </Chip>
        <button
          onClick={() => {
            suona('tap');
            setAperta(true);
          }}
          className="relative -m-1 h-12 w-12 p-1"
          aria-label={`Oggi: ${giornata.partite} partite su ${obiettivo}, ${fatte} missioni su 3`}
        >
          <Anello quota={quota} />
          <span className="titolo absolute inset-0 flex items-center justify-center text-sm font-bold text-inchiostro">
            {fatte}/3
          </span>
        </button>
        <button onClick={() => setMuto(!muto)} className="-m-2 p-3 text-inchiostro-chiaro" aria-label={muto ? 'Attiva i suoni' : 'Togli i suoni'}>
          <Icona nome={muto ? 'muto' : 'suono'} />
        </button>
        </div>
      </header>
      {/* il posto della testa nel flusso della pagina */}
      <div className="h-[3.75rem]" aria-hidden />

      {aperta && (
        <div className="fixed inset-0 z-40 flex items-end bg-inchiostro/55" onClick={() => setAperta(false)}>
          <div className="animate-sale mx-auto w-full max-w-md p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]" onClick={(e) => e.stopPropagation()}>
            <Scheda className="p-5">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0">
                  <Anello quota={quota} />
                  <span className="titolo absolute inset-0 flex items-center justify-center text-lg font-semibold">
                    {Math.min(giornata.partite, obiettivo)}/{obiettivo}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Oggi</h2>
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
                      obiettivo === o.partite ? 'bg-oro-400 font-bold shadow-[0_3px_0_var(--color-oro-600)]' : 'bg-carta text-inchiostro-chiaro'
                    }`}
                  >
                    {o.nome}
                    <span className="block text-xs">{o.durata.replace(' al giorno', '')}</span>
                  </button>
                ))}
              </div>
              <h3 className="mt-5 text-lg font-bold">Missioni del giorno</h3>
              <ul className="mt-2 flex flex-col gap-3">
                {missioni.map((m) => {
                  const a = avanzamento(m, giornata);
                  const ok = a >= m.obiettivo;
                  return (
                    <li key={m.id} className="rounded-2xl bg-carta p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={ok ? 'line-through opacity-60' : ''}>{m.testo}</span>
                        <span className="shrink-0 text-sm font-bold text-oro-700">{ok ? '✓' : `+${m.premioXp} XP`}</span>
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
                {titoloTappa(tappa)} · {nomeDellaTappa(tappa)}
                {salvaFiamma > 0 && (
                  <>
                    {' · '}
                    <Oggetto nome="ghiaccio" className="h-4 align-[-0.2em]" /> ×{salvaFiamma}
                  </>
                )}
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
    <span className="titolo flex items-center gap-1 rounded-full bg-panna-50 px-2.5 py-1 text-base font-bold text-inchiostro tabular-nums shadow-[0_3px_0_rgb(21_19_46/0.14)]">
      {children}
    </span>
  );
}

/** Anello di avanzamento dell'obiettivo del giorno. */
function Anello({ quota }: { quota: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
      <circle cx="18" cy="18" r={r} fill="none" strokeWidth="4" stroke="var(--color-panna-200)" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        stroke="var(--color-oro-500)"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - quota)}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}
