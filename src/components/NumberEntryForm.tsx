import { useState, type FormEvent } from 'react';
import { useI18n } from '../i18n/I18nContext';

interface NumberEntryFormProps {
  label: string;
  disabled?: boolean;
  onSubmit: (value: number) => void;
}

export function NumberEntryForm({ label, disabled = false, onSubmit }: NumberEntryFormProps) {
  const { t } = useI18n();
  const [value, setValue] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    onSubmit(parsed);
    setValue('');
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-center text-lg font-medium">{label}</p>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-2xl tabular-nums dark:border-slate-700 dark:bg-slate-800"
      />
      <button
        type="submit"
        disabled={disabled || value === ''}
        className="w-full rounded-xl bg-indigo-600 px-4 py-4 text-lg font-semibold text-white disabled:opacity-40"
      >
        {t('round.confirm')}
      </button>
    </form>
  );
}
