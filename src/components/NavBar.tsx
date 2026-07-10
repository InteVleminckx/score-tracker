import { NavLink } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import { HomeIcon, PlusIcon, HistoryIcon } from './icons';

const tabs = [
  { to: '/', key: 'nav.home', Icon: HomeIcon },
  { to: '/new-game', key: 'nav.newGame', Icon: PlusIcon },
  { to: '/history', key: 'nav.history', Icon: HistoryIcon },
] as const;

export function NavBar() {
  const { t } = useI18n();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-md">
        {tabs.map(({ to, key, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Icon />
            {t(key)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
