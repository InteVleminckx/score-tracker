import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Game } from '../domain/models/Game';
import { GameState } from '../domain/models/GameState';
import { GameService } from '../domain/services/GameService';

interface GameMeta {
  id: string;
  playerIds: string[];
  canUndo: boolean;
  canRedo: boolean;
  loserSignature: string | null;
}

interface GameContextValue {
  meta: GameMeta | null;
  state: GameState | null;
  loading: boolean;
  error: string | null;
  syncing: boolean;
  createGame: (playerIds: string[]) => Promise<string>;
  loadGame: (id: string) => Promise<void>;
  startRound: (yinPlayerId: string) => Promise<void>;
  recordYinLost: () => Promise<void>;
  recordPoints: (playerId: string, points: number) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  saveLoserSignature: (dataUrl: string) => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);
const gameService = new GameService();

export function GameProvider({ children }: { children: ReactNode }) {
  const gameRef = useRef<Game | null>(null);
  const [meta, setMeta] = useState<GameMeta | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    setState(g.getCurrentState());
    setMeta({
      id: g.id,
      playerIds: g.playerIds,
      canUndo: g.canUndo(),
      canRedo: g.canRedo(),
      loserSignature: g.loserSignature,
    });
  }, []);

  const runAction = useCallback(
    async (mutate: (g: Game) => void) => {
      const g = gameRef.current;
      if (!g) return;
      mutate(g);
      sync(); // optimistic: reflect the mutation immediately
      setSyncing(true);
      try {
        await gameService.persist(g);
      } catch {
        setError('common.error'); // stays buffered locally; flushPending() retries later
      } finally {
        setSyncing(false);
      }
    },
    [sync],
  );

  const createGame = useCallback(async (playerIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const game = await gameService.createGame(playerIds);
      gameRef.current = game;
      sync();
      return game.id;
    } catch (err) {
      setError('common.error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sync]);

  const loadGame = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const game = await gameService.loadGame(id);
      gameRef.current = game;
      sync();
    } catch {
      setError('common.error');
    } finally {
      setLoading(false);
    }
  }, [sync]);

  const startRound = useCallback(
    (yinPlayerId: string) => runAction((g) => gameService.startRound(g, yinPlayerId)),
    [runAction],
  );
  const recordYinLost = useCallback(
    () => runAction((g) => gameService.recordYinLost(g)),
    [runAction],
  );
  const recordPoints = useCallback(
    (playerId: string, points: number) =>
      runAction((g) => gameService.recordPoints(g, playerId, points)),
    [runAction],
  );
  const undo = useCallback(() => runAction((g) => gameService.undo(g)), [runAction]);
  const redo = useCallback(() => runAction((g) => gameService.redo(g)), [runAction]);
  const saveLoserSignature = useCallback(
    (dataUrl: string) => runAction((g) => gameService.setLoserSignature(g, dataUrl)),
    [runAction],
  );

  const value = useMemo(
    () => ({
      meta,
      state,
      loading,
      error,
      syncing,
      createGame,
      loadGame,
      startRound,
      recordYinLost,
      recordPoints,
      undo,
      redo,
      saveLoserSignature,
    }),
    [
      meta,
      state,
      loading,
      error,
      syncing,
      createGame,
      loadGame,
      startRound,
      recordYinLost,
      recordPoints,
      undo,
      redo,
      saveLoserSignature,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
