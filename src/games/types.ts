/**
 * The generic contract every game type implements. Pure — no React, no
 * Firebase — so the domain layer (`src/domain/models/Game.ts`) can depend on
 * it without pulling in UI code.
 */

export interface GameAction {
  readonly type: string;
  readonly roundNumber: number;
  apply(state: unknown): unknown;
  toJSON(): Record<string, unknown>;
}

export type GameStatus = 'in_progress' | 'completed';

export interface LeaderboardRow {
  playerId: string;
  score: number;
  /** i18n key for a small badge next to the score, e.g. "eliminated". */
  badgeKey?: string;
}

export interface GameSummary {
  status: GameStatus;
  loserId: string | null;
  roundResolved: boolean;
  /** Always in the game's fixed counting order (playerIds), not sorted by score. */
  leaderboard: LeaderboardRow[];
}

export interface GameEngine {
  readonly gameTypeId: string;
  initialState(playerIds: string[]): unknown;
  deserializeAction(data: Record<string, unknown>): GameAction;
  summarize(state: unknown, playerIds: string[]): GameSummary;
}
