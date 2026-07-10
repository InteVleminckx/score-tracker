import type { Player } from '../domain/models/Player';

interface PlayerPickerProps {
  players: Player[];
  title?: string;
  disabled?: boolean;
  /** When set, shows a numbered badge for each selected player (used for counting-order selection). */
  selectedIds?: string[];
  onSelect: (playerId: string) => void;
}

export function PlayerPicker({ players, title, disabled, selectedIds, onSelect }: PlayerPickerProps) {
  return (
    <div className="space-y-3">
      {title && <p className="text-center text-lg font-medium">{title}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {players.map((p) => {
          const order = selectedIds?.indexOf(p.id);
          const isSelected = order !== undefined && order >= 0;
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(p.id)}
              className={`rounded-xl border px-4 py-4 text-base font-medium transition active:scale-95 disabled:opacity-50 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              {p.name}
              {isSelected && <span className="ml-2 text-xs opacity-80">#{order! + 1}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
