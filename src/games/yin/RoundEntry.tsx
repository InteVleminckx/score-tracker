import { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useI18n } from '../../i18n/I18nContext';
import { PlayerPicker } from '../../components/PlayerPicker';
import { NumberEntryForm } from '../../components/NumberEntryForm';
import type { RoundEntryProps } from '../uiTypes';
import type { YinGameState } from './state';
import { StartRoundAction, YinLostAction, PointEntryAction } from './actions';

function nameOf(players: RoundEntryProps['players'], id: string): string {
  return players.find((p) => p.id === id)?.name ?? id;
}

export function RoundEntry({ players }: RoundEntryProps) {
  const { t } = useI18n();
  const { rawState, dispatch } = useGame();
  const [awaitingYin, setAwaitingYin] = useState(false);
  const [wonDecided, setWonDecided] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!rawState) return null;
  const state = rawState as YinGameState;
  if (state.status === 'completed') return null;

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
          await dispatch(new StartRoundAction(state.currentRoundNumber + 1, id));
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
              await dispatch(new YinLostAction(state.currentRoundNumber));
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
    <NumberEntryForm
      label={t('round.enterPointsFor', { name: nameOf(players, currentId) })}
      disabled={busy}
      onSubmit={async (points) => {
        setBusy(true);
        await dispatch(new PointEntryAction(state.currentRoundNumber, currentId, points));
        setBusy(false);
      }}
    />
  );
}
