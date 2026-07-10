import type { GameAction } from '../types';
import { YinGameState } from './state';

export type SerializedYinAction =
  | { type: 'START_ROUND'; roundNumber: number; yinPlayerId: string }
  | { type: 'YIN_LOST'; roundNumber: number }
  | { type: 'POINT_ENTRY'; roundNumber: number; playerId: string; points: number };

export function deserializeYinAction(data: Record<string, unknown>): GameAction {
  const typed = data as SerializedYinAction;
  switch (typed.type) {
    case 'START_ROUND':
      return new StartRoundAction(typed.roundNumber, typed.yinPlayerId);
    case 'YIN_LOST':
      return new YinLostAction(typed.roundNumber);
    case 'POINT_ENTRY':
      return new PointEntryAction(typed.roundNumber, typed.playerId, typed.points);
  }
}

export class StartRoundAction implements GameAction {
  readonly type = 'START_ROUND';
  readonly roundNumber: number;
  readonly yinPlayerId: string;

  constructor(roundNumber: number, yinPlayerId: string) {
    this.roundNumber = roundNumber;
    this.yinPlayerId = yinPlayerId;
  }

  apply(state: YinGameState): YinGameState {
    return state.startRound(this.roundNumber, this.yinPlayerId);
  }

  toJSON(): SerializedYinAction {
    return { type: 'START_ROUND', roundNumber: this.roundNumber, yinPlayerId: this.yinPlayerId };
  }
}

export class YinLostAction implements GameAction {
  readonly type = 'YIN_LOST';
  readonly roundNumber: number;

  constructor(roundNumber: number) {
    this.roundNumber = roundNumber;
  }

  apply(state: YinGameState): YinGameState {
    return state.resolveYinLost();
  }

  toJSON(): SerializedYinAction {
    return { type: 'YIN_LOST', roundNumber: this.roundNumber };
  }
}

export class PointEntryAction implements GameAction {
  readonly type = 'POINT_ENTRY';
  readonly roundNumber: number;
  readonly playerId: string;
  readonly points: number;

  constructor(roundNumber: number, playerId: string, points: number) {
    this.roundNumber = roundNumber;
    this.playerId = playerId;
    this.points = points;
  }

  apply(state: YinGameState): YinGameState {
    return state.enterPoints(this.playerId, this.points);
  }

  toJSON(): SerializedYinAction {
    return {
      type: 'POINT_ENTRY',
      roundNumber: this.roundNumber,
      playerId: this.playerId,
      points: this.points,
    };
  }
}
