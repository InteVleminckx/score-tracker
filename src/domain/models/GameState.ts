import { ScoreEngine, type PlayerRoundState } from './ScoreEngine';

export type GameStatus = 'in_progress' | 'completed';

interface GameStateSnapshot {
  playerStates: Record<string, PlayerRoundState>;
  currentRoundNumber: number;
  currentRoundYinPlayerId: string | null;
  currentRoundEnteredPlayerIds: string[];
  currentRoundResolved: boolean;
  status: GameStatus;
  loserId: string | null;
}

/** Immutable value object: the derived state of a game at a point in its action log. */
export class GameState {
  private readonly snapshot: GameStateSnapshot;

  private constructor(snapshot: GameStateSnapshot) {
    this.snapshot = snapshot;
  }

  static initial(playerIds: string[]): GameState {
    const playerStates: Record<string, PlayerRoundState> = {};
    for (const id of playerIds) {
      playerStates[id] = { score: 0, hasHit100: false, eliminated: false };
    }
    return new GameState({
      playerStates,
      currentRoundNumber: 0,
      currentRoundYinPlayerId: null,
      currentRoundEnteredPlayerIds: [],
      currentRoundResolved: true,
      status: 'in_progress',
      loserId: null,
    });
  }

  get playerStates(): Record<string, PlayerRoundState> {
    return this.snapshot.playerStates;
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

  startRound(roundNumber: number, yinPlayerId: string): GameState {
    if (this.snapshot.status === 'completed') {
      throw new Error('Cannot start a round: game already completed.');
    }
    if (!this.snapshot.currentRoundResolved) {
      throw new Error('Cannot start a new round before the current one is resolved.');
    }
    return new GameState({
      ...this.snapshot,
      currentRoundNumber: roundNumber,
      currentRoundYinPlayerId: yinPlayerId,
      currentRoundEnteredPlayerIds: [],
      currentRoundResolved: false,
    });
  }

  resolveYinLost(): GameState {
    const yinId = this.requireCurrentYinPlayer();
    const playerStates = { ...this.snapshot.playerStates };
    for (const id of Object.keys(playerStates)) {
      playerStates[id] = ScoreEngine.applyRoundPoints(playerStates[id], id === yinId ? 50 : 0);
    }
    return this.resolveRound(playerStates, this.snapshot.currentRoundEnteredPlayerIds);
  }

  enterPoints(playerId: string, points: number): GameState {
    const yinId = this.requireCurrentYinPlayer();
    if (playerId === yinId) {
      throw new Error('The yin player is scored automatically; do not enter points for them directly.');
    }
    if (this.snapshot.currentRoundEnteredPlayerIds.includes(playerId)) {
      throw new Error(`Player ${playerId} already has an entry for this round.`);
    }

    const playerStates: Record<string, PlayerRoundState> = {
      ...this.snapshot.playerStates,
      [playerId]: ScoreEngine.applyRoundPoints(this.snapshot.playerStates[playerId], points),
    };
    const enteredPlayerIds = [...this.snapshot.currentRoundEnteredPlayerIds, playerId];

    const allPlayerIds = Object.keys(this.snapshot.playerStates);
    const remainingNonYin = allPlayerIds.filter(
      (id) => id !== yinId && !enteredPlayerIds.includes(id),
    );

    if (remainingNonYin.length > 0) {
      return new GameState({
        ...this.snapshot,
        playerStates,
        currentRoundEnteredPlayerIds: enteredPlayerIds,
      });
    }

    // Last non-yin entry for this round: yin player is implicitly scored 0.
    playerStates[yinId] = ScoreEngine.applyRoundPoints(playerStates[yinId], 0);
    return this.resolveRound(playerStates, enteredPlayerIds);
  }

  private resolveRound(
    playerStates: Record<string, PlayerRoundState>,
    enteredPlayerIds: string[],
  ): GameState {
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

    return new GameState({
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
