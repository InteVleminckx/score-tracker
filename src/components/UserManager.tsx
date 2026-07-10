import { useState, type FormEvent } from 'react';
import { useUsers } from '../contexts/UsersContext';
import { useI18n } from '../i18n/I18nContext';
import { TrashIcon } from './icons';

export function UserManager() {
  const { t } = useI18n();
  const { users, addUser, removeUser, loading } = useUsers();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await addUser(name);
      setName('');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = (id: string) => {
    if (window.confirm(t('users.removeConfirm'))) void removeUser(id);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{t('users.title')}</h2>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('users.addPlaceholder')}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-3 text-base dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {t('users.add')}
        </button>
      </form>
      {loading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-slate-500">{t('users.empty')}</p>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between gap-2 bg-white pl-4 dark:bg-slate-900"
            >
              <span className="text-base font-medium">{u.name}</span>
              <button
                type="button"
                aria-label={t('users.remove')}
                onClick={() => handleRemove(u.id)}
                className="flex h-14 w-14 shrink-0 items-center justify-center text-slate-500 active:bg-slate-100 dark:text-slate-400 dark:active:bg-slate-800"
              >
                <TrashIcon width="1.25em" height="1.25em" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
