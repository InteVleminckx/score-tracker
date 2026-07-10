import { Player } from '../models/Player';
import { FirestoreUserRepository, type UserRepository } from '../repositories/UserRepository';
import { LocalCacheService } from './LocalCacheService';

/** Orchestrates Player lookups/creation against Firestore, with a localStorage read cache. */
export class UserService {
  private readonly repo: UserRepository;
  private readonly cache: LocalCacheService;

  constructor(
    repo: UserRepository = new FirestoreUserRepository(),
    cache: LocalCacheService = new LocalCacheService(),
  ) {
    this.repo = repo;
    this.cache = cache;
  }

  async listUsers(): Promise<Player[]> {
    try {
      const users = await this.repo.list();
      this.cache.setCachedUsers(users);
      return users;
    } catch {
      return this.cache.getCachedUsers();
    }
  }

  async createUser(name: string): Promise<Player> {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Player name cannot be empty.');
    }
    const user = await this.repo.create(trimmed);
    const users = [...this.cache.getCachedUsers(), user];
    this.cache.setCachedUsers(users);
    return user;
  }
}
