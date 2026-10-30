# saga-a2ui-examples

Hosted SAGA A2UI example applications and Claude plugin marketplace.

## Tic Tac Toe (`apps/tic-tac-toe`)

A game of tic-tac-toe between a person (X) and an AI assistant (O), served as a Cloudflare Worker at `https://examples.saga-ai.dev/tic-tac-toe/mcp`. It offers four MCP tools: `new_game`, `show_game`, `get_game` and `play_move`. Games need no account and keep no transcript; anyone holding a game's unguessable ID can play either side.

### Use the hosted game

The game runs at **`https://examples.saga-ai.dev/tic-tac-toe/mcp`**. It needs no account or sign-in. What it stores, and for how long, is in [data handling](docs/tic-tac-toe-data-handling.md). Both hosts need access to custom MCP connections on the web; a managed workspace may need an administrator to enable it.

**Claude, through the marketplace.** In Claude Code, add this repository's marketplace and install the plugin, which adds the endpoint above and a short skill:

```text
/plugin marketplace add MachineWisdomAI/saga-a2ui-examples
/plugin install saga-tic-tac-toe@saga-a2ui-examples
```

The marketplace is [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json); the plugin is [`plugins/saga-tic-tac-toe`](plugins/saga-tic-tac-toe). Its `.claude-plugin/plugin.json` and `.mcp.json` are the files `saga publish prepare --target claude` produces from [`saga-publication.json`](saga-publication.json); no second packager is used. The plugin is not a Claude Desktop extension, and installing it in Claude Code is not a claim about Claude on the web, which uses the direct setup below.

**Claude on the web, direct URL.** Open **Customize → Connectors → Add custom connector**, name it **SAGA Tic Tac Toe**, enter the endpoint, and choose **No sign-in** when offered. Connect it, enable it from the connectors menu in a new chat and ask Claude to start a game.

**ChatGPT on the web, direct URL.** Open **Plugins → + → Add custom MCP server**, name it **SAGA Tic Tac Toe**, enter the endpoint, and choose **No authentication**. Add and connect it, then select it in a new chat and ask to start a game. This is manual custom-MCP setup; directory approval is not required and is not claimed.

What has been observed on the hosts (a record of limits, not a guarantee):

- Claude on the web, with the direct connector: a game was played to a nine-move draw and the final card showed correctly, with the SAGA dragon and the credit, in the light and dark appearances. The first display of a card sometimes failed and recovered with the host's retry button; one card also failed to display after a turn. Claude's connector list showed a placeholder letter, not the dragon, beside the connector.
- ChatGPT on the web, with a custom plugin: the dragon uploaded for the plugin showed beside its mention and tool row, and a completed game reopened correctly in the light theme. After switching to the dark theme, an older card did not load in a reopened chat, and a new card was still loading when last observed. First-load reliability is not established on either host.
- The Claude marketplace installation itself has not yet been verified on a current Claude surface.

### Publication preparation

`saga-publication.json` is the release input for the SDK's `saga publish` tooling, with the publisher `MachineWisdom`. After `npm run build:view`, `npm run stage:publication` writes the two built view files it names (`new-game.html`, `show-game.html`) into `.stage/publication`, and the tooling, run from the pinned SDK revision, checks the live endpoint against them:

```sh
npx tsx scripts/saga.ts publish check --target chatgpt --release /path/to/saga-publication.json
npx tsx scripts/saga.ts publish check --target claude  --release /path/to/saga-publication.json
```

For this deployment the ChatGPT check is `ready`. The Claude check reports only what the Claude directory submission asks for and this repository does not hold: a review contact and carousel screenshots. They are not needed for the marketplace plugin or for direct setup, and no external directory submission is made. Checks and prepared files establish neither installation nor distribution; the registry state of the SDK packages is separate (see Release constraint).

### Where the code comes from

