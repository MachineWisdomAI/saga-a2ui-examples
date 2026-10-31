# Tic Tac Toe: data handling

This describes the hosted Tic Tac Toe example at `https://examples.saga-ai.dev/tic-tac-toe/mcp`, operated by Machine Wisdom. The source that runs it is in this repository, so you can check each statement against [`apps/tic-tac-toe`](../apps/tic-tac-toe).

## What it stores

- **A game, and nothing else.** Creating a game stores its identifier, the nine squares, whose turn it is, the move number, how the game stands and the time it expires. One Cloudflare Durable Object holds each game in its own SQLite storage.
- **For 24 hours.** A game expires 24 hours after it was created. Playing, reading or reopening it never extends that. After the expiry the server reports the game unavailable, and a scheduled cleanup deletes the game's storage and the cleanup schedule itself.
- **Under an unguessable identifier.** Anyone who has a game's identifier can read it and play either side. Do not share it where you do not want others to join.

## What it does not store

- No account, sign-in, name, email address or other personal information. The game needs none, and the connector asks for no authentication.
- No conversation, prompt or transcript. The server receives only the tool calls the assistant or the board makes: start a game, show or read a game by its identifier, and play a square.
- No analytics, advertising or tracking of its own. The application writes no request log and does not use cookies.

## Who else handles a request

- **Your assistant's host (Claude or ChatGPT)** sends the tool calls and shows the board. Its handling of your conversation is governed by that host's terms and privacy policy, not by this one.
- **Cloudflare** hosts the Worker and its storage. Like any host, it processes requests (such as network addresses) to deliver and protect the service, under [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/).
- **The board** is one self-contained page: its script, styles and dragon artwork are inside it. The credit reads "Built with saga-a2ui, learn how to build your Saga." Choosing **saga-a2ui** asks the host to open `https://saga-ai.dev/`; choosing **how to build your Saga** asks it to open `https://docs.saga-a2ui.dev/docs/releases/0.11.0-rc.1/guides/build-tic-tac-toe-with-react`. Neither destination is fetched by the card itself.

## Terms of use

This is a free demonstration, provided as is and without warranty, under the [Apache License 2.0](../LICENSE). It may change or stop at any time, and its games are disposable. It is not meant for sensitive use.

## Questions

Open an issue in [this repository](https://github.com/MachineWisdomAI/saga-a2ui-examples/issues).
