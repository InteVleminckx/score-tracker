import { Link } from 'react-router-dom';
import { Game, type GameSnapshot } from '../domain/models/Game';
import { useI18n } from '../i18n/I18nContext';

interface GameHistoryListProps {
  games: GameSnapshot[];
  playerNames: Record<string, string>;
}

export function GameHistoryList({ games, playerNames }: GameHistoryListProps) {
  const { t } = useI18n();

  if (games.length === 0) {
    return <p className="text-sm text-slate-500">{t('history.empty')}</p>;
  }

  return (
    <ul className="space-y-3">
      {games.map((snapshot) => {
        const state = Game.fromSnapshot(snapshot).getCurrentState();
        const names = snapshot.playerIds.map((id) => playerNames[id] ?? id).join(', ');
        return (
          <li key={snapshot.id}>
            <Link
              to={`/game/${snapshot.id}`}
              className="block rounded-xl border border-slate-200 px-4 py-3 active:bg-slate-50 dark:border-slate-800 dark:active:bg-slate-800"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{names}</span>
                <span
                  className={`shrink-0 text-xs font-semibold uppercase ${
                    state.status === 'completed'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {state.status === 'completed' ? t('history.completed') : t('history.inProgress')}
                </span>
              </div>
              {state.status === 'completed' && state.loserId && (
                <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
                  {t('history.loser', { name: playerNames[state.loserId] ?? state.loserId })}
                </p>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
