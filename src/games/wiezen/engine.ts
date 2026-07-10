import type { GameEngine, GameSummary } from '../types';
import { initialWiezenState, type WiezenGameState } from './state';
import { deserializeWiezenAction } from './actions';

export const wiezenEngine: GameEngine = {
  gameTypeId: 'wiezen',

  initialState(playerIds: string[]): WiezenGameState {
    return initialWiezenState(playerIds);
  },

  deserializeAction: deserializeWiezenAction,

  summarize(rawState: unknown, playerIds: string[]): GameSummary {
    const state = rawState as WiezenGameState;
    return {
      status: state.status,
      loserId: state.loserId,
      // Every RECORD_ROUND action fully resolves a hand in one step — there's
      // no partial-round UI state (unlike yin's win/lose -> point entry flow).
      roundResolved: true,
      leaderboard: playerIds.map((id) => ({
        playerId: id,
        score: state.scores[id] ?? 0,
      })),
    };
  },
};
