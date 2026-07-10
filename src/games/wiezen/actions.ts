import type { GameAction } from '../types';
import { computeRoundDeltas, type WiezenContract } from './contracts';
import type { WiezenGameState } from './state';

export type SerializedWiezenAction =
  | {
      type: 'RECORD_ROUND';
      roundNumber: number;
      contract: WiezenContract;
      playingPlayerIds: string[];
      tricksTaken: number;
      bid?: number;
    }
  | { type: 'END_GAME'; roundNumber: number };

export function deserializeWiezenAction(data: Record<string, unknown>): GameAction {
  const typed = data as SerializedWiezenAction;
  switch (typed.type) {
    case 'RECORD_ROUND':
      return new RecordRoundAction(
        typed.roundNumber,
        typed.contract,
        typed.playingPlayerIds,
        typed.tricksTaken,
        typed.bid,
      );
    case 'END_GAME':
      return new EndGameAction(typed.roundNumber);
    default:
      throw new Error(`Unknown wiezen action type: ${String((typed as { type: unknown }).type)}`);
  }
}

/** One completed hand: a contract, who played it, and how many tricks the playing side took. */
export class RecordRoundAction implements GameAction {
  readonly type = 'RECORD_ROUND';
  readonly roundNumber: number;
  readonly contract: WiezenContract;
  readonly playingPlayerIds: string[];
  readonly tricksTaken: number;
  readonly bid?: number;

  constructor(
    roundNumber: number,
    contract: WiezenContract,
    playingPlayerIds: string[],
    tricksTaken: number,
    bid?: number,
  ) {
    this.roundNumber = roundNumber;
    this.contract = contract;
    this.playingPlayerIds = playingPlayerIds;
    this.tricksTaken = tricksTaken;
    this.bid = bid;
  }

  apply(state: WiezenGameState): WiezenGameState {
    if (state.status === 'completed') {
      throw new Error('Game already completed.');
    }

    const allPlayerIds = Object.keys(state.scores);
    const opponentIds = allPlayerIds.filter((id) => !this.playingPlayerIds.includes(id));
    const { deltas, success } = computeRoundDeltas(
      this.contract,
      this.playingPlayerIds,
      opponentIds,
      this.tricksTaken,
      this.bid,
    );

    const scores = { ...state.scores };
    for (const id of allPlayerIds) {
      scores[id] = scores[id] + (deltas[id] ?? 0);
    }

    return {
      ...state,
      scores,
      rounds: [
        ...state.rounds,
        {
          roundNumber: this.roundNumber,
          contract: this.contract,
          playingPlayerIds: this.playingPlayerIds,
          tricksTaken: this.tricksTaken,
          bid: this.bid,
          success,
          deltas,
        },
      ],
    };
  }

  toJSON(): SerializedWiezenAction {
    return {
      type: 'RECORD_ROUND',
      roundNumber: this.roundNumber,
      contract: this.contract,
      playingPlayerIds: this.playingPlayerIds,
      tricksTaken: this.tricksTaken,
      bid: this.bid,
    };
  }
}

/**
 * Wiezen has no automatic win/elimination condition — a table just plays a
 * fixed number of hands and calls it. This is the explicit "we're done"
 * action, triggered from the round-entry screen's End Game button.
 */
export class EndGameAction implements GameAction {
  readonly type = 'END_GAME';
  readonly roundNumber: number;

  constructor(roundNumber: number) {
    this.roundNumber = roundNumber;
  }

  apply(state: WiezenGameState): WiezenGameState {
    if (state.status === 'completed') {
      throw new Error('Game already completed.');
    }
    if (state.rounds.length === 0) {
      throw new Error('Cannot end a game with no rounds played.');
    }

    const allPlayerIds = Object.keys(state.scores);
    // Lowest score loses; ties broken by counting order (first-appearing id).
    const loserId = allPlayerIds.reduce((lowestId, id) =>
      state.scores[id] < state.scores[lowestId] ? id : lowestId,
    );

    return { ...state, status: 'completed', loserId };
  }

  toJSON(): SerializedWiezenAction {
    return { type: 'END_GAME', roundNumber: this.roundNumber };
  }
}
