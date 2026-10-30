# SAGA Tic Tac Toe (Claude plugin)

Plays tic-tac-toe with you inside a Claude conversation: you click X on a board card, and Claude plays O. The plugin adds the hosted game's remote MCP server, `https://examples.saga-ai.dev/tic-tac-toe/mcp`, and a short skill that tells Claude how to play. It needs no account or sign-in with the game.

```text
/plugin marketplace add MachineWisdomAI/saga-a2ui-examples
/plugin install saga-tic-tac-toe@saga-a2ui-examples
```

Then ask Claude to start a game of tic-tac-toe.

- The server, its four tools and the board are the [Tic Tac Toe example](https://github.com/MachineWisdomAI/saga-a2ui-examples/tree/main/apps/tic-tac-toe), built with [SAGA A2UI](https://github.com/MachineWisdomAI/saga-a2ui).
- What the server stores and for how long: [data handling](https://github.com/MachineWisdomAI/saga-a2ui-examples/blob/main/docs/tic-tac-toe-data-handling.md).
- To connect without the plugin, add the same URL as a custom connector; see the [repository README](https://github.com/MachineWisdomAI/saga-a2ui-examples#use-the-hosted-game).

`.claude-plugin/plugin.json` and `.mcp.json` are the files `saga publish prepare --target claude` writes for this plugin; the README, skill and license are written here. Licensed under Apache-2.0.
