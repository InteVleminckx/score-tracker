import { useEffect, useState } from 'react';
import { GameService } from '../domain/services/GameService';
import type { GameSnapshot } from '../domain/models/Game';
import { useUsers } from '../contexts/UsersContext';
import { useI18n } from '../i18n/I18nContext';
import { GameHistoryList } from '../components/GameHistoryList';

const gameService = new GameService();

export function HistoryPage() {
  const { t } = useI18n();
  const { users } = useUsers();
  const [games, setGames] = useState<GameSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void gameService.listGames().then((g) => {
      setGames(g);
      setLoading(false);
    });
  }, []);

  const playerNames = Object.fromEntries(users.map((u) => [u.id, u.name]));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('history.title')}</h1>
      {loading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : (
        <GameHistoryList games={games} playerNames={playerNames} />
      )}
    </div>
  );
}
