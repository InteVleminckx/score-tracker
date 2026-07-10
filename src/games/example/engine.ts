import type { GameEngine, GameSummary } from '../types';
import { ELIMINATION_THRESHOLD, initialExampleState, type ExampleGameState } from './state';
import { deserializeExampleAction } from './actions';

export const exampleEngine: GameEngine = {
  gameTypeId: 'example',

  initialState(playerIds: string[]): ExampleGameState {
    return initialExampleState(playerIds);
  },

  deserializeAction: deserializeExampleAction,

  summarize(rawState: unknown, playerIds: string[]): GameSummary {
    const state = rawState as ExampleGameState;
    return {
      status: state.status,
      loserId: state.loserId,
      roundResolved: state.enteredThisRound.length === 0,
      leaderboard: playerIds.map((id) => ({
        playerId: id,
        score: state.scores[id],
        badgeKey: state.scores[id] > ELIMINATION_THRESHOLD ? 'leaderboard.eliminated' : undefined,
      })),
    };
  },
};
