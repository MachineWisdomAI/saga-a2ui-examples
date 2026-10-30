import { DurableObject } from 'cloudflare:workers';
import {
  GameSchema,
  type Game,
} from '../../../.stage/game/src/contract.js';
import { applyMove, emptyGame, type Move } from '../../../.stage/game/server/rules.js';
import type { PlayResult } from '../../../.stage/game/server/game-store.js';

// One Durable Object holds one game. Its SQLite storage has a single row: the game's state and the
// moment it expires. Expiry is fixed at creation (creation + 24 hours); no read, move or restart
// moves it. The object is single-threaded, so `play` checks the move and writes the result in one
// synchronous step: two requests naming the same expectedMoveNumber cannot both be applied.

export const GAME_LIFETIME_MS = 24 * 60 * 60 * 1000;

interface Row extends Record<string, SqlStorageValue> {
  state: string;
  expires_at: number;
}

export class GameObject extends DurableObject {
  /** The stored row, or `undefined` for an object that was never created, expired or cleaned up. */
  #live(): { game: Game; expiresAt: number } | undefined {
    const rows = this.#table()
      ? this.ctx.storage.sql.exec<Row>('SELECT state, expires_at FROM game').toArray()
      : [];
    const row = rows[0];
    if (row === undefined) return undefined;
    if (row.expires_at <= Date.now()) return undefined; // unavailable even if the alarm is late
    return {
      game: GameSchema.parse(JSON.parse(row.state)),
      expiresAt: row.expires_at,
    };
  }

  #table(): boolean {
    return (
      this.ctx.storage.sql
        .exec("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'game'")
        .toArray().length > 0
    );
  }

  /** Starts the game under `gameId`. Only `new_game` calls this, with a fresh random identifier. */
  async create(gameId: string): Promise<Game> {
    if (this.#table()) throw new Error('This game already exists.');
    const game: Game = GameSchema.parse({ gameId, ...emptyGame() });
    const expiresAt = Date.now() + GAME_LIFETIME_MS;
    this.ctx.storage.transactionSync(() => {
      this.ctx.storage.sql.exec(
        'CREATE TABLE game (state TEXT NOT NULL, expires_at INTEGER NOT NULL)',
      );
      this.ctx.storage.sql.exec(
        'INSERT INTO game (state, expires_at) VALUES (?, ?)',
        JSON.stringify(game),
        expiresAt,
      );
    });
    // Scheduled in the same turn as the row is written, so a stored game always has its cleanup.
    await this.ctx.storage.setAlarm(expiresAt);
    return game;
  }

  get(): Game | undefined {
    return this.#live()?.game;
  }

  play(move: Move): PlayResult {
    const live = this.#live();
    if (live === undefined) return { kind: 'unknown' };
    const { gameId, ...state } = live.game;
    const result = applyMove(state, move);
    if (!result.ok)
      return { kind: 'refused', reason: result.reason, game: live.game };
    const game: Game = GameSchema.parse({ gameId, ...result.state });
    // Only the state changes; expires_at is never written here.
    this.ctx.storage.sql.exec('UPDATE game SET state = ?', JSON.stringify(game));
    return { kind: 'played', game };
  }

  /** Cleanup at (or after) expiry. Safe to run again, and it never creates anything. */
  async alarm(): Promise<void> {
    // Not yet expired (an alarm delivered early): leave the game alone and try again at expiry.
    if (this.#table()) {
      const row = this.ctx.storage.sql
        .exec<Row>('SELECT state, expires_at FROM game')
        .toArray()[0];
      if (row !== undefined && row.expires_at > Date.now()) {
        await this.ctx.storage.setAlarm(row.expires_at);
        return;
      }
    }
    // The alarm first, then everything else: deleteAll leaves a scheduled alarm behind.
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }
}
