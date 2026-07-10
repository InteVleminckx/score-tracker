import { useState, type FormEvent } from 'react';
import type { Player } from '../domain/models/Player';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/I18nContext';
import { PlayerPicker } from './PlayerPicker';

interface RoundEntryProps {
  /** Players in the game's fixed counting order. */
  players: Player[];
}

function nameOf(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? id;
}

function PointEntryForm({
  playerName,
  disabled,
  onSubmit,
}: {
  playerName: string;
  disabled: boolean;
  onSubmit: (points: number) => void;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const points = Number(value);
    if (!Number.isFinite(points) || points < 0) return;
    onSubmit(points);
    setValue('');
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-center text-lg font-medium">{t('round.enterPointsFor', { name: playerName })}</p>
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

export function RoundEntry({ players }: RoundEntryProps) {
  const { t } = useI18n();
  const { state, startRound, recordYinLost, recordPoints } = useGame();
  const [awaitingYin, setAwaitingYin] = useState(false);
  const [wonDecided, setWonDecided] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!state || state.status === 'completed') return null;

  const roundInProgress = !state.isRoundResolved();

  if (!roundInProgress && !awaitingYin) {
    return (
      <button
        type="button"
        onClick={() => setAwaitingYin(true)}
        className="w-full rounded-xl bg-indigo-600 px-4 py-4 text-lg font-semibold text-white active:bg-indigo-700"
      >
        {t('leaderboard.newRound')}
      </button>
    );
  }

  if (awaitingYin && !roundInProgress) {
    return (
      <PlayerPicker
        title={t('round.whoYinned')}
        players={players}
        disabled={busy}
        onSelect={async (id) => {
          setBusy(true);
          await startRound(id);
          setBusy(false);
          setAwaitingYin(false);
          setWonDecided(false);
        }}
      />
    );
  }

  const yinId = state.currentRoundYinPlayerId as string;

  if (!wonDecided) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg font-medium">{t('round.wonOrLost', { name: nameOf(players, yinId) })}</p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await recordYinLost();
              setBusy(false);
            }}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-4 text-lg font-semibold text-white disabled:opacity-40"
          >
            {t('round.lost')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setWonDecided(true)}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-4 text-lg font-semibold text-white disabled:opacity-40"
          >
            {t('round.won')}
          </button>
        </div>
      </div>
    );
  }

  const remaining = players
    .map((p) => p.id)
    .filter((id) => id !== yinId && !state.currentRoundEnteredPlayerIds.includes(id));
  const currentId = remaining[0];
  if (!currentId) return null; // round just resolved; the idle "New round" button reappears next render

  return (
    <PointEntryForm
      playerName={nameOf(players, currentId)}
      disabled={busy}
      onSubmit={async (points) => {
        setBusy(true);
        await recordPoints(currentId, points);
        setBusy(false);
      }}
    />
  );
}
