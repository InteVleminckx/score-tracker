export type WiezenContract =
  | 'vragen'
  | 'troel'
  | 'troela'
  | 'abondance'
  | 'miserie'
  | 'miserieOpen'
  | 'solo'
  | 'soloSlim';

export const WIEZEN_CONTRACTS: WiezenContract[] = [
  'vragen',
  'troel',
  'troela',
  'abondance',
  'miserie',
  'miserieOpen',
  'solo',
  'soloSlim',
];

interface ContractMeta {
  /** How many players are on the "playing" side. */
  playerCount: 1 | 2;
  /** Baseline tricks needed for success. Ignored for abondance, which uses the bid instead. */
  tricksRequired: number;
  /** Abondance only: the soloist picks how many tricks they commit to (9-13). */
  needsBid: boolean;
}

export const CONTRACT_META: Record<WiezenContract, ContractMeta> = {
  vragen: { playerCount: 2, tricksRequired: 8, needsBid: false },
  troel: { playerCount: 2, tricksRequired: 8, needsBid: false },
  troela: { playerCount: 2, tricksRequired: 9, needsBid: false },
  abondance: { playerCount: 1, tricksRequired: 9, needsBid: true },
  miserie: { playerCount: 1, tricksRequired: 0, needsBid: false },
  miserieOpen: { playerCount: 1, tricksRequired: 0, needsBid: false },
  solo: { playerCount: 1, tricksRequired: 13, needsBid: false },
  soloSlim: { playerCount: 1, tricksRequired: 13, needsBid: false },
};

export const ABONDANCE_BIDS = [9, 10, 11, 12, 13];
const ABONDANCE_POINTS: Record<number, number> = { 9: 4, 10: 7, 11: 8, 12: 9, 13: 10 };

export function isSuccess(contract: WiezenContract, tricksTaken: number, bid?: number): boolean {
  if (contract === 'miserie' || contract === 'miserieOpen') return tricksTaken === 0;
  const required = contract === 'abondance' ? (bid ?? 9) : CONTRACT_META[contract].tricksRequired;
  return tricksTaken >= required;
}

/**
 * Per-opponent point value for the round, per the nl.wikipedia.org/wiki/Wiezen
 * scoring table: Vragen 2pts (+1/overtrick, doubled on all 13 tricks), Troel
 * 4pts (+2/overtrick, 20 flat on all 13), Troela same as Troel but off a
 * 9-trick base, Abondance per the 9-13 trick table, Misère 7 (14 open),
 * Solo 25, Solo-slim 30. Failure penalties aren't documented on that page, so
 * on failure we charge the same flat base the contract pays for a bare
 * (non-overtrick) success — adjust here if your table plays harsher misses.
 */
function pointsPerOpponent(contract: WiezenContract, tricksTaken: number, bid?: number): number {
  switch (contract) {
    case 'vragen': {
      const base = 2 + Math.max(0, tricksTaken - 8);
      return tricksTaken === 13 ? base * 2 : base;
    }
    case 'troel':
      return tricksTaken === 13 ? 20 : 4 + Math.max(0, tricksTaken - 8) * 2;
    case 'troela':
      return tricksTaken === 13 ? 20 : 4 + Math.max(0, tricksTaken - 9) * 2;
    case 'abondance':
      return ABONDANCE_POINTS[bid ?? 9] ?? 4;
    case 'miserie':
      return 7;
    case 'miserieOpen':
      return 14;
    case 'solo':
      return 25;
    case 'soloSlim':
      return 30;
  }
}

export interface RoundResult {
  success: boolean;
  /** Point delta per player, always summing to 0 across all four players. */
  deltas: Record<string, number>;
}

export function computeRoundDeltas(
  contract: WiezenContract,
  playingPlayerIds: string[],
  opponentIds: string[],
  tricksTaken: number,
  bid?: number,
): RoundResult {
  const success = isSuccess(contract, tricksTaken, bid);
  const perOpponent = pointsPerOpponent(contract, tricksTaken, bid);
  const sign = success ? 1 : -1;

  const deltas: Record<string, number> = {};
  for (const id of playingPlayerIds) {
    deltas[id] = (sign * perOpponent * opponentIds.length) / playingPlayerIds.length;
  }
  for (const id of opponentIds) {
    deltas[id] = -sign * perOpponent;
  }
  return { deltas, success };
}
