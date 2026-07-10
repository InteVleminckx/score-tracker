import { useGame } from '../../contexts/GameContext';
import { useI18n } from '../../i18n/I18nContext';
import { NumberEntryForm } from '../../components/NumberEntryForm';
import { AddPointsAction } from './actions';
import type { ExampleGameState } from './state';
import type { RoundEntryProps } from '../uiTypes';

export function RoundEntry({ players }: RoundEntryProps) {
  const { t } = useI18n();
  const { rawState, dispatch } = useGame();

  if (!rawState) return null;
  const state = rawState as ExampleGameState;
  if (state.status === 'completed') return null;

  const currentId = players.map((p) => p.id).find((id) => !state.enteredThisRound.includes(id));
  if (!currentId) return null; // round just resolved; next render shows the fresh state

  const name = players.find((p) => p.id === currentId)?.name ?? currentId;

  return (
    <NumberEntryForm
      label={t('round.enterPointsFor', { name })}
      // This game has no explicit round-start action, so roundNumber isn't
      // load-bearing for its rules — kept only for the generic action shape.
      onSubmit={(points) => void dispatch(new AddPointsAction(0, currentId, points))}
    />
  );
}
