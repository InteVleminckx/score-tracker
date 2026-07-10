import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../contexts/UsersContext';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/I18nContext';
import { PlayerPicker } from '../components/PlayerPicker';

export function NewGamePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { users, addUser } = useUsers();
  const { createGame, loading } = useGame();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAddPlayer = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const user = await addUser(newName);
    setNewName('');
    setSelectedIds((prev) => [...prev, user.id]);
  };

  const start = async () => {
    setBusy(true);
    try {
      const players = selectedIds.map((id) => users.find((u) => u.id === id)!);
      const id = await createGame(players);
      navigate(`/game/${id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t('newGame.title')}</h1>

      <div className="space-y-2">
        <p className="text-sm text-slate-500">{t('newGame.selectPlayers')}</p>
        <p className="text-xs text-slate-400">{t('newGame.orderHint')}</p>
        <PlayerPicker players={users} selectedIds={selectedIds} disabled={busy} onSelect={toggle} />
      </div>

      <form onSubmit={handleAddPlayer} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('newGame.addNewPlayer')}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-3 text-base dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="rounded-lg bg-slate-200 px-4 py-3 font-medium disabled:opacity-50 dark:bg-slate-800"
        >
          +
        </button>
      </form>

      {selectedIds.length < 2 && (
        <p className="text-center text-sm text-amber-600 dark:text-amber-400">
          {t('newGame.needTwoPlayers')}
        </p>
      )}

      <button
        type="button"
        onClick={() => void start()}
        disabled={selectedIds.length < 2 || busy || loading}
        className="w-full rounded-xl bg-indigo-600 px-4 py-4 text-lg font-semibold text-white disabled:opacity-40"
      >
        {t('newGame.start')}
      </button>
    </div>
  );
}
