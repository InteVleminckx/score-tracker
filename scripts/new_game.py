#!/usr/bin/env python3
"""Scaffold a new game type for the score tracker.

Creates src/games/<id>/ with a working starter engine (state.ts, actions.ts,
engine.ts, RoundEntry.tsx, index.ts) copied from the same shape as
games/example/, wires it into src/games/engines.ts and
src/games/registry.tsx, and adds placeholder i18n keys to en.json/nl.json.

The generated game is a real, playable single-action round-robin scorer from
the moment the script finishes — npm run dev will show it on the home page
immediately. Edit the TODOs in state.ts/actions.ts/RoundEntry.tsx to replace
the starter rules with your actual game logic; everything else (players,
history, undo/redo, theming, i18n, Firestore sync) is already wired up and
needs no further changes.

Usage:
    python3 scripts/new_game.py <game-id> ["Display Name"]

Example:
    python3 scripts/new_game.py dice-duel "Dice Duel"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GAMES_DIR = ROOT / "src" / "games"
ENGINES_FILE = GAMES_DIR / "engines.ts"
REGISTRY_FILE = GAMES_DIR / "registry.tsx"
EN_JSON = ROOT / "src" / "i18n" / "en.json"
NL_JSON = ROOT / "src" / "i18n" / "nl.json"

ID_PATTERN = re.compile(r"[a-z][a-z0-9-]*")


def kebab_to_pascal(game_id: str) -> str:
    return "".join(part.capitalize() for part in game_id.split("-"))


def title_case(game_id: str) -> str:
    return " ".join(part.capitalize() for part in game_id.split("-"))


def insert_after_last_import(text: str, import_line: str) -> str:
    """Insert `import_line` right after the file's leading block of import statements."""
    lines = text.split("\n")
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import_idx = i
        elif last_import_idx != -1 and line.strip() != "":
            break
    lines.insert(last_import_idx + 1, import_line)
    return "\n".join(lines)


def insert_before(text: str, marker: str, insertion: str) -> str:
    idx = text.index(marker)
    return text[:idx] + insertion + text[idx:]


# --- file templates -------------------------------------------------------


def state_ts(prefix: str) -> str:
    return f"""import type {{ GameStatus }} from '../types';

export interface {prefix}GameState {{
  scores: Record<string, number>;
  enteredThisRound: string[];
  status: GameStatus;
  loserId: string | null;
}}

// TODO: tune this to your game's rules, or replace the elimination check in
// actions.ts entirely with whatever "the game ends" means for your game.
export const ELIMINATION_THRESHOLD = 30;

export function initial{prefix}State(playerIds: string[]): {prefix}GameState {{
  const scores: Record<string, number> = {{}};
  for (const id of playerIds) scores[id] = 0;
  return {{ scores, enteredThisRound: [], status: 'in_progress', loserId: null }};
}}
"""


def actions_ts(prefix: str, game_id: str) -> str:
    return f"""import type {{ GameAction }} from '../types';
import {{ ELIMINATION_THRESHOLD, type {prefix}GameState }} from './state';

export type Serialized{prefix}Action = {{
  type: 'ADD_POINTS';
  roundNumber: number;
  playerId: string;
  points: number;
}};

export function deserialize{prefix}Action(data: Record<string, unknown>): GameAction {{
  const typed = data as Serialized{prefix}Action;
  if (typed.type === 'ADD_POINTS') {{
    return new AddPointsAction(typed.roundNumber, typed.playerId, typed.points);
  }}
  throw new Error(`Unknown {game_id} action type: ${{String(typed.type)}}`);
}}

// TODO: this is a starter template (copied from games/example) — one
// action, round-robin entry, "highest score above threshold loses". Replace
// with your actual rules. See games/yin/actions.ts for a richer example
// with multiple action types (round start, quick-lose, point entry).
export class AddPointsAction implements GameAction {{
  readonly type = 'ADD_POINTS';
  readonly roundNumber: number;
  readonly playerId: string;
  readonly points: number;

  constructor(roundNumber: number, playerId: string, points: number) {{
    this.roundNumber = roundNumber;
    this.playerId = playerId;
    this.points = points;
  }}

  apply(state: {prefix}GameState): {prefix}GameState {{
    if (state.status === 'completed') {{
      throw new Error('Game already completed.');
    }}
    if (state.enteredThisRound.includes(this.playerId)) {{
      throw new Error(`Player ${{this.playerId}} already entered this round.`);
    }}

    const scores = {{
      ...state.scores,
      [this.playerId]: state.scores[this.playerId] + this.points,
    }};
    const enteredThisRound = [...state.enteredThisRound, this.playerId];
    const allPlayerIds = Object.keys(state.scores);
    const roundComplete = allPlayerIds.every((id) => enteredThisRound.includes(id));

    if (!roundComplete) {{
      return {{ ...state, scores, enteredThisRound }};
    }}

    const eliminated = allPlayerIds.filter((id) => scores[id] > ELIMINATION_THRESHOLD);
    if (eliminated.length > 0) {{
      const loserId = eliminated.reduce((highestId, id) =>
        scores[id] > scores[highestId] ? id : highestId,
      );
      return {{ scores, enteredThisRound: [], status: 'completed', loserId }};
    }}
    return {{ scores, enteredThisRound: [], status: 'in_progress', loserId: null }};
  }}

  toJSON(): Serialized{prefix}Action {{
    return {{
      type: 'ADD_POINTS',
      roundNumber: this.roundNumber,
      playerId: this.playerId,
      points: this.points,
    }};
  }}
}}
"""


