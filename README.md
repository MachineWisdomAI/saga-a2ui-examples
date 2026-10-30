# saga-a2ui-examples

Example apps built with saga a2ui — interactive experiences inside AI assistants and agents, with source code and connection instructions. saga means **Simple Agentic Apps**.

| Resource | Destination |
| --- | --- |
| Framework website | https://saga-ai.dev/ |
| SDK source | https://github.com/MachineWisdomAI/saga-a2ui |
| Game source | [apps/tic-tac-toe/game](apps/tic-tac-toe/game) |
| Tutorial | [Build tic-tac-toe with React](https://github.com/MachineWisdomAI/saga-a2ui/blob/main/docs/build-tic-tac-toe-with-react.md) |
| MCP endpoint | https://examples.saga-ai.dev/tic-tac-toe/mcp |

The game credits the framework through **Built with saga a2ui**, linking to the framework website. The website's GitHub destination is the SDK repository; this repository owns the application.

## Tic Tac Toe (`apps/tic-tac-toe`)

A game of tic-tac-toe between a person (X) and an AI assistant (O), served as a Cloudflare Worker at `https://examples.saga-ai.dev/tic-tac-toe/mcp`. It offers four MCP tools: `new_game`, `show_game`, `get_game` and `play_move`. Games need no account and keep no transcript; anyone holding a game's unguessable ID can play either side.

### Use the hosted game

The game runs at **`https://examples.saga-ai.dev/tic-tac-toe/mcp`**. It needs no account or sign-in. What it stores, and for how long, is in [data handling](docs/tic-tac-toe-data-handling.md). Both hosts need access to custom MCP connections on the web; a managed workspace may need an administrator to enable it.

**Claude, through the marketplace.** On Claude on the web, open **Customize → Plugins → Add plugin → Add marketplace → Add from a repository**, enter `MachineWisdomAI/saga-a2ui-examples` (a GitHub owner/repo or a Git URL) and choose **Sync**, then install **saga-tic-tac-toe**. In Claude Code, the equivalent commands are:

```text
/plugin marketplace add MachineWisdomAI/saga-a2ui-examples
/plugin install saga-tic-tac-toe@saga-a2ui-examples
```

Installing adds the endpoint above and a short skill. The marketplace is [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json); the plugin is [`plugins/saga-tic-tac-toe`](plugins/saga-tic-tac-toe). Its `.claude-plugin/plugin.json` and `.mcp.json` are the files `saga publish prepare --target claude` produces from [`saga-publication.json`](saga-publication.json); no second packager is used. The plugin is not a Claude Desktop extension.

**Claude on the web, direct URL.** Open **Customize → Connectors → Add custom connector**, name it **saga Tic Tac Toe**, enter the endpoint, and choose **No sign-in** when offered. Connect it, enable it from the connectors menu in a new chat and ask Claude to start a game.

**ChatGPT on the web, direct URL.** Open **Plugins → + → Add custom MCP server**, name it **saga Tic Tac Toe**, enter the endpoint, and choose **No authentication**. Add and connect it, then select it in a new chat and ask to start a game. This is manual custom-MCP setup; directory approval is not required and is not claimed.

What has been observed on the hosts (a record of limits, not a guarantee). The first four observations below were made with the first edition of the dragon artwork; the fifth records the second edition, now deployed:

- Claude on the web, with the direct connector: a game was played to a nine-move draw and the final card showed correctly, with the saga dragon and the credit, in the light and dark appearances. The first display of a card sometimes failed and recovered with the host's retry button; one card also failed to display after a turn. A click on the board puts the person's move in the message box, and **Send** is then required. Claude's connector list showed a placeholder letter, not the dragon, beside the connector.
- ChatGPT on the web, with a custom plugin using the uploaded dragon: the dragon showed in the card and, separately, beside the plugin mention and tool row in both themes, and a completed game reopened correctly. A card in the dark theme timed out once and one **Try again** recovered it; a click on the board then sent the person's move automatically, the assistant played O, and the card updated. An older card did not load in a chat reopened after switching theme.
- Claude on the web, through this marketplace: adding the marketplace from the repository (the path above), choosing **Sync** and adding the plugin worked, and the **saga-tic-tac-toe** `0.1.0` plugin was enabled, so the marketplace is not limited to Claude Desktop. Its Connectors tab listed **SAGA Tic Tac Toe** (historical label, before the lowercase naming correction) as connected and custom; the existing connection for the same endpoint was reused. Using the plugin's namespaced skill in a chat started a game with `new_game`. The first card failed to display and one **Retry** recovered an interactive board. A click on the centre square then **Send** put the person's X in, Claude played O in the top-left, and the same card updated with the credit and the selected dragon. The connector row there still showed the placeholder letter. This was checked on the web only, not in Claude Code or Claude Desktop.
- ChatGPT on the web: a game was played to a nine-move draw, and the completed game's card (`show_game`) first failed to display and recovered with one **Retry**, showing the final board correctly.
- Second edition of the artwork, deployed as Worker version `e89a6cb8-ee7b-4d6d-812d-3d9f84f6b8f6` from commit `9403b8fde7f7b1490029e51238f502d83ea3756a`: in both the Claude and the ChatGPT web hosts the card displayed the new embedded light and dark PNGs, and their hashes matched the ones in `scripts/icon-digests.mjs`, each after one supported **Retry** of the card. This does not mean every connector icon changed: Claude's connector row still shows the placeholder letter, and the existing ChatGPT plugin keeps the dragon uploaded earlier, because it was uploaded to that host and no supported way to replace it was found. Only the card and the files this Worker serves carry the new artwork.
- First-load and reload reliability is not established on either host: on both, a card has sometimes needed one retry before it displayed. Retry has so far recovered it, and no cause in the game has been identified.

### Publication preparation

`saga-publication.json` is the release input for the SDK's `saga publish` tooling, with the publisher `Machine Wisdom`. After `npm run build:view`, `npm run stage:publication` writes the two built view files it names (`new-game.html`, `show-game.html`) into `.stage/publication`, and the tooling, run from the SDK revision in `publication-tool.json`, checks the live endpoint against them:

```sh
npx tsx scripts/saga.ts publish check --target chatgpt --release /path/to/saga-publication.json
npx tsx scripts/saga.ts publish check --target claude  --release /path/to/saga-publication.json
```

For this deployment the ChatGPT check is `ready`. The Claude check reports only what the Claude directory submission asks for and this repository does not hold: a review contact and carousel screenshots. They are not needed for the marketplace plugin or for direct setup, and no external directory submission is made. Checks and prepared files establish neither installation nor distribution; the SDK packages come from the npm registry (see Installing dependencies).

### Where the code comes from

This repository owns the complete game in [`apps/tic-tac-toe/game`](apps/tic-tac-toe/game). Local Node development and the hosted Worker use the same rules, operations, contract and board view. The Worker supplies its durable store through the game's existing `GameStore` interface. Builds do not download SDK repository source; SDK packages come from npm.

| Path | Owns |
| --- | --- |
| `apps/tic-tac-toe/game` | Canonical game, local Node server, Vite build and guided move-list patch. |
| `apps/tic-tac-toe/src` | Worker composition and Durable Object storage with fixed 24-hour expiry and cleanup. |
| `apps/tic-tac-toe/view` | Hosted page shell, theme-aware dragon and startup of the same game view. |
| `apps/tic-tac-toe/public/tic-tac-toe/icons` | Unchanged SDK-selected dragon artwork, verified by recorded digests. |
| `publication-tool.json` | SDK CLI revision used only for publication preparation. |

### Run locally

From this repository's root, with Node 22.23.3 or newer and npm 11 or newer:

```sh
npm ci
npm run build:local
npm run start:local
```

This builds the local game with Vite and starts its Node MCP server. Its bounded in-memory store retains the tutorial's local behavior; the hosted Worker uses persistent storage. Follow the [tutorial](https://github.com/MachineWisdomAI/saga-a2ui/blob/main/docs/build-tic-tac-toe-with-react.md) for connection instructions and the full npm/Vite walkthrough.

### Behavior

- A game lives in one Durable Object. Its state survives the object being evicted and recreated.
- Creation stores the expiry, **creation plus 24 hours**, and schedules one cleanup alarm for it. Reads, moves, polling and cold starts never move it.
- At or after the expiry every operation reports the game unavailable, even if the alarm is late. The alarm deletes all storage and the alarm itself without any visitor; running cleanup again is harmless and an expired or never-issued ID is never recreated. Only `new_game` creates an ID.
- A move names `expectedMoveNumber`; the check and write happen in one synchronous step in the game's object, so of two competing moves only one is played and the other is refused with the current game.
- The card shows the saga dragon (light or dark to match the host's theme, the SDK's file unchanged and embedded in the page) and the removable "Built with saga a2ui" credit (linked to `https://saga-ai.dev/` through the host) during play, after the game and beside recoverable errors. Its catalog and layout identifier is `https://saga-a2ui.dev/catalogs/tic-tac-toe/board/v1`, a name that is never fetched.

### Commands

```sh
npm run check        # icon digests, types, Workers-runtime tests, rendered-card tests, Worker build (dry run)
npm run test:browser # only the rendered-card tests (needs Chromium: npx playwright install chromium)
npm run test:game    # game rules and local-store behavior
npm run build:local  # build the local Node application with Vite
```

Worker tests run in the real Workers runtime (`workerd`, through the Cloudflare Vitest plugin). They advance the clock, deliver the alarm and check storage directly. The rendered-card tests open the built page in Chromium behind a stand-in host and check the dragon (and its bytes), the credit and the status in the playing, completed and recoverable-error states, in both themes. They are not evidence about any particular host. Nothing is deployed.

### Installing dependencies

Set up with `npm ci`, which installs from the npm registry and the committed `package-lock.json`; CI does the same. The game needs `@saga-a2ui/react-mcp-stack` `0.11.0-rc.1`, published under the registry's `next` tag (the `latest` tag is still an earlier release and is not what this repository uses). The lockfile resolves the five SDK packages the application uses (`core`, `components`, `mcp`, `react` and `react-mcp-stack`) to that exact version from the registry, with their integrity hashes. No local tarball, file path or `--legacy-peer-deps` is involved.

Update SDK dependencies in the root and game manifests together and regenerate the root lockfile. The tutorial in the SDK repository pins an examples revision for reproducible source and snippet qualification; it does not own a second game implementation.

The lockfile is generated with npm 11 or newer: the npm 10 bundled with Node 22 fails to resolve this dependency tree when it creates a lockfile from nothing, though it installs from an existing lockfile with `npm ci`.

### Deployment

Deploying is a separate, deliberate step; changing the marketplace or documentation deploys nothing. `wrangler.jsonc` declares the Custom Domain route `examples.saga-ai.dev` (Cloudflare provisions DNS and TLS) and the Worker answers only the exact path `/tic-tac-toe/mcp` plus its icon files. Deploying, host checks and marketplace installation are separate steps.
