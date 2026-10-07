import { giornoLocale, livelloDa, streakViva } from '@/profilo/progressione';
import { useProfilo } from '@/profilo/store';

/** Livello giocatore, XP, giorni di fila e mute: sempre in cima. */
export function Intestazione() {
  const xp = useProfilo((p) => p.xp);
  const streak = useProfilo((p) => p.streak);
  const muto = useProfilo((p) => p.muto);
  const setMuto = useProfilo((p) => p.setMuto);
  const liv = livelloDa(xp);
  const fiamma = streakViva(streak, giornoLocale(new Date()));

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-notte-900/90 px-4 pt-3 pb-3 backdrop-blur">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-turchese-500/20 text-lg font-black text-turchese-300">
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
      <button onClick={() => setMuto(!muto)} className="text-2xl" aria-label={muto ? 'Attiva i suoni' : 'Togli i suoni'}>
        {muto ? '🔇' : '🔊'}
      </button>
    </header>
  );
}
