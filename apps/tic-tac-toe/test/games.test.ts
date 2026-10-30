import { env } from 'cloudflare:workers';
import { evictDurableObject } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  call,
  connect,
  newGame,
  objectFor,
  playMove,
  send,
  stored,
  type Game,
  type Move,
} from './support.js';

// The four operations and the game's behavior, through the Worker's own MCP entry in the Workers
// runtime. The rules themselves are the SDK's and are tested there; these tests check that the
// hosted composition preserves the contracts, refusals and atomic move check.

afterEach(() => vi.useRealTimers());

describe('the operations', () => {
  it('declares new_game, show_game, get_game and play_move, with the board for the first two', async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    const views = Object.fromEntries(
      tools.map((tool) => [
        tool.name,
        (tool._meta as { ui?: { resourceUri?: string } } | undefined)?.ui
          ?.resourceUri,
      ]),
    );
    expect(Object.keys(views).sort()).toEqual([
      'get_game',
      'new_game',
      'play_move',
      'show_game',
    ]);
    expect(views.new_game).toMatch(/^ui:\/\/views\/new-game\./);
    expect(views.show_game).toMatch(/^ui:\/\/views\/show-game\./);
    expect(views.get_game).toBeUndefined();
    expect(views.play_move).toBeUndefined();
    await client.close();
  });

  it('plays a game to a win, with the assistant and the person reaching the same play_move', async () => {
    const client = await connect();
    const game = await newGame(client);
    expect(game).toMatchObject({
      board: Array(9).fill(null),
      turn: 'X',
      moveNumber: 0,
      status: 'playing',
    });
    const squares = [0, 3, 1, 4, 2];
    let last!: Move;
    for (const [number, square] of squares.entries())
      last = await playMove(
        client,
        game.gameId,
        number % 2 === 0 ? 'X' : 'O',
        square,
        number,
      );
    expect(last.game).toMatchObject({
      status: 'won',
      winner: 'X',
      line: [0, 1, 2],
    });
    const read = await call<{ game: Game }>(client, 'get_game', {
      gameId: game.gameId,
    });
    expect(read.data!.game).toEqual(last.game);
    await client.close();
  });

  it('refuses a wrong turn, a taken square, an old board and a finished game with no effect', async () => {
    const client = await connect();
    const { gameId } = await newGame(client);
    const afterX = (await playMove(client, gameId, 'X', 4, 0)).game;
    for (const [player, square, expected, reason] of [
      ['X', 0, 1, 'not_your_turn'],
      ['O', 4, 1, 'occupied'],
      ['O', 0, 0, 'stale_move'],
    ] as const) {
      const refused = await playMove(client, gameId, player, square, expected);
      expect(refused).toMatchObject({ outcome: 'refused', reason });
      expect(refused.game).toEqual(afterX);
    }
    const won = await newGame(client);
    for (const [number, square] of [0, 3, 1, 4, 2].entries())
      await playMove(
        client,
        won.gameId,
        number % 2 === 0 ? 'X' : 'O',
        square,
        number,
      );
    expect(await playMove(client, won.gameId, 'O', 8, 5)).toMatchObject({
      outcome: 'refused',
      reason: 'game_over',
    });
    await client.close();
  });

  it('lets only one of two competing moves for the same move number advance the board', async () => {
    const client = await connect();
    const { gameId } = await newGame(client);
    await playMove(client, gameId, 'X', 4, 0);
    const [a, b] = await Promise.all([
      playMove(client, gameId, 'O', 0, 1),
      playMove(client, gameId, 'O', 8, 1),
    ]);
    const outcomes = [a.outcome, b.outcome].sort();
    expect(outcomes).toEqual(['played', 'refused']);
    const refused = a.outcome === 'refused' ? a : b;
    const played = a.outcome === 'played' ? a : b;
    expect(refused.reason).toBe('stale_move');
    expect(refused.game).toEqual(played.game);
    const final = (await call<{ game: Game }>(client, 'get_game', { gameId }))
      .data!.game;
    expect(final.moveNumber).toBe(2);
    expect(final.history).toHaveLength(2);
    await client.close();
  });

  it('keeps a game when its object is evicted and recreated', async () => {
    const client = await connect();
    const { gameId } = await newGame(client);
    await playMove(client, gameId, 'X', 4, 0);
    const before = (await call<{ game: Game }>(client, 'get_game', { gameId }))
      .data!.game;
    await evictDurableObject(objectFor(gameId));
    const after = (await call<{ game: Game }>(client, 'get_game', { gameId }))
      .data!.game;
    expect(after).toEqual(before);
    expect(await playMove(client, gameId, 'O', 0, 1)).toMatchObject({
      outcome: 'played',
    });
    await client.close();
  });

  it('issues a fresh unguessable identifier only from new_game', async () => {
    const client = await connect();
    const ids = new Set<string>();
    for (let at = 0; at < 20; at += 1) ids.add((await newGame(client)).gameId);
    expect(ids.size).toBe(20);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{22}$/);
    // Reading, showing and playing a name nobody issued reports it unavailable and creates nothing.
    const unissued = 'AAAAAAAAAAAAAAAAAAAAAA';
    for (const [name, args] of [
      ['get_game', { gameId: unissued }],
      ['show_game', { gameId: unissued }],
      [
        'play_move',
        { gameId: unissued, player: 'X', square: 0, expectedMoveNumber: 0 },
      ],
    ] as const) {
      const result = await call(client, name, args);
      expect(result.result.isError, name).toBe(true);
    }
    expect(await stored(unissued)).toEqual({ tables: [], alarm: null });
    await client.close();
  });
});

