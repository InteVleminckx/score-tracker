import type { GameEngine, GameSummary } from '../types';
import { YinGameState } from './state';
import { deserializeYinAction } from './actions';

export const yinEngine: GameEngine = {
  gameTypeId: 'yin',

  initialState(playerIds: string[]): YinGameState {
    return YinGameState.initial(playerIds);
  },

  deserializeAction: deserializeYinAction,

  summarize(state: unknown, playerIds: string[]): GameSummary {
    return (state as YinGameState).toSummary(playerIds);
  },
};
