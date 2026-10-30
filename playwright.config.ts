import { defineConfig } from '@playwright/test';

// Rendered-card tests: the built board page in a real Chromium, driven by a small stand-in host.
// They need the page built first (`npm run test:browser` does) and a Chromium that Playwright can
// launch (`npx playwright install chromium`; CI does this).
export default defineConfig({
  testDir: 'apps/tic-tac-toe/browser',
  testMatch: '*.spec.ts',
  reporter: 'list',
  workers: 1,
  use: { browserName: 'chromium' },
});
