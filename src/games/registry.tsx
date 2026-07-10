import type { GameTypeDefinition } from './uiTypes';
import { yinEngine } from './yin';
import { RoundEntry as YinRoundEntry } from './yin/RoundEntry';
import { exampleEngine } from './example';
import { RoundEntry as ExampleRoundEntry } from './example/RoundEntry';

const yinGameType: GameTypeDefinition = {
  id: yinEngine.gameTypeId,
  nameKey: 'gameTypes.yin.name',
  descriptionKey: 'gameTypes.yin.description',
  engine: yinEngine,
  RoundEntry: YinRoundEntry,
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
  ...(import.meta.env.DEV ? [exampleGameType] : []),
];

export function getGameTypeDefinition(id: string): GameTypeDefinition | undefined {
  return gameTypeDefinitions.find((def) => def.id === id);
}
