import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/I18nContext';

export function UndoRedoBar() {
  const { t } = useI18n();
  const { meta, undo, redo, syncing } = useGame();
  if (!meta) return null;

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => void undo()}
        disabled={!meta.canUndo || syncing}
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-40 dark:border-slate-700"
      >
        {t('undo')}
      </button>
      <button
        type="button"
        onClick={() => void redo()}
        disabled={!meta.canRedo || syncing}
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-40 dark:border-slate-700"
      >
        {t('redo')}
      </button>
    </div>
  );
}
