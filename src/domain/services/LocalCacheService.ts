import { Player } from '../models/Player';
import type { GameSnapshot } from '../models/Game';

const USERS_KEY = 'yin:users';
const GAMES_KEY = 'yin:games';
const gameKey = (id: string) => `yin:game:${id}`;
const pendingPrefix = 'yin:game:pending:';
const pendingKey = (id: string) => `${pendingPrefix}${id}`;

/**
 * localStorage wrapper: a read cache for fast reload (users/games lists,
 * last-loaded game) plus a per-game "pending" buffer holding actions not yet
 * confirmed written to Firestore, so an offline/failed write isn't lost.
 */
export class LocalCacheService {
  getCachedUsers(): Player[] {
    const raw = this.read<{ id: string; name: string }[]>(USERS_KEY);
    return raw?.map((u) => new Player(u.id, u.name)) ?? [];
  }

  setCachedUsers(users: Player[]): void {
    this.write(USERS_KEY, users);
  }

  getCachedGames(): GameSnapshot[] {
    return this.read<GameSnapshot[]>(GAMES_KEY) ?? [];
  }

  setCachedGames(games: GameSnapshot[]): void {
    this.write(GAMES_KEY, games);
  }

  getCachedGame(id: string): GameSnapshot | null {
    return this.read<GameSnapshot>(gameKey(id));
  }

  setCachedGame(snapshot: GameSnapshot): void {
    this.write(gameKey(snapshot.id), snapshot);
  }

  getPendingGame(id: string): GameSnapshot | null {
    return this.read<GameSnapshot>(pendingKey(id));
  }

  setPendingGame(snapshot: GameSnapshot): void {
    this.write(pendingKey(snapshot.id), snapshot);
  }

  clearPendingGame(id: string): void {
    localStorage.removeItem(pendingKey(id));
  }

  listPendingGameIds(): string[] {
    const ids: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(pendingPrefix)) {
        ids.push(key.slice(pendingPrefix.length));
      }
    }
    return ids;
  }

  private read<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private write(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
