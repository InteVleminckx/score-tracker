import { Game, type GameSnapshot } from '../models/Game';
import { Player } from '../models/Player';
import { FirestoreGameRepository, type GameRepository } from '../repositories/GameRepository';
import { LocalCacheService } from './LocalCacheService';

/**
 * Orchestrates the Game aggregate against Firestore, with a localStorage
 * offline buffer. Game-type-specific mutations (which actions to construct,
 * when) live in each game type's own RoundEntry component and are applied
 * via `Game.addAction` from `GameContext.dispatch` — this service only
 * handles identity, persistence, and lifecycle, so it's the same for every
 * game type.
 */
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

  async createGame(gameTypeId: string, players: Player[]): Promise<Game> {
    const id = crypto.randomUUID();
    const playerNames = Object.fromEntries(players.map((p) => [p.id, p.name]));
    const game = new Game({ id, gameTypeId, playerIds: players.map((p) => p.id), playerNames });
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

  async deleteGame(id: string): Promise<void> {
    await this.repo.remove(id);
    this.cache.clearPendingGame(id);
    this.cache.setCachedGames(this.cache.getCachedGames().filter((g) => g.id !== id));
  }

  /**
   * Cascades a Player removal: in-progress games referencing the player are no longer
   * playable (a scored player just vanished), so they're deleted. Completed games keep
   * their baked-in playerNames and are left untouched as a historical record.
   */
  async deleteInProgressGamesForPlayer(playerId: string): Promise<void> {
    const games = await this.listGames();
    for (const snapshot of games) {
      if (!snapshot.playerIds.includes(playerId)) continue;
      const summary = Game.fromSnapshot(snapshot).getSummary();
      if (summary.status === 'in_progress') {
        await this.deleteGame(snapshot.id);
      }
    }
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
