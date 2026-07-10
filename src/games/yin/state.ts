import { YinScoreEngine, type PlayerRoundState } from './scoreEngine';
import type { GameStatus, GameSummary } from '../types';

interface YinGameStateSnapshot {
  playerStates: Record<string, PlayerRoundState>;
  currentRoundNumber: number;
  currentRoundYinPlayerId: string | null;
  currentRoundEnteredPlayerIds: string[];
  currentRoundResolved: boolean;
  status: GameStatus;
  loserId: string | null;
}

/** Immutable value object: the derived state of a YIN game at a point in its action log. */
export class YinGameState {
  private readonly snapshot: YinGameStateSnapshot;

  private constructor(snapshot: YinGameStateSnapshot) {
    this.snapshot = snapshot;
  }

  static initial(playerIds: string[]): YinGameState {
    const playerStates: Record<string, PlayerRoundState> = {};
    for (const id of playerIds) {
      playerStates[id] = { score: 0, hasHit100: false, eliminated: false };
    }
    return new YinGameState({
      playerStates,
      currentRoundNumber: 0,
      currentRoundYinPlayerId: null,
      currentRoundEnteredPlayerIds: [],
      currentRoundResolved: true,
      status: 'in_progress',
      loserId: null,
    });
  }

  get status(): GameStatus {
    return this.snapshot.status;
  }

  get loserId(): string | null {
    return this.snapshot.loserId;
  }

  get currentRoundNumber(): number {
    return this.snapshot.currentRoundNumber;
  }

  get currentRoundYinPlayerId(): string | null {
    return this.snapshot.currentRoundYinPlayerId;
  }

  get currentRoundEnteredPlayerIds(): string[] {
    return this.snapshot.currentRoundEnteredPlayerIds;
  }

  isRoundResolved(): boolean {
    return this.snapshot.currentRoundResolved;
  }

  scoreOf(playerId: string): number {
    return this.snapshot.playerStates[playerId].score;
  }

  toSummary(playerIds: string[]): GameSummary {
    return {
      status: this.snapshot.status,
      loserId: this.snapshot.loserId,
      roundResolved: this.snapshot.currentRoundResolved,
      leaderboard: playerIds.map((id) => ({
        playerId: id,
        score: this.snapshot.playerStates[id].score,
        badgeKey: this.snapshot.playerStates[id].eliminated ? 'leaderboard.eliminated' : undefined,
      })),
    };
  }

  startRound(roundNumber: number, yinPlayerId: string): YinGameState {
    if (this.snapshot.status === 'completed') {
      throw new Error('Cannot start a round: game already completed.');
    }
    if (!this.snapshot.currentRoundResolved) {
      throw new Error('Cannot start a new round before the current one is resolved.');
    }
    return new YinGameState({
      ...this.snapshot,
      currentRoundNumber: roundNumber,
      currentRoundYinPlayerId: yinPlayerId,
      currentRoundEnteredPlayerIds: [],
      currentRoundResolved: false,
    });
  }

  resolveYinLost(): YinGameState {
    const yinId = this.requireCurrentYinPlayer();
    const playerStates = { ...this.snapshot.playerStates };
    for (const id of Object.keys(playerStates)) {
      playerStates[id] = YinScoreEngine.applyRoundPoints(playerStates[id], id === yinId ? 50 : 0);
    }
    return this.resolveRound(playerStates, this.snapshot.currentRoundEnteredPlayerIds);
  }

  enterPoints(playerId: string, points: number): YinGameState {
    const yinId = this.requireCurrentYinPlayer();
    if (playerId === yinId) {
      throw new Error('The yin player is scored automatically; do not enter points for them directly.');
    }
    if (this.snapshot.currentRoundEnteredPlayerIds.includes(playerId)) {
      throw new Error(`Player ${playerId} already has an entry for this round.`);
    }

    const playerStates: Record<string, PlayerRoundState> = {
      ...this.snapshot.playerStates,
      [playerId]: YinScoreEngine.applyRoundPoints(this.snapshot.playerStates[playerId], points),
    };
    const enteredPlayerIds = [...this.snapshot.currentRoundEnteredPlayerIds, playerId];

    const allPlayerIds = Object.keys(this.snapshot.playerStates);
    const remainingNonYin = allPlayerIds.filter(
      (id) => id !== yinId && !enteredPlayerIds.includes(id),
    );

    if (remainingNonYin.length > 0) {
      return new YinGameState({
        ...this.snapshot,
        playerStates,
        currentRoundEnteredPlayerIds: enteredPlayerIds,
      });
    }

    // Last non-yin entry for this round: yin player is implicitly scored 0.
    playerStates[yinId] = YinScoreEngine.applyRoundPoints(playerStates[yinId], 0);
    return this.resolveRound(playerStates, enteredPlayerIds);
  }

  private resolveRound(
    playerStates: Record<string, PlayerRoundState>,
    enteredPlayerIds: string[],
  ): YinGameState {
    const eliminatedIds = Object.keys(playerStates).filter((id) => playerStates[id].eliminated);

    let status: GameStatus = this.snapshot.status;
    let loserId: string | null = this.snapshot.loserId;

    if (eliminatedIds.length > 0) {
      status = 'completed';
      // Highest score among eliminated players loses; ties broken by counting order
      // (first-appearing id wins, since Object.keys preserves playerIds insertion order).
      loserId = eliminatedIds.reduce((highestId, id) =>
        playerStates[id].score > playerStates[highestId].score ? id : highestId,
      );
    }

    return new YinGameState({
      ...this.snapshot,
      playerStates,
      currentRoundEnteredPlayerIds: enteredPlayerIds,
      currentRoundResolved: true,
      status,
      loserId,
    });
  }

  private requireCurrentYinPlayer(): string {
    if (this.snapshot.status === 'completed') {
      throw new Error('Game already completed.');
    }
    if (!this.snapshot.currentRoundYinPlayerId || this.snapshot.currentRoundResolved) {
      throw new Error('No round in progress.');
    }
    return this.snapshot.currentRoundYinPlayerId;
  }
}
