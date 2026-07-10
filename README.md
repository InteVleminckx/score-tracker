# Score Tracker

A mobile-first score tracker for card and party games, played from a phone passed around the table. Players and game history are shared across every game type; scoring rules for each game live behind a small plugin interface, so adding a new game means writing only its rules and its round-entry screen.

- **Stack:** React + TypeScript + Tailwind CSS, Firestore (no auth) for storage, localStorage as an offline cache/draft buffer, deployed to GitHub Pages via GitHub Actions.
- **Languages:** English and Dutch (Dutch by default).
- **Theme:** light/dark, follows the system by default.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173/score-tracker/
```

You'll need a Firebase project with Firestore enabled and a `.env.local` with your web app config (`VITE_FIREBASE_*` — see `.env.example`). Firestore rules are open (`firestore.rules`) since there's no auth — anyone with the app URL can read/write, which is an accepted tradeoff for a private-use tracker, not an oversight.

```bash
npm run build     # tsc -b && vite build
npm run lint      # oxlint
```

Deployment is automatic on push to `main` via `.github/workflows/deploy.yml`, which needs the same `VITE_FIREBASE_*` values set as GitHub Actions secrets.

## Games

| Game | Status | Rules |
|---|---|---|
| **Yin** | Live | See below |
| **Wiezen** | Live | See below |
| **Example Game** | Dev only (hidden on GitHub Pages) | Template for building a new game type — see [Adding a new game](#adding-a-new-game) |

### Yin

A card game scored over multiple rounds. Each round has exactly one player who "yins" (ends the round):

1. **Yin wins the round:** the yin player scores 0; every other player adds up their remaining card values as points.
2. **Yin loses the round:** the yin player scores +50; everyone else scores 0.

After every round, each player's running total is checked against these thresholds, in order:

| Score reaches exactly... | Effect |
|---|---|
| 100 | Reset to 50 (and the player is now permanently flagged as "has hit 100") |
| 69 *(only if the player has previously hit exactly 100)* | Reset to 0 |
| 150 | Reset to 75 |
| **> 150** | Player is **eliminated** — the game ends immediately |

If a round pushes more than one player over 150 at once, the highest of those scores is the loser (ties broken by turn order). The eliminated/losing player is prompted to sign the loss with their finger.

Every round-entry action (each point entry, the yin/win-lose call, undo, redo) is kept as a full history — you can undo/redo step by step while a game is in progress. Once a game is completed, its history is frozen.

### Wiezen

A Dutch 4-player trick-taking game ([nl.wikipedia.org/wiki/Wiezen](https://nl.wikipedia.org/wiki/Wiezen)). Requires exactly 4 players. Instead of modeling the actual cards, the app records each hand as a scorecard entry: pick the contract, pick who's playing it, enter how many tricks the playing side took, and the point swing is computed automatically and applied zero-sum across all four players. There's no automatic end condition — a table plays as many hands as it likes and taps **End game** when done; the lowest total score at that point is the loser.

Supported contracts and their scoring (per the Wikipedia table; the wiki page doesn't document failure penalties, so a failed contract is charged the same flat amount its bare success would pay):

| Contract | Players | Needs | Points |
|---|---|---|---|
| Vragen (asking) | 2 (asker + partner) | 8+ of 13 tricks | 2, +1 per overtrick, doubled on all 13 |
| Troel | 2 (forced partnership, 3 aces) | 8+ tricks | 4, +2 per overtrick, 20 flat on all 13 |
| Troela | 2 (forced partnership, 4 aces) | 9+ tricks | same as Troel, off a 9-trick base |
| Abondance | 1 (solo, own trump) | tricks bid (9-13) | 4 / 7 / 8 / 9 / 10 for a bid of 9 / 10 / 11 / 12 / 13 |
| Misère | 1 (solo, no trump) | exactly 0 tricks | 7 |
| Misère op tafel | 1 (solo, cards face-up) | exactly 0 tricks | 14 |
| Solo | 1 (solo, own trump) | all 13 tricks | 25 per opponent (75 total) |
| Solo-slim | 1 (solo, dealt trump) | all 13 tricks | 30 per opponent (90 total) |

For 2-player contracts, both players on the winning side gain the listed points from both players on the losing side. For solo contracts, the soloist gains 3× the listed points, split as a loss of the listed amount from each of the three opponents. These point values reflect one common table for this game — if your table plays different house rules, they're centralized in `src/games/wiezen/contracts.ts`.

## Architecture

- `src/domain/` — framework-agnostic core shared by every game: `Player`, the event-sourced `Game` aggregate (undo/redo, action log replay), Firestore repositories, and services (`GameService`, `UserService`, `LocalCacheService` for the offline buffer).
- `src/games/` — one folder per game type (`yin/`, `wiezen/`, `example/`), each implementing the same small `GameEngine` interface (`initialState`, `deserializeAction`, `summarize`) plus its own `RoundEntry` UI component. `engines.ts` (pure logic) and `registry.tsx` (UI, dev-only games filtered out here) are the only two files that need to know a new game type exists.
- `src/components/`, `src/pages/`, `src/contexts/` — generic UI/state that every game type shares: leaderboard, history, undo/redo, player management, theming, i18n.

### Adding a new game

```bash
python3 scripts/new_game.py <game-id> ["Display Name"]
# e.g. python3 scripts/new_game.py dice-duel "Dice Duel"
```

This scaffolds `src/games/<game-id>/` with a working starter engine (one action, round-robin point entry, "highest score above a threshold loses") and wires it into `engines.ts`, `registry.tsx`, and both `i18n/*.json` files automatically — nothing else needs to change. It's live and playable immediately; from there, replace the starter rules in `state.ts`/`actions.ts`/`engine.ts` with your actual scoring logic (see `games/yin/` for a richer example with multiple action types), and adjust `RoundEntry.tsx` if the round-robin flow doesn't fit.