The game's rules, operations, contract and board view are the SDK's [tic-tac-toe example](https://github.com/MachineWisdomAI/saga-a2ui/tree/main/examples/tic-tac-toe), which remains independently runnable with npm and Vite in the [tutorial](https://github.com/MachineWisdomAI/saga-a2ui/blob/main/docs/build-tic-tac-toe-with-react.md). This repository keeps no copy of it. `sdk-source.json` pins one public SDK revision and the SHA-256 of its source archive; `npm run stage` downloads that archive at build time, checks the digest and stages the game into `.stage/game` (ignored). The Worker imports the staged files and replaces only hosting and storage. Nothing is downloaded at runtime.

| Path | Owns |
| --- | --- |
| `.stage/game` | The pinned SDK game source (generated, not committed). |
| `apps/tic-tac-toe/src/worker.ts` | Composition: the SDK's `createMcpFetchApp`, the staged operations and view, the store. |
| `apps/tic-tac-toe/src/game-object.ts` | One SQLite-backed Durable Object per game, its fixed 24-hour expiry and alarm cleanup. |
| `apps/tic-tac-toe/src/game-store.ts` | The game's `GameStore` seam over those objects. |
| `apps/tic-tac-toe/src/config.ts`, `wrangler.jsonc` | Bindings, route, allowed hosts and connector icons: this deployment's settings, separate from SDK delivery code. |
| `apps/tic-tac-toe/view` | The card's page: the dragon above the staged game, started through the game's own `startView`. The dragon follows the host's theme, which `startView` hands over through the stack's typed `hostContext` callback; nothing here reads host messages. |
| `apps/tic-tac-toe/public/tic-tac-toe/icons` | The SDK's selected dragon artwork, light and dark, unchanged (digests in `scripts/icon-digests.mjs`, checked by `npm run check`). The connector announces all four files; the card embeds the two small ones. |

### Behavior

- A game lives in one Durable Object. Its state survives the object being evicted and recreated.
- Creation stores the expiry, **creation plus 24 hours**, and schedules one cleanup alarm for it. Reads, moves, polling and cold starts never move it.
- At or after the expiry every operation reports the game unavailable, even if the alarm is late. The alarm deletes all storage and the alarm itself without any visitor; running cleanup again is harmless and an expired or never-issued ID is never recreated. Only `new_game` creates an ID.
- A move names `expectedMoveNumber`; the check and write happen in one synchronous step in the game's object, so of two competing moves only one is played and the other is refused with the current game.
- The card shows the SAGA dragon (light or dark to match the host's theme, the SDK's file unchanged and embedded in the page) and the removable "Built with saga a2ui" credit (linked to `https://saga-ai.dev/` through the host) during play, after the game and beside recoverable errors. Its catalog and layout identifier is `https://saga-a2ui.dev/catalogs/tic-tac-toe/board/v1`, a name that is never fetched.

### Commands

```sh
npm run check        # icon digests, types, Workers-runtime tests, rendered-card tests, Worker build (dry run)
npm run test:browser # only the rendered-card tests (needs Chromium: npx playwright install chromium)
npm run stage        # stage the pinned SDK game source
npm run pin:update -- <40-character SDK commit>   # move the pin, then review sdk-source.json and package.json
```

Worker tests run in the real Workers runtime (`workerd`, through the Cloudflare Vitest plugin). They advance the clock, deliver the alarm and check storage directly. The rendered-card tests open the built page in Chromium behind a stand-in host and check the dragon (and its bytes), the credit and the status in the playing, completed and recoverable-error states, in both themes. They are not evidence about any particular host. Nothing is deployed.

### Updating the SDK pin

1. Run `npm run pin:update -- <commit>`. It records the commit and the archive digest.
2. Set `sdkVersion` in `sdk-source.json` and the dependency versions in `package.json` to the ones in the staged game's `package.json`; `npm run stage` fails and lists any disagreement.
3. Run `npm run check` and commit the changed files.

### Release constraint

The game needs `@saga-a2ui/react-mcp-stack` `0.11.0-rc.1`, which is **not yet published to the npm registry** (the `latest` and `next` tags predate its exports). Until it is, `npm run qualify:sdk` installs the five SDK packages packed from the pinned revision; CI does the same. That is local qualification, not registry consumption. After publication, replace that step with `npm ci` and commit a lockfile.

### Deployment

Deploying is a separate, deliberate step; changing the marketplace or documentation deploys nothing. `wrangler.jsonc` declares the Custom Domain route `examples.saga-ai.dev` (Cloudflare provisions DNS and TLS) and the Worker answers only the exact path `/tic-tac-toe/mcp` plus its icon files. Deploying, host checks and marketplace installation are separate steps.
