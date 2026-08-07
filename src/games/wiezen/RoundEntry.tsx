import { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useI18n } from '../../i18n/I18nContext';
import { PlayerPicker } from '../../components/PlayerPicker';
import { NumberEntryForm } from '../../components/NumberEntryForm';
import type { RoundEntryProps } from '../uiTypes';
import type { WiezenGameState } from './state';
import { RecordRoundAction, EndGameAction } from './actions';
import { ABONDANCE_BIDS, CONTRACT_META, WIEZEN_CONTRACTS, type WiezenContract } from './contracts';
import { ChevronDownIcon } from '../../components/icons';

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

  if (contract === 'hartenheer') {
    return (
      <div className="space-y-3">
        <PlayerPicker
          title={t('wiezen.whoHasHeartsKing')}
          players={players}
          disabled={busy}
          onSelect={async (id) => {
            setBusy(true);
            await dispatch(new RecordRoundAction(state.rounds.length + 1, 'hartenheer', [id], 0));
            setBusy(false);
            reset();
          }}
        />
        <CancelButton onCancel={reset} disabled={busy} />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-center text-base font-medium">{t('wiezen.chooseContract')}</p>
          <div className="grid grid-cols-3 gap-2">
            {WIEZEN_CONTRACTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setContract(c)}
                className="rounded-xl border border-slate-300 bg-white px-2 py-3 text-sm font-medium leading-tight text-slate-900 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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

  if (contract === 'abondance' || contract === 'miserie' || contract === 'miserieOpen') {
    const submit = async (succeeded: boolean) => {
      // Only the success/failure boundary matters for these contracts —
      // pointsPerOpponent doesn't scale with tricksTaken for them, so any
      // value on the correct side of the isSuccess threshold is fine.
      const tricksTaken =
        contract === 'abondance' ? (succeeded ? bid ?? 9 : 0) : succeeded ? 0 : 1;
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
    };

    return (
      <div className="space-y-3">
        <p className="text-center text-lg font-medium">{t('wiezen.didSucceed')}</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => submit(true)}
            className="rounded-xl border border-emerald-300 bg-white px-4 py-4 text-base font-semibold text-emerald-700 transition active:scale-95 disabled:opacity-40 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-400"
          >
            {t('wiezen.succeeded')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => submit(false)}
            className="rounded-xl border border-rose-300 bg-white px-4 py-4 text-base font-semibold text-rose-700 transition active:scale-95 disabled:opacity-40 dark:border-rose-800 dark:bg-slate-800 dark:text-rose-400"
          >
            {t('wiezen.failed')}
          </button>
        </div>
        <CancelButton onCancel={reset} disabled={busy} />
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
  const [open, setOpen] = useState(false);
  if (rounds.length === 0) return null;
  const ordered = [...rounds].reverse();

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400"
      >
        <span>
          {t('wiezen.recentRounds')} ({rounds.length})
        </span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="space-y-1 text-sm">
          {ordered.map((r) => (
            <li key={r.roundNumber} className="space-y-1.5 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <span>
                  {t(`wiezen.contract.${r.contract}`)} — {r.playingPlayerIds.map((id) => nameOf(players, id)).join(' & ')}
                </span>
                {r.contract === 'hartenheer' ? (
                  <span className="text-rose-600 dark:text-rose-400">-3</span>
                ) : r.contract === 'abondance' || r.contract === 'miserie' || r.contract === 'miserieOpen' ? (
                  <span className={r.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                    {t(r.success ? 'wiezen.success' : 'wiezen.failure')}
                  </span>
                ) : (
                  <span className={r.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                    {r.tricksTaken} {t(r.success ? 'wiezen.success' : 'wiezen.failure')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                {players.map((p) => {
                  const delta = r.deltas[p.id] ?? 0;
                  return (
                    <span
                      key={p.id}
                      className={
                        delta > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : delta < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : undefined
                      }
                    >
                      {p.name} {delta > 0 ? '+' : ''}
                      {delta}
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
