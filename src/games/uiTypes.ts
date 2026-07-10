import type { ComponentType } from 'react';
import type { Player } from '../domain/models/Player';
import type { GameEngine } from './types';

export interface RoundEntryProps {
  /** Players in the game's fixed counting order. */
  players: Player[];
}

export interface GameTypeDefinition {
  id: string;
  nameKey: string;
  descriptionKey?: string;
  engine: GameEngine;
  RoundEntry: ComponentType<RoundEntryProps>;
}