def engine_ts(prefix: str, camel: str, game_id: str) -> str:
    return f"""import type {{ GameEngine, GameSummary }} from '../types';
import {{ ELIMINATION_THRESHOLD, initial{prefix}State, type {prefix}GameState }} from './state';
import {{ deserialize{prefix}Action }} from './actions';

export const {camel}Engine: GameEngine = {{
  gameTypeId: '{game_id}',

  initialState(playerIds: string[]): {prefix}GameState {{
    return initial{prefix}State(playerIds);
  }},

  deserializeAction: deserialize{prefix}Action,

  summarize(rawState: unknown, playerIds: string[]): GameSummary {{
    const state = rawState as {prefix}GameState;
    return {{
      status: state.status,
      loserId: state.loserId,
      roundResolved: state.enteredThisRound.length === 0,
      leaderboard: playerIds.map((id) => ({{
        playerId: id,
        score: state.scores[id],
        badgeKey: state.scores[id] > ELIMINATION_THRESHOLD ? 'leaderboard.eliminated' : undefined,
      }})),
    }};
  }},
}};
"""


def round_entry_tsx(prefix: str) -> str:
    return f"""import {{ useGame }} from '../../contexts/GameContext';
import {{ useI18n }} from '../../i18n/I18nContext';
import {{ NumberEntryForm }} from '../../components/NumberEntryForm';
import {{ AddPointsAction }} from './actions';
import type {{ {prefix}GameState }} from './state';
import type {{ RoundEntryProps }} from '../uiTypes';

// TODO: this starter flow just steps through every player once per round
// asking for a number (copied from games/example). Replace with whatever UI
// your game's rules need. See games/yin/RoundEntry.tsx for a richer example
// (player picker -> win/lose branch -> point entry).
export function RoundEntry({{ players }}: RoundEntryProps) {{
  const {{ t }} = useI18n();
  const {{ rawState, dispatch }} = useGame();

  if (!rawState) return null;
  const state = rawState as {prefix}GameState;
  if (state.status === 'completed') return null;

  const currentId = players.map((p) => p.id).find((id) => !state.enteredThisRound.includes(id));
  if (!currentId) return null; // round just resolved; next render shows the fresh state

  const name = players.find((p) => p.id === currentId)?.name ?? currentId;

  return (
    <NumberEntryForm
      label={{t('round.enterPointsFor', {{ name }})}}
      onSubmit={{(points) => void dispatch(new AddPointsAction(0, currentId, points))}}
    />
  );
}}
"""


def index_ts(camel: str) -> str:
    return f"export {{ {camel}Engine }} from './engine';\n"


# --- registration -----------------------------------------------------------


def register_in_engines(camel: str, game_id: str) -> None:
    text = ENGINES_FILE.read_text()
    import_line = f"import {{ {camel}Engine }} from './{game_id}';"
    if import_line in text:
        sys.exit(f"error: '{game_id}' is already registered in {ENGINES_FILE}")

    text = insert_after_last_import(text, import_line)
    entry_line = f"  [{camel}Engine.gameTypeId]: {camel}Engine,\n"
    text = insert_before(text, "};", entry_line)
    ENGINES_FILE.write_text(text)


