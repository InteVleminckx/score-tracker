import type { Player } from '../domain/models/Player';
import type { GameSummary } from '../games/types';
import { useI18n } from '../i18n/I18nContext';

interface LeaderboardProps {
  /** Players already in the game's fixed counting order. */
  players: Player[];
  summary: GameSummary;
}

export function Leaderboard({ players, summary }: LeaderboardProps) {
  const { t } = useI18n();
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{t('leaderboard.title')}</h2>
      {summary.status === 'completed' && (
        <p className="rounded-lg bg-amber-100 px-3 py-2 text-center font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
          {t('leaderboard.gameOver')}
        </p>
      )}
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {players.map((p) => {
          const row = summary.leaderboard.find((r) => r.playerId === p.id);
          const isLoser = summary.loserId === p.id;
          return (
            <li
              key={p.id}
              className={`flex items-center justify-between px-4 py-3 ${
                isLoser ? 'bg-rose-50 dark:bg-rose-950/40' : 'bg-white dark:bg-slate-900'
              }`}
            >
              <span className="text-base font-medium">
                {p.name}
                {row?.badgeKey && (
                  <span className="ml-2 text-xs font-normal text-rose-600 dark:text-rose-400">
                    {t(row.badgeKey)}
                  </span>
                )}
              </span>
              <span className="text-xl font-semibold tabular-nums">
                {row?.score ?? 0}{' '}
                <span className="text-sm font-normal text-slate-500">{t('leaderboard.points')}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
