import type { GameStatus } from '../types';

export interface ExampleGameState {
  scores: Record<string, number>;
  enteredThisRound: string[];
  status: GameStatus;
  loserId: string | null;
}

/** Deliberately low, just so the example is quick to play through. */
export const ELIMINATION_THRESHOLD = 30;

export function initialExampleState(playerIds: string[]): ExampleGameState {
  const scores: Record<string, number> = {};
  for (const id of playerIds) scores[id] = 0;
  return { scores, enteredThisRound: [], status: 'in_progress', loserId: null };
}
