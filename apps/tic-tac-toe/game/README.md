# Tic-tac-toe

The canonical tic-tac-toe application built with saga a2ui (Simple Agentic Apps). The local Node server and the hosted Worker share these rules, operations, contracts and views. The [SDK tutorial](https://github.com/MachineWisdomAI/saga-a2ui/blob/main/docs/build-tic-tac-toe-with-react.md) explains the complete npm/Vite workflow.

## Run locally

From the repository root:

```sh
npm ci
npm run build:local
npm run start:local
```

The local server keeps a bounded in-memory store with sliding expiry. The [hosted application](../../../README.md) injects a Durable Object store with fixed 24-hour expiry. Neither needs an account.

## Source and tests

- `server/rules.ts`: pure rules, turn order, winning lines and move refusals.
- `server/game-store.ts`: store contract and local in-memory implementation.
- `server/operations.ts`: the four public MCP operations and board resources.
- `server/listener.ts` and `server/main.ts`: local Node startup.
- `src/`: contract, catalog, layout, controller, actions and view.
- `guided-change/move-list.patch`: tutorial extension applied to a disposable copy.
- `test/`: rules, store and local-server integration coverage; run `npm run test:game` from the repository root.

The SDK repository qualifies its tutorial snippets and candidate packages against a pinned revision of this application. Application changes belong here; reusable SDK changes belong in the SDK repository.
