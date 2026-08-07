export type WiezenContract =
  | 'vragen'
  | 'troel'
  | 'alleenGaan'
  | 'abondance'
  | 'miserie'
  | 'miserieOpen'
  | 'solo'
  | 'soloSlim'
  | 'hartenheer';

export const WIEZEN_CONTRACTS: WiezenContract[] = [
  'alleenGaan',
  'vragen',
  'abondance',
  'miserie',
  'miserieOpen',
  'troel',
  'solo',
  'soloSlim',
  'hartenheer',
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
  alleenGaan: { playerCount: 1, tricksRequired: 5, needsBid: false },
  abondance: { playerCount: 1, tricksRequired: 9, needsBid: true },
  miserie: { playerCount: 1, tricksRequired: 0, needsBid: false },
  miserieOpen: { playerCount: 1, tricksRequired: 0, needsBid: false },
  solo: { playerCount: 1, tricksRequired: 13, needsBid: false },
  soloSlim: { playerCount: 1, tricksRequired: 13, needsBid: false },
  // Not a bid contract: scored via a fixed -3/+1 split, handled below.
  hartenheer: { playerCount: 1, tricksRequired: 0, needsBid: false },
};

export const ABONDANCE_BIDS = [9, 10, 11, 12, 13];
const ABONDANCE_POINTS: Record<number, number> = { 9: 4, 10: 7, 11: 8, 12: 9, 13: 10 };

export function isSuccess(contract: WiezenContract, tricksTaken: number, bid?: number): boolean {
  // Framed as the selected player always "losing" the -3/+1 split — see computeRoundDeltas.
  if (contract === 'hartenheer') return false;
  if (contract === 'miserie' || contract === 'miserieOpen') return tricksTaken === 0;
  const required = contract === 'abondance' ? (bid ?? 9) : CONTRACT_META[contract].tricksRequired;
  return tricksTaken >= required;
}

/**
 * Per-opponent point value for the round, per the nl.wikipedia.org/wiki/Wiezen
 * scoring table: Vragen 2pts (+1/overtrick, doubled on all 13 tricks), Troel
 * 4pts (+2/overtrick, 20 flat on all 13), Alleen gaan 2pts off a 5-trick base
 * (+1/overtrick), Abondance per the 9-13 trick table, Misère 7 (14 open),
 * Solo 25, Solo-slim 30. Hartenheer isn't a bid contract — it's a flat -3/+1
 * split, modeled here as a constant 1-point "loss" for whoever's picked (see
 * `isSuccess`). Failure penalties for the bid contracts aren't documented on
 * that page, so on failure we charge the same flat base the contract pays
 * for a bare (non-overtrick) success — adjust here if your table plays
 * harsher misses.
 */
function pointsPerOpponent(contract: WiezenContract, tricksTaken: number, bid?: number): number {
  switch (contract) {
    case 'vragen': {
      const base = 2 + Math.max(0, tricksTaken - 8);
      return tricksTaken === 13 ? base * 2 : base;
    }
    case 'troel':
      return tricksTaken === 13 ? 20 : 4 + Math.max(0, tricksTaken - 8) * 2;
    case 'alleenGaan':
      return 2 + Math.max(0, tricksTaken - 5);
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
    case 'hartenheer':
      return 1;
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
