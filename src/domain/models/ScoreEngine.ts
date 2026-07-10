export interface PlayerRoundState {
  score: number;
  hasHit100: boolean;
  eliminated: boolean;
}

/**
 * Pure threshold rules, applied once per player after their raw round points
 * are added. Thresholds trigger on an exact score match; elimination is the
 * one range check (> 150).
 */
export class ScoreEngine {
  static applyRoundPoints(state: PlayerRoundState, rawPoints: number): PlayerRoundState {
    let score = state.score + rawPoints;
    let hasHit100 = state.hasHit100;
    let eliminated = state.eliminated;

    if (score === 100) {
      score = 50;
      hasHit100 = true;
    } else if (hasHit100 && score === 69) {
      score = 0;
    } else if (score === 150) {
      score = 75;
    }

    if (score > 150) {
      eliminated = true;
    }

    return { score, hasHit100, eliminated };
  }
}
