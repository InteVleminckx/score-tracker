import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { UsersProvider } from './contexts/UsersContext';
import { GameProvider } from './contexts/GameContext';
import { NavBar } from './components/NavBar';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageToggle } from './components/LanguageToggle';
import { HomePage } from './pages/HomePage';
import { NewGamePage } from './pages/NewGamePage';
import { GamePage } from './pages/GamePage';
import { HistoryPage } from './pages/HistoryPage';

function Header() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <span className="text-base font-semibold">{t('app.title')}</span>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}

function AppShell() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Header />
      <main className="mx-auto max-w-md px-4 py-4 pb-24">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/new-game/:gameTypeId" element={<NewGamePage />} />
          <Route path="/game/:id" element={<GamePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
      <NavBar />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <UsersProvider>
          <GameProvider>
            <HashRouter>
              <AppShell />
            </HashRouter>
          </GameProvider>
        </UsersProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
