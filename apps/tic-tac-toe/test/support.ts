import {
  Client,
  StreamableHTTPClientTransport,
  type CallToolResult,
} from '@modelcontextprotocol/client';
import { env } from 'cloudflare:workers';
import { runInDurableObject, SELF } from 'cloudflare:test';

// Helpers shared by the Worker tests: an MCP client that talks to the Worker through the same
// fetch entry a host would reach, and a handle on the Durable Object that holds a game.

export const ORIGIN = 'https://examples.saga-ai.dev';
export const MCP_URL = `${ORIGIN}/tic-tac-toe/mcp`;
export const HOUR = 60 * 60 * 1000;

export interface Game {
  gameId: string;
  board: (string | null)[];
  turn: 'X' | 'O';
  moveNumber: number;
  status: 'playing' | 'won' | 'draw';
  winner: string | null;
  line: number[] | null;
  history: { player: string; square: number }[];
}

export interface Move {
  game: Game;
  outcome: 'played' | 'refused';
  reason?: string;
}

/**
 * Sends a request to the Worker as a client would. The test dispatcher does not add the Host header
 * that Cloudflare's edge sends, so it is stated from the URL; a test of another host passes its own.
 */
export function send(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const url = new URL(
    input instanceof Request ? input.url : input.toString(),
  );
  const headers = new Headers(
    init.headers ?? (input instanceof Request ? input.headers : undefined),
  );
  if (!headers.has('host')) headers.set('host', url.host);
  return SELF.fetch(url, { ...init, headers });
}

export async function connect(): Promise<Client> {
  const client = new Client({ name: 'worker-test', version: '0.0.0' });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(MCP_URL), {
      fetch: (input, init) => send(input, init),
    }),
  );
  return client;
}

/** The structured result of a tool call, or the error text when the operation reported a failure. */
export async function call<T>(
  client: Client,
  name: string,
  args: Record<string, unknown> = {},
): Promise<{ data?: T; error?: string; result: CallToolResult }> {
  const result = (await client.callTool({
    name,
    arguments: args,
  })) as CallToolResult;
  if (result.isError)
    return {
      error: JSON.stringify(result.content),
      result,
    };
  return { data: result.structuredContent as T, result };
}

export const newGame = async (client: Client): Promise<Game> =>
  (await call<{ game: Game }>(client, 'new_game')).data!.game;

export const playMove = async (
  client: Client,
  gameId: string,
  player: 'X' | 'O',
  square: number,
  expectedMoveNumber: number,
): Promise<Move> =>
  (
    await call<Move>(client, 'play_move', {
      gameId,
      player,
      square,
      expectedMoveNumber,
    })
  ).data!;

/** The object that holds one game: addressed by name, never creating anything by being addressed. */
export const objectFor = (gameId: string) =>
  env.GAMES.get(env.GAMES.idFromName(gameId));

/** What a game's object holds in storage, read without going through the game's operations. */
export async function stored(gameId: string): Promise<{
  tables: string[];
  alarm: number | null;
}> {
  return runInDurableObject(objectFor(gameId), async (_instance, state) => ({
    tables: state.storage.sql
      .exec<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%'",
      )
      .toArray()
      .map((row) => row.name),
    alarm: await state.storage.getAlarm(),
  }));
}
