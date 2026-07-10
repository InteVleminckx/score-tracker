import type { GameEngine } from './types';
import { yinEngine } from './yin';
import { exampleEngine } from './example';
import { wiezenEngine } from './wiezen';

/**
 * Pure logic registry — imported by the domain layer (`Game.ts`), so it must
 * stay framework-agnostic. Includes every engine unconditionally (dev-only
 * game types are filtered from the UI in `registry.tsx`, not here) so a
 * stray dev-created game's data can still be replayed/displayed everywhere,
 * even if its round-entry screen isn't shipped in production.
 */
export const gameEngines: Record<string, GameEngine> = {
  [yinEngine.gameTypeId]: yinEngine,
  [exampleEngine.gameTypeId]: exampleEngine,
  [wiezenEngine.gameTypeId]: wiezenEngine,
};

export function getEngine(gameTypeId: string): GameEngine {
  const engine = gameEngines[gameTypeId];
  if (!engine) {
    throw new Error(`Unknown game type: ${gameTypeId}`);
  }
  return engine;
}
