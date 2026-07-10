import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Player } from '../domain/models/Player';
import { UserService } from '../domain/services/UserService';
import { GameService } from '../domain/services/GameService';

interface UsersContextValue {
  users: Player[];
  loading: boolean;
  error: string | null;
  addUser: (name: string) => Promise<Player>;
  removeUser: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const UsersContext = createContext<UsersContextValue | null>(null);
const userService = new UserService();
const gameService = new GameService();

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await userService.listUsers());
    } catch {
      setError('common.error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addUser = useCallback(async (name: string) => {
    const user = await userService.createUser(name);
    setUsers((prev) => [...prev, user]);
    return user;
  }, []);

  const removeUser = useCallback(async (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    await userService.removeUser(id);
    // In-progress games can't continue without this player; completed games
    // keep the player's name baked in and stay as history.
    await gameService.deleteInProgressGamesForPlayer(id);
  }, []);

  return (
    <UsersContext.Provider value={{ users, loading, error, addUser, removeUser, refresh }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers(): UsersContextValue {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsers must be used within a UsersProvider');
  return ctx;
}
