import { runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  call,
  connect,
  HOUR,
  newGame,
  objectFor,
  playMove,
  stored,
  type Game,
} from './support.js';

// Expiry and cleanup: a game lives exactly 24 hours from its creation, whatever happens to it, and
// its object removes everything when the alarm arrives, with no visitor involved.

const START = Date.UTC(2026, 9, 30, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(START);
});
afterEach(() => vi.useRealTimers());

const unavailable = async (
  client: Awaited<ReturnType<typeof connect>>,
  gameId: string,
) => {
  for (const [name, args] of [
    ['get_game', { gameId }],
    ['show_game', { gameId }],
    [
      'play_move',
      { gameId, player: 'X', square: 8, expectedMoveNumber: 0 },
    ],
  ] as const) {
    const result = await call(client, name, args);
    expect(result.result.isError, name).toBe(true);
  }
};

describe('a game that expires 24 hours after it was created', () => {
  it('persists the creation-plus-24-hour deadline and schedules one cleanup alarm for it', async () => {
    const client = await connect();
    const { gameId } = await newGame(client);
    expect(await stored(gameId)).toEqual({
      tables: ['game'],
      alarm: START + 24 * HOUR,
    });
    await client.close();
  });

  it('is never extended by reads, moves, polling or a cold start', async () => {
    const client = await connect();
    const { gameId } = await newGame(client);
    const deadline = START + 24 * HOUR;

    vi.setSystemTime(START + 6 * HOUR);
    await call(client, 'get_game', { gameId });
    await call(client, 'show_game', { gameId });
    await playMove(client, gameId, 'X', 4, 0);
    vi.setSystemTime(START + 12 * HOUR);
    const { evictDurableObject } = await import('cloudflare:test');
    await evictDurableObject(objectFor(gameId)); // a cold start
    await call(client, 'get_game', { gameId });
    vi.setSystemTime(START + 23 * HOUR + 59 * 60 * 1000);
    expect(await playMove(client, gameId, 'O', 0, 1)).toMatchObject({
      outcome: 'played',
    });

    expect((await stored(gameId)).alarm).toBe(deadline);
    const expiry = await runInDurableObject(
      objectFor(gameId),
      (_instance, state) =>
        state.storage.sql
          .exec<{ expires_at: number }>('SELECT expires_at FROM game')
          .one().expires_at,
    );
    expect(expiry).toBe(deadline);

    // The moment of expiry: the game is gone for every operation, though the alarm has not run.
    vi.setSystemTime(deadline);
    await unavailable(client, gameId);
    expect((await stored(gameId)).tables).toEqual(['game']);
    await client.close();
  });

  it('is available one millisecond before the deadline and unavailable at it', async () => {
    const client = await connect();
    const { gameId } = await newGame(client);
    vi.setSystemTime(START + 24 * HOUR - 1);
    const live = await call<{ game: Game }>(client, 'get_game', { gameId });
    expect(live.data!.game.gameId).toBe(gameId);
    vi.setSystemTime(START + 24 * HOUR);
    await unavailable(client, gameId);
    await client.close();
  });

  it('is deleted entirely when the alarm is delivered, without anyone returning', async () => {
    const client = await connect();
    const { gameId } = await newGame(client);
    await playMove(client, gameId, 'X', 4, 0);
    vi.setSystemTime(START + 24 * HOUR + 7 * 60 * 1000); // a late alarm

    expect(await runDurableObjectAlarm(objectFor(gameId))).toBe(true);

    // Inspect storage directly: the game's own operations are not called.
    expect(await stored(gameId)).toEqual({ tables: [], alarm: null });
    await client.close();
  });

  it('can be cleaned up again, and cleanup never brings a game back', async () => {
    const client = await connect();
    const { gameId } = await newGame(client);
    vi.setSystemTime(START + 24 * HOUR);
    expect(await runDurableObjectAlarm(objectFor(gameId))).toBe(true);
    // No alarm is left to run; running the cleanup itself a second time is also harmless.
    expect(await runDurableObjectAlarm(objectFor(gameId))).toBe(false);
    await runInDurableObject(objectFor(gameId), (instance) =>
      instance.alarm(),
    );
    expect(await stored(gameId)).toEqual({ tables: [], alarm: null });

    // Nothing can recreate it: reads, boards and moves report it unavailable and store nothing.
    await unavailable(client, gameId);
    expect(await stored(gameId)).toEqual({ tables: [], alarm: null });
    await client.close();
  });

  it('leaves a game alone when its alarm is delivered before the deadline', async () => {
    const client = await connect();
    const { gameId } = await newGame(client);
    vi.setSystemTime(START + HOUR);
    await runDurableObjectAlarm(objectFor(gameId));
    const live = await call<{ game: Game }>(client, 'get_game', { gameId });
    expect(live.data!.game.gameId).toBe(gameId);
    expect(await stored(gameId)).toEqual({
      tables: ['game'],
      alarm: START + 24 * HOUR,
    });
    await client.close();
  });

  it('removes only the expired game', async () => {
    const client = await connect();
    const first = await newGame(client);
    vi.setSystemTime(START + HOUR);
    const second = await newGame(client);
    vi.setSystemTime(START + 24 * HOUR);
    await runDurableObjectAlarm(objectFor(first.gameId));
    expect(await stored(first.gameId)).toEqual({ tables: [], alarm: null });
    expect(
      (await call<{ game: Game }>(client, 'get_game', { gameId: second.gameId }))
        .data!.game.gameId,
    ).toBe(second.gameId);
    await client.close();
  });
});
