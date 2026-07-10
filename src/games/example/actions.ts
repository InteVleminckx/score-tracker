import type { GameAction } from '../types';
import { ELIMINATION_THRESHOLD, type ExampleGameState } from './state';

export type SerializedExampleAction = {
  type: 'ADD_POINTS';
  roundNumber: number;
  playerId: string;
  points: number;
};

export function deserializeExampleAction(data: Record<string, unknown>): GameAction {
  const typed = data as SerializedExampleAction;
  if (typed.type === 'ADD_POINTS') {
    return new AddPointsAction(typed.roundNumber, typed.playerId, typed.points);
  }
  throw new Error(`Unknown example action type: ${String(typed.type)}`);
}

/**
 * A minimal, single-action game: every player enters points round-robin (no
 * yin/round-start concept). This is the template to copy when adding a new
 * game type — one action, one reducer, one round-entry screen.
 */
export class AddPointsAction implements GameAction {
  readonly type = 'ADD_POINTS';
  readonly roundNumber: number;
  readonly playerId: string;
  readonly points: number;

  constructor(roundNumber: number, playerId: string, points: number) {
    this.roundNumber = roundNumber;
    this.playerId = playerId;
    this.points = points;
  }

  apply(state: ExampleGameState): ExampleGameState {
    if (state.status === 'completed') {
      throw new Error('Game already completed.');
    }
    if (state.enteredThisRound.includes(this.playerId)) {
      throw new Error(`Player ${this.playerId} already entered this round.`);
    }

    const scores = {
      ...state.scores,
      [this.playerId]: state.scores[this.playerId] + this.points,
    };
    const enteredThisRound = [...state.enteredThisRound, this.playerId];
    const allPlayerIds = Object.keys(state.scores);
    const roundComplete = allPlayerIds.every((id) => enteredThisRound.includes(id));

    if (!roundComplete) {
      return { ...state, scores, enteredThisRound };
    }

    const eliminated = allPlayerIds.filter((id) => scores[id] > ELIMINATION_THRESHOLD);
    if (eliminated.length > 0) {
      const loserId = eliminated.reduce((highestId, id) =>
        scores[id] > scores[highestId] ? id : highestId,
      );
      return { scores, enteredThisRound: [], status: 'completed', loserId };
    }
    return { scores, enteredThisRound: [], status: 'in_progress', loserId: null };
  }

  toJSON(): SerializedExampleAction {
    return {
      type: 'ADD_POINTS',
      roundNumber: this.roundNumber,
      playerId: this.playerId,
      points: this.points,
    };
  }
}
