import { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useI18n } from '../../i18n/I18nContext';
import { PlayerPicker } from '../../components/PlayerPicker';
import { NumberEntryForm } from '../../components/NumberEntryForm';
import type { RoundEntryProps } from '../uiTypes';
import type { WiezenGameState } from './state';
import { RecordRoundAction, EndGameAction } from './actions';
import { ABONDANCE_BIDS, CONTRACT_META, WIEZEN_CONTRACTS, type WiezenContract } from './contracts';

function nameOf(players: RoundEntryProps['players'], id: string): string {
  return players.find((p) => p.id === id)?.name ?? id;
}

export function RoundEntry({ players }: RoundEntryProps) {
  const { t } = useI18n();
  const { rawState, dispatch } = useGame();
  const [contract, setContract] = useState<WiezenContract | null>(null);
  const [playingIds, setPlayingIds] = useState<string[]>([]);
  const [bid, setBid] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  if (!rawState) return null;
  const state = rawState as WiezenGameState;
  if (state.status === 'completed') return null;

  const reset = () => {
    setContract(null);
    setPlayingIds([]);
    setBid(null);
  };

  const meta = contract ? CONTRACT_META[contract] : null;

  if (!contract) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <p className="text-center text-lg font-medium">{t('wiezen.chooseContract')}</p>
          <div className="grid grid-cols-2 gap-3">
            {WIEZEN_CONTRACTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setContract(c)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-4 text-base font-medium text-slate-900 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {t(`wiezen.contract.${c}`)}
              </button>
            ))}
          </div>
        </div>
        {state.rounds.length > 0 && <EndGameButton roundNumber={state.rounds.length} />}
        <RoundLog players={players} rounds={state.rounds} />
      </div>
    );
  }

  if (meta && playingIds.length < meta.playerCount) {
    return (
      <div className="space-y-3">
        <PlayerPicker
          title={t(meta.playerCount === 1 ? 'wiezen.choosePlayerSolo' : 'wiezen.choosePlayers')}
          players={players}
          selectedIds={playingIds}
          onSelect={(id) => {
            if (playingIds.includes(id)) {
              setPlayingIds(playingIds.filter((pid) => pid !== id));
            } else if (playingIds.length < meta.playerCount) {
              setPlayingIds([...playingIds, id]);
            }
          }}
        />
        <CancelButton onCancel={reset} />
      </div>
    );
  }

  if (meta?.needsBid && bid === null) {
    return (
      <div className="space-y-3">
        <p className="text-center text-lg font-medium">{t('wiezen.chooseBid')}</p>
        <div className="grid grid-cols-3 gap-3">
          {ABONDANCE_BIDS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBid(b)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-4 text-lg font-semibold text-slate-900 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {b}
            </button>
          ))}
        </div>
        <CancelButton onCancel={reset} />
      </div>
    );
  }

  const label =
    meta?.playerCount === 1
      ? t('wiezen.tricksTakenSolo', { name: nameOf(players, playingIds[0]) })
      : t('wiezen.tricksTaken');

  return (
    <div className="space-y-3">
      <NumberEntryForm
        label={label}
        disabled={busy}
        onSubmit={async (value) => {
          if (!contract) return;
          const tricksTaken = Math.min(13, Math.max(0, Math.round(value)));
          setBusy(true);
          await dispatch(
            new RecordRoundAction(
              state.rounds.length + 1,
              contract,
              playingIds,
              tricksTaken,
              bid ?? undefined,
            ),
          );
          setBusy(false);
          reset();
        }}
      />
      <CancelButton onCancel={reset} disabled={busy} />
    </div>
  );
}

function CancelButton({ onCancel, disabled }: { onCancel: () => void; disabled?: boolean }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onCancel}
      className="w-full text-center text-sm font-medium text-slate-500 underline disabled:opacity-40 dark:text-slate-400"
    >
      {t('common.cancel')}
    </button>
  );
}

function EndGameButton({ roundNumber }: { roundNumber: number }) {
  const { t } = useI18n();
  const { dispatch } = useGame();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm(t('wiezen.endGameConfirm'))) {
          void dispatch(new EndGameAction(roundNumber));
        }
      }}
      className="w-full rounded-xl border border-rose-300 px-4 py-3 text-sm font-medium text-rose-600 dark:border-rose-900 dark:text-rose-400"
    >
      {t('wiezen.endGame')}
    </button>
  );
}

function RoundLog({
  players,
  rounds,
}: {
  players: RoundEntryProps['players'];
  rounds: WiezenGameState['rounds'];
}) {
  const { t } = useI18n();
  if (rounds.length === 0) return null;
  const recent = [...rounds].reverse().slice(0, 5);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {t('wiezen.recentRounds')}
      </p>
      <ul className="space-y-1 text-sm">
        {recent.map((r) => (
          <li
            key={r.roundNumber}
            className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800"
          >
            <span>
              {t(`wiezen.contract.${r.contract}`)} — {r.playingPlayerIds.map((id) => nameOf(players, id)).join(' & ')}
            </span>
            <span className={r.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {r.tricksTaken} {t(r.success ? 'wiezen.success' : 'wiezen.failure')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
