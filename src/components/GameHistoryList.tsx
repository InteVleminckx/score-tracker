import { Link } from 'react-router-dom';
import { Game, type GameSnapshot } from '../domain/models/Game';
import { useI18n } from '../i18n/I18nContext';
import { TrashIcon } from './icons';

interface GameHistoryListProps {
  games: GameSnapshot[];
  onDelete: (id: string) => void;
}

export function GameHistoryList({ games, onDelete }: GameHistoryListProps) {
  const { t } = useI18n();

  if (games.length === 0) {
    return <p className="text-sm text-slate-500">{t('history.empty')}</p>;
  }

  return (
    <ul className="space-y-3">
      {games.map((snapshot) => {
        const state = Game.fromSnapshot(snapshot).getCurrentState();
        const nameOf = (id: string) => snapshot.playerNames[id] ?? t('common.unknownPlayer');
        const names = snapshot.playerIds.map(nameOf).join(', ');
        return (
          <li
            key={snapshot.id}
            className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <Link to={`/game/${snapshot.id}`} className="flex-1 py-3 pl-4 active:opacity-70">
              <span
                className={`text-xs font-semibold uppercase ${
                  state.status === 'completed'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {state.status === 'completed' ? t('history.completed') : t('history.inProgress')}
              </span>
              <p className="mt-1 font-medium leading-snug break-words">{names}</p>
              {state.status === 'completed' && state.loserId && (
                <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
                  {t('history.loser', { name: nameOf(state.loserId) })}
                </p>
              )}
            </Link>
            <button
              type="button"
              aria-label={t('history.remove')}
              onClick={() => {
                if (window.confirm(t('history.removeConfirm'))) onDelete(snapshot.id);
              }}
              className="flex h-14 w-14 shrink-0 items-center justify-center text-rose-600 active:bg-rose-50 dark:text-rose-400 dark:active:bg-rose-950/40"
            >
              <TrashIcon width="1.25em" height="1.25em" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
