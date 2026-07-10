import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-full border border-slate-300 p-2 text-lg leading-none dark:border-slate-700"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
