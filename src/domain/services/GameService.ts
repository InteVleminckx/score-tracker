import { Game, type GameSnapshot } from '../models/Game';
import { StartRoundAction, YinLostAction, PointEntryAction } from '../models/GameAction';
import { FirestoreGameRepository, type GameRepository } from '../repositories/GameRepository';
import { LocalCacheService } from './LocalCacheService';

/** Orchestrates the Game aggregate against Firestore, with a localStorage offline buffer. */
export class GameService {
  private readonly repo: GameRepository;
  private readonly cache: LocalCacheService;

  constructor(
    repo: GameRepository = new FirestoreGameRepository(),
    cache: LocalCacheService = new LocalCacheService(),
  ) {
    this.repo = repo;
    this.cache = cache;
  }

  async createGame(playerIds: string[]): Promise<Game> {
    const id = crypto.randomUUID();
    const game = new Game({ id, playerIds });
    await this.persist(game);
    return game;
  }

  async loadGame(id: string): Promise<Game> {
    const pending = this.cache.getPendingGame(id);
    try {
      const remote = await this.repo.get(id);
      if (!remote) {
        if (pending) return Game.fromSnapshot(pending);
        throw new Error(`Game ${id} not found`);
      }
      if (pending && pending.updatedAt > remote.updatedAt) {
        const game = Game.fromSnapshot(pending);
        await this.persist(game); // flush the newer local draft
        return game;
      }
      this.cache.setCachedGame(remote);
      return Game.fromSnapshot(remote);
    } catch (err) {
      const fallback = pending ?? this.cache.getCachedGame(id);
      if (fallback) return Game.fromSnapshot(fallback);
      throw err;
    }
  }

  async listGames(): Promise<GameSnapshot[]> {
    try {
      const games = await this.repo.list();
      this.cache.setCachedGames(games);
      return games;
    } catch {
      return this.cache.getCachedGames();
    }
  }

  // Mutation methods are synchronous so the UI can update optimistically;
  // callers are expected to call `persist()` afterwards (see GameContext).

  startRound(game: Game, yinPlayerId: string): void {
    const roundNumber = game.getCurrentState().currentRoundNumber + 1;
    game.addAction(new StartRoundAction(roundNumber, yinPlayerId));
  }

  recordYinLost(game: Game): void {
    const roundNumber = game.getCurrentState().currentRoundNumber;
    game.addAction(new YinLostAction(roundNumber));
  }

  recordPoints(game: Game, playerId: string, points: number): void {
    const roundNumber = game.getCurrentState().currentRoundNumber;
    game.addAction(new PointEntryAction(roundNumber, playerId, points));
  }

  undo(game: Game): void {
    game.undo();
  }

  redo(game: Game): void {
    game.redo();
  }

  setLoserSignature(game: Game, dataUrl: string): void {
    game.loserSignature = dataUrl;
  }

  /** Retries any locally-buffered games that failed to sync earlier. */
  async flushPending(): Promise<void> {
    for (const id of this.cache.listPendingGameIds()) {
      const snapshot = this.cache.getPendingGame(id);
      if (!snapshot) continue;
      try {
        await this.repo.save(snapshot);
        this.cache.setCachedGame(snapshot);
        this.cache.clearPendingGame(id);
      } catch {
        // still unreachable; leave buffered for the next attempt
      }
    }
  }

  async persist(game: Game): Promise<void> {
    const snapshot = game.toSnapshot();
    this.cache.setPendingGame(snapshot);
    await this.repo.save(snapshot);
    this.cache.setCachedGame(snapshot);
    this.cache.clearPendingGame(snapshot.id);
  }
}
