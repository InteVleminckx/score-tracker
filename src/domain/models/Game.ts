import { GameAction, type SerializedAction } from './GameAction';
import { GameState } from './GameState';

export interface GameSnapshot {
  id: string;
  playerIds: string[];
  actions: SerializedAction[];
  historyIndex: number;
  loserSignature: string | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Aggregate root: a game's identity, fixed player order, and its full
 * undo/redo-capable action log. Scores/status are never stored directly —
 * always derived by replaying actions[0..historyIndex] through GameState.
 */
export class Game {
  readonly id: string;
  readonly playerIds: string[];
  readonly actions: GameAction[];
  historyIndex: number;
  loserSignature: string | null;
  readonly createdAt: number;
  updatedAt: number;

  constructor(params: {
    id: string;
    playerIds: string[];
    actions?: GameAction[];
    historyIndex?: number;
    loserSignature?: string | null;
    createdAt?: number;
    updatedAt?: number;
  }) {
    this.id = params.id;
    this.playerIds = params.playerIds;
    this.actions = params.actions ?? [];
    this.historyIndex = params.historyIndex ?? -1;
    this.loserSignature = params.loserSignature ?? null;
    this.createdAt = params.createdAt ?? Date.now();
    this.updatedAt = params.updatedAt ?? this.createdAt;
  }

  static fromSnapshot(snapshot: GameSnapshot): Game {
    return new Game({
      id: snapshot.id,
      playerIds: snapshot.playerIds,
      actions: snapshot.actions.map((a) => GameAction.fromJSON(a)),
      historyIndex: snapshot.historyIndex,
      loserSignature: snapshot.loserSignature,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    });
  }

  toSnapshot(): GameSnapshot {
    return {
      id: this.id,
      playerIds: this.playerIds,
      actions: this.actions.map((a) => a.toJSON()),
      historyIndex: this.historyIndex,
      loserSignature: this.loserSignature,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  getCurrentState(): GameState {
    let state = GameState.initial(this.playerIds);
    for (let i = 0; i <= this.historyIndex; i++) {
      state = this.actions[i].apply(state);
    }
    return state;
  }

  isRoundComplete(): boolean {
    return this.getCurrentState().isRoundResolved();
  }

  canUndo(): boolean {
    return this.historyIndex >= 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.actions.length - 1;
  }

  undo(): void {
    if (!this.canUndo()) return;
    this.historyIndex -= 1;
    this.updatedAt = Date.now();
  }

  redo(): void {
    if (!this.canRedo()) return;
    this.historyIndex += 1;
    this.updatedAt = Date.now();
  }

  /** Applies and appends an action, validating it against the current derived state first. */
  addAction(action: GameAction): void {
    action.apply(this.getCurrentState()); // throws if the transition is invalid

    this.actions.length = this.historyIndex + 1; // drop any redo tail
    this.actions.push(action);
    this.historyIndex = this.actions.length - 1;
    this.updatedAt = Date.now();
  }
}
