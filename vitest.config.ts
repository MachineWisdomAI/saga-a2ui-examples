import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

// Runs the tests inside the real Workers runtime (workerd, through Miniflare) with the Worker's own
// bindings and Durable Object classes from its wrangler configuration.
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './apps/tic-tac-toe/wrangler.jsonc' },
    }),
  ],
  test: { include: ['apps/tic-tac-toe/test/**/*.test.ts'] },
});
