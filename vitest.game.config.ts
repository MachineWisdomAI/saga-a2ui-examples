import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['apps/tic-tac-toe/game/test/**/*.test.ts'] },
});
