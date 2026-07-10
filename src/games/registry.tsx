import type { GameTypeDefinition } from './uiTypes';
import { yinEngine } from './yin';
import { RoundEntry as YinRoundEntry } from './yin/RoundEntry';
import { exampleEngine } from './example';
import { RoundEntry as ExampleRoundEntry } from './example/RoundEntry';
import { wiezenEngine } from './wiezen';
import { RoundEntry as WiezenRoundEntry } from './wiezen/RoundEntry';

const yinGameType: GameTypeDefinition = {
  id: yinEngine.gameTypeId,
  nameKey: 'gameTypes.yin.name',
  descriptionKey: 'gameTypes.yin.description',
  engine: yinEngine,
  RoundEntry: YinRoundEntry,
};

const wiezenGameType: GameTypeDefinition = {
  id: wiezenEngine.gameTypeId,
  nameKey: 'gameTypes.wiezen.name',
  descriptionKey: 'gameTypes.wiezen.description',
  engine: wiezenEngine,
  RoundEntry: WiezenRoundEntry,
  requiredPlayers: 4,
};

const exampleGameType: GameTypeDefinition = {
  id: exampleEngine.gameTypeId,
  nameKey: 'gameTypes.example.name',
  descriptionKey: 'gameTypes.example.description',
  engine: exampleEngine,
  RoundEntry: ExampleRoundEntry,
};

/**
 * The UI-facing list of playable game types. `import.meta.env.DEV` is
 * statically replaced with `false` by Vite in production builds, so Rollup's
 * dead-code elimination drops both this branch and the (now unreferenced)
 * example RoundEntry import from the GitHub Pages bundle entirely.
 */
export const gameTypeDefinitions: GameTypeDefinition[] = [
  yinGameType,
  wiezenGameType,
  ...(import.meta.env.DEV ? [exampleGameType] : []),
];

export function getGameTypeDefinition(id: string): GameTypeDefinition | undefined {
  return gameTypeDefinitions.find((def) => def.id === id);
}
