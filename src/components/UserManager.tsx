import { useState, type FormEvent } from 'react';
import { useUsers } from '../contexts/UsersContext';
import { useI18n } from '../i18n/I18nContext';

export function UserManager() {
  const { t } = useI18n();
  const { users, addUser, loading } = useUsers();
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
        <ul className="flex flex-wrap gap-2">
          {users.map((u) => (
            <li
              key={u.id}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800"
            >
              {u.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
