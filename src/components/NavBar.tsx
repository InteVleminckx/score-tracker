import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';

const tabs = [
  { to: '/', key: 'nav.home', icon: '🏠' },
  { to: '/new-game', key: 'nav.newGame', icon: '➕' },
  { to: '/history', key: 'nav.history', icon: '📜' },
] as const;

export function NavBar() {
  const { t } = useI18n();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <span className="text-lg">{tab.icon}</span>
            {t(tab.key)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
