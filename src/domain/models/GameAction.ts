import { GameState } from './GameState';

export type SerializedAction =
  | { type: 'START_ROUND'; roundNumber: number; yinPlayerId: string }
  | { type: 'YIN_LOST'; roundNumber: number }
  | { type: 'POINT_ENTRY'; roundNumber: number; playerId: string; points: number };

/** Command pattern: each action knows how to derive the next GameState and how to (de)serialize itself. */
export abstract class GameAction {
  abstract readonly roundNumber: number;
  abstract apply(state: GameState): GameState;
  abstract toJSON(): SerializedAction;

  static fromJSON(data: SerializedAction): GameAction {
    switch (data.type) {
      case 'START_ROUND':
        return new StartRoundAction(data.roundNumber, data.yinPlayerId);
      case 'YIN_LOST':
        return new YinLostAction(data.roundNumber);
      case 'POINT_ENTRY':
        return new PointEntryAction(data.roundNumber, data.playerId, data.points);
    }
  }
}

export class StartRoundAction extends GameAction {
  readonly roundNumber: number;
  readonly yinPlayerId: string;

  constructor(roundNumber: number, yinPlayerId: string) {
    super();
    this.roundNumber = roundNumber;
    this.yinPlayerId = yinPlayerId;
  }

  apply(state: GameState): GameState {
    return state.startRound(this.roundNumber, this.yinPlayerId);
  }

  toJSON(): SerializedAction {
    return { type: 'START_ROUND', roundNumber: this.roundNumber, yinPlayerId: this.yinPlayerId };
  }
}

export class YinLostAction extends GameAction {
  readonly roundNumber: number;

  constructor(roundNumber: number) {
    super();
    this.roundNumber = roundNumber;
  }

  apply(state: GameState): GameState {
    return state.resolveYinLost();
  }

  toJSON(): SerializedAction {
    return { type: 'YIN_LOST', roundNumber: this.roundNumber };
  }
}

export class PointEntryAction extends GameAction {
  readonly roundNumber: number;
  readonly playerId: string;
  readonly points: number;

  constructor(roundNumber: number, playerId: string, points: number) {
    super();
    this.roundNumber = roundNumber;
    this.playerId = playerId;
    this.points = points;
  }

  apply(state: GameState): GameState {
    return state.enterPoints(this.playerId, this.points);
  }

  toJSON(): SerializedAction {
    return {
      type: 'POINT_ENTRY',
      roundNumber: this.roundNumber,
      playerId: this.playerId,
      points: this.points,
    };
  }
}