def register_in_registry(camel: str, game_id: str, prefix: str) -> None:
    text = REGISTRY_FILE.read_text()
    engine_import = f"import {{ {camel}Engine }} from './{game_id}';"
    if engine_import in text:
        sys.exit(f"error: '{game_id}' is already registered in {REGISTRY_FILE}")

    round_entry_import = f"import {{ RoundEntry as {prefix}RoundEntry }} from './{game_id}/RoundEntry';"
    text = insert_after_last_import(text, engine_import)
    text = insert_after_last_import(text, round_entry_import)

    definition_block = f"""
const {camel}GameType: GameTypeDefinition = {{
  id: {camel}Engine.gameTypeId,
  nameKey: 'gameTypes.{game_id}.name',
  descriptionKey: 'gameTypes.{game_id}.description',
  engine: {camel}Engine,
  RoundEntry: {prefix}RoundEntry,
}};
"""
    text = insert_before(text, "\n/**\n * The UI-facing list", definition_block)

    dev_only_marker = "  ...(import.meta.env.DEV"
    array_entry = f"  {camel}GameType,\n"
    if dev_only_marker in text:
        text = insert_before(text, dev_only_marker, array_entry)
    else:
        text = insert_before(text, "\n];", "\n" + array_entry.rstrip("\n"))

    REGISTRY_FILE.write_text(text)


def add_i18n_keys(game_id: str, display_name: str) -> None:
    for path in (EN_JSON, NL_JSON):
        data = json.loads(path.read_text())
        name_key = f"gameTypes.{game_id}.name"
        description_key = f"gameTypes.{game_id}.description"
        if name_key in data:
            continue  # already present (re-run after a partial failure) — don't clobber
        data[name_key] = display_name
        data[description_key] = "TODO: describe this game."
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


# --- main --------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Scaffold a new game type under src/games/<id>/.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("game_id", help="kebab-case id, e.g. 'dice-duel'")
    parser.add_argument(
        "display_name", nargs="?", help="Human-readable name (defaults to Title Case of the id)"
    )
    args = parser.parse_args()

    game_id = args.game_id.strip().lower()
    if not ID_PATTERN.fullmatch(game_id):
        sys.exit(f"error: game id must be lowercase kebab-case (letters, digits, hyphens): {args.game_id!r}")

    game_dir = GAMES_DIR / game_id
    if game_dir.exists():
        sys.exit(f"error: {game_dir} already exists")

    engines_text = ENGINES_FILE.read_text()
    prefix = kebab_to_pascal(game_id)
    camel = prefix[0].lower() + prefix[1:]
    if f"'./{game_id}'" in engines_text:
        sys.exit(f"error: '{game_id}' is already registered in {ENGINES_FILE}")

    display_name = args.display_name or title_case(game_id)

    game_dir.mkdir(parents=True)
    (game_dir / "state.ts").write_text(state_ts(prefix))
    (game_dir / "actions.ts").write_text(actions_ts(prefix, game_id))
    (game_dir / "engine.ts").write_text(engine_ts(prefix, camel, game_id))
    (game_dir / "RoundEntry.tsx").write_text(round_entry_tsx(prefix))
    (game_dir / "index.ts").write_text(index_ts(camel))

    register_in_engines(camel, game_id)
    register_in_registry(camel, game_id, prefix)
    add_i18n_keys(game_id, display_name)

    rel = game_dir.relative_to(ROOT)
    print(f"Scaffolded '{game_id}' in {rel}/ and wired it into engines.ts, registry.tsx, en.json, nl.json.")
    print()
    print("It's already live and playable (npm run dev / npm run build both show it on the home page).")
    print("Next steps:")
    print(f"  1. Implement your actual rules in {rel}/state.ts, actions.ts, engine.ts")
    print(f"     (currently a working starter: one action, round-robin entry, score > {30} loses).")
    print(f"  2. Adjust {rel}/RoundEntry.tsx if the round-robin flow doesn't match your game.")
    print(f"  3. Fill in gameTypes.{game_id}.description in src/i18n/en.json and nl.json")
    print(f"     (name defaults to \"{display_name}\" in both — edit if you want it translated).")
    print("  4. If this should be dev-only for now, wrap its entry in registry.tsx's array in")
    print("     `...(import.meta.env.DEV ? [...] : [])`, same as exampleGameType.")


if __name__ == "__main__":
    main()
