import { useI18n } from '../i18n/I18nContext';

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'en' ? 'nl' : 'en')}
      aria-label="Toggle language"
      className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-700"
    >
      {locale === 'en' ? 'EN' : 'NL'}
    </button>
  );
}