describe('the connector surface', () => {
  it('announces the dragon icons for light and dark, at the public origin', async () => {
    const client = await connect();
    const icons = client.getServerVersion()?.icons ?? [];
    expect(
      icons.map((icon) => `${icon.theme}:${icon.sizes?.[0]}`).sort(),
    ).toEqual(['dark:128x128', 'dark:512x512', 'light:128x128', 'light:512x512']);
    expect(icons.map((icon) => icon.src.replace(env.PUBLIC_ORIGIN, '')).sort()).toEqual([
      '/tic-tac-toe/icons/composer-icon-dark.png',
      '/tic-tac-toe/icons/composer-icon-light.png',
      '/tic-tac-toe/icons/logo-dark.png',
      '/tic-tac-toe/icons/logo-light.png',
    ]);
    for (const icon of icons) expect(icon.mimeType).toBe('image/png');
    await client.close();
  });

  it('serves a board that carries the credit and the exact catalog identifier', async () => {
    const client = await connect();
    const { resources } = await client.listResources();
    expect(resources).toHaveLength(2);
    const view = await client.readResource({ uri: resources[0]!.uri });
    const html = JSON.stringify(view.contents);
    expect(html).toContain('https://saga-a2ui.dev/catalogs/tic-tac-toe/board/v1');
    expect(html).not.toContain('tic-tac-toe.example');
    expect(html).toContain('https://saga-ai.dev/');
    expect(html).toContain('saga a2ui');
    await client.close();
  });

  it('answers only the exact route, and only for the configured host', async () => {
    const mcpHeaders = {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    };
    const list = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    });
    for (const path of ['/mcp', '/tic-tac-toe/mcp/', '/tic-tac-toe', '/']) {
      const response = await send(`https://examples.saga-ai.dev${path}`, {
        method: 'POST',
        headers: mcpHeaders,
        body: list,
      });
      expect([path, response.status]).toEqual([path, 404]);
    }
    const foreign = await send('https://evil.example/tic-tac-toe/mcp', {
      method: 'POST',
      headers: mcpHeaders,
      body: list,
    });
    expect(foreign.status).toBe(403);
    const origin = await send(
      'https://examples.saga-ai.dev/tic-tac-toe/mcp',
      {
        method: 'POST',
        headers: { ...mcpHeaders, origin: 'https://evil.example' },
        body: list,
      },
    );
    expect(origin.status).toBe(403);
  });
});
