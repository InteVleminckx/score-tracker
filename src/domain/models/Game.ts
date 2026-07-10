import type { GameAction, GameSummary } from '../../games/types';
import { getEngine } from '../../games/engines';

export interface GameSnapshot {
  id: string;
  gameTypeId: string;
  playerIds: string[];
  /** Player names at the time the game was created — kept even if the Player is later removed. */
  playerNames: Record<string, string>;
  actions: Record<string, unknown>[];
  historyIndex: number;
  loserSignature: string | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Aggregate root: a game's identity, its type, fixed player order, and its
 * full undo/redo-capable action log. Scores/status are never stored
 * directly — always derived by replaying actions[0..historyIndex] through
 * the game type's engine (resolved via `gameTypeId`, see `games/engines.ts`).
 */
export class Game {
  readonly id: string;
  readonly gameTypeId: string;
  readonly playerIds: string[];
  readonly playerNames: Record<string, string>;
  readonly actions: GameAction[];
  historyIndex: number;
  loserSignature: string | null;
  readonly createdAt: number;
  updatedAt: number;

  constructor(params: {
    id: string;
    gameTypeId: string;
    playerIds: string[];
    playerNames: Record<string, string>;
    actions?: GameAction[];
    historyIndex?: number;
    loserSignature?: string | null;
    createdAt?: number;
    updatedAt?: number;
  }) {
    this.id = params.id;
    this.gameTypeId = params.gameTypeId;
    this.playerIds = params.playerIds;
    this.playerNames = params.playerNames;
    this.actions = params.actions ?? [];
    this.historyIndex = params.historyIndex ?? -1;
    this.loserSignature = params.loserSignature ?? null;
    this.createdAt = params.createdAt ?? Date.now();
    this.updatedAt = params.updatedAt ?? this.createdAt;
  }

  static fromSnapshot(snapshot: GameSnapshot): Game {
    const engine = getEngine(snapshot.gameTypeId);
    return new Game({
      id: snapshot.id,
      gameTypeId: snapshot.gameTypeId,
      playerIds: snapshot.playerIds,
      playerNames: snapshot.playerNames,
      actions: snapshot.actions.map((a) => engine.deserializeAction(a)),
      historyIndex: snapshot.historyIndex,
      loserSignature: snapshot.loserSignature,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    });
  }

  toSnapshot(): GameSnapshot {
    return {
      id: this.id,
      gameTypeId: this.gameTypeId,
      playerIds: this.playerIds,
      playerNames: this.playerNames,
      actions: this.actions.map((a) => a.toJSON()),
      historyIndex: this.historyIndex,
      loserSignature: this.loserSignature,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  getRawState(): unknown {
    const engine = getEngine(this.gameTypeId);
    let state = engine.initialState(this.playerIds);
    for (let i = 0; i <= this.historyIndex; i++) {
      state = this.actions[i].apply(state);
    }
    return state;
  }

  getSummary(): GameSummary {
    return getEngine(this.gameTypeId).summarize(this.getRawState(), this.playerIds);
  }

  /** Once a game is completed, its history is frozen — no undo/redo. */
  canUndo(): boolean {
    if (this.getSummary().status === 'completed') return false;
    return this.historyIndex >= 0;
  }

  canRedo(): boolean {
    if (this.getSummary().status === 'completed') return false;
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
    action.apply(this.getRawState()); // throws if the transition is invalid

    this.actions.length = this.historyIndex + 1; // drop any redo tail
    this.actions.push(action);
    this.historyIndex = this.actions.length - 1;
    this.updatedAt = Date.now();
  }
}
