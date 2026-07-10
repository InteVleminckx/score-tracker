import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Player } from '../domain/models/Player';
import { UserService } from '../domain/services/UserService';

interface UsersContextValue {
  users: Player[];
  loading: boolean;
  error: string | null;
  addUser: (name: string) => Promise<Player>;
  refresh: () => Promise<void>;
}

const UsersContext = createContext<UsersContextValue | null>(null);
const userService = new UserService();

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

  return (
    <UsersContext.Provider value={{ users, loading, error, addUser, refresh }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers(): UsersContextValue {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsers must be used within a UsersProvider');
  return ctx;
}
