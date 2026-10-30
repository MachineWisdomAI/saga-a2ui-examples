import { GameSchema, type Game } from '../game/src/contract.js';
import type {
  GameStore,
  PlayResult,
} from '../game/server/game-store.js';
import type { GameObject } from './game-object.js';

// The game's store seam (GameStore) over Durable Objects: one object per game, addressed by the
// game's identifier. Only `create` mints an identifier; `get` and `play` address an object but never
// create one, so an unknown or expired identifier stays unknown. What an object returns crosses an
// RPC boundary, so it is read back through the contract's schema rather than trusted by type.

/** 128 random bits, the same shape the tutorial's in-memory store issues. */
const newGameId = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
};

export function createDurableGameStore(
  games: DurableObjectNamespace<GameObject>,
): GameStore {
  const objectFor = (gameId: string) => games.get(games.idFromName(gameId));
  return {
    async create() {
      const gameId = newGameId();
      return GameSchema.parse(await objectFor(gameId).create(gameId));
    },
    async get(gameId) {
      const game = await objectFor(gameId).get();
      return game === undefined ? undefined : GameSchema.parse(game);
    },
    async play(gameId, move): Promise<PlayResult> {
      const result = await objectFor(gameId).play(move);
      if (result.kind === 'unknown') return { kind: 'unknown' };
      const game: Game = GameSchema.parse(result.game);
      return result.kind === 'played'
        ? { kind: 'played', game }
        : { kind: 'refused', reason: result.reason, game };
    },
  };
}
