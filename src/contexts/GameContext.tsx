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
import { GameService } from '../domain/services/GameService';
import type { Player } from '../domain/models/Player';
import type { GameAction, GameSummary } from '../games/types';

interface GameMeta {
  id: string;
  gameTypeId: string;
  playerIds: string[];
  playerNames: Record<string, string>;
  canUndo: boolean;
  canRedo: boolean;
  loserSignature: string | null;
}

interface GameContextValue {
  meta: GameMeta | null;
  /** Generic status/leaderboard info — for Leaderboard, UndoRedoBar, history. */
  summary: GameSummary | null;
  /** Engine-specific state — only the paired RoundEntry component should cast this. */
  rawState: unknown;
  loading: boolean;
  error: string | null;
  syncing: boolean;
  createGame: (gameTypeId: string, players: Player[]) => Promise<string>;
  loadGame: (id: string) => Promise<void>;
  dispatch: (action: GameAction) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  saveLoserSignature: (dataUrl: string) => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);
const gameService = new GameService();

export function GameProvider({ children }: { children: ReactNode }) {
  const gameRef = useRef<Game | null>(null);
  const [meta, setMeta] = useState<GameMeta | null>(null);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [rawState, setRawState] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    setRawState(g.getRawState());
    setSummary(g.getSummary());
    setMeta({
      id: g.id,
      gameTypeId: g.gameTypeId,
      playerIds: g.playerIds,
      playerNames: g.playerNames,
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

  const createGame = useCallback(
    async (gameTypeId: string, players: Player[]) => {
      setLoading(true);
      setError(null);
      try {
        const game = await gameService.createGame(gameTypeId, players);
        gameRef.current = game;
        sync();
        return game.id;
      } catch (err) {
        setError('common.error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [sync],
  );

  const loadGame = useCallback(
    async (id: string) => {
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
    },
    [sync],
  );

  const dispatch = useCallback(
    (action: GameAction) => runAction((g) => g.addAction(action)),
    [runAction],
  );
  const undo = useCallback(() => runAction((g) => g.undo()), [runAction]);
  const redo = useCallback(() => runAction((g) => g.redo()), [runAction]);
  const saveLoserSignature = useCallback(
    (dataUrl: string) =>
      runAction((g) => {
        g.loserSignature = dataUrl;
      }),
    [runAction],
  );

  const value = useMemo(
    () => ({
      meta,
      summary,
      rawState,
      loading,
      error,
      syncing,
      createGame,
      loadGame,
      dispatch,
      undo,
      redo,
      saveLoserSignature,
    }),
    [
      meta,
      summary,
      rawState,
      loading,
      error,
      syncing,
      createGame,
      loadGame,
      dispatch,
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
