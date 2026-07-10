import type { GameStatus } from '../types';
import type { WiezenContract } from './contracts';

export interface WiezenRoundRecord {
  roundNumber: number;
  contract: WiezenContract;
  playingPlayerIds: string[];
  tricksTaken: number;
  bid?: number;
  success: boolean;
  deltas: Record<string, number>;
}

export interface WiezenGameState {
  scores: Record<string, number>;
  rounds: WiezenRoundRecord[];
  status: GameStatus;
  loserId: string | null;
}

export function initialWiezenState(playerIds: string[]): WiezenGameState {
  const scores: Record<string, number> = {};
  for (const id of playerIds) scores[id] = 0;
  return { scores, rounds: [], status: 'in_progress', loserId: null };
}
