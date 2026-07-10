import { useCallback, useEffect, useState } from 'react';
import { GameService } from '../domain/services/GameService';
import type { GameSnapshot } from '../domain/models/Game';
import { useI18n } from '../i18n/I18nContext';
import { GameHistoryList } from '../components/GameHistoryList';

const gameService = new GameService();

export function HistoryPage() {
  const { t } = useI18n();
  const [games, setGames] = useState<GameSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setGames(await gameService.listGames());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDelete = async (id: string) => {
    setGames((prev) => prev.filter((g) => g.id !== id));
    await gameService.deleteGame(id);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t('history.title')}</h1>
      {loading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : (
        <GameHistoryList games={games} onDelete={(id) => void handleDelete(id)} />
      )}
    </div>
  );
}
