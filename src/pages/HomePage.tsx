import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { UserManager } from '../components/UserManager';
import { gameTypeDefinitions } from '../games/registry';

export function HomePage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t('app.title')}</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t('newGame.chooseGame')}</h2>
        <ul className="space-y-2">
          {gameTypeDefinitions.map((def) => (
            <li key={def.id}>
              <Link
                to={`/new-game/${def.id}`}
                className="block rounded-xl border border-slate-200 px-4 py-4 active:bg-slate-50 dark:border-slate-800 dark:active:bg-slate-800"
              >
                <span className="text-lg font-semibold">{t(def.nameKey)}</span>
                {def.descriptionKey && (
                  <p className="mt-1 text-sm text-slate-500">{t(def.descriptionKey)}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <UserManager />
    </div>
  );
}
