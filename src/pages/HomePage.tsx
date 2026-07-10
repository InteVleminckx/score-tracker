import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { UserManager } from '../components/UserManager';

export function HomePage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t('app.title')}</h1>
      <UserManager />
      <Link
        to="/new-game"
        className="block rounded-xl bg-indigo-600 px-4 py-4 text-center text-lg font-semibold text-white active:bg-indigo-700"
      >
        {t('nav.newGame')}
      </Link>
    </div>
  );
}
