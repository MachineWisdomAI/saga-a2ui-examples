import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { ICON_DIGESTS } from '../../../scripts/icon-digests.mjs';
import { TEXT } from '../game/src/contract.js';

// The built card as a person sees it: the exact HTML the Worker serves, in a real browser, behind
// a stand-in for an MCP Apps host. The host answers the card's handshake with a theme, delivers
// tool results and answers `get_game`. This is evidence about the card's own rendering, not about
// any particular host application.
//
// The card is mounted under the MCP Apps default policy (no network, images only from the page
// itself or `data:`), which is what the server publishes for this closed view.

const VIEW_HTML = fs.readFileSync(
  path.join(import.meta.dirname, '../../../.stage/view/index.html'),
  'utf8',
);

const POLICY =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'none'";

const HOST_PAGE = `<!doctype html><html><body><iframe id="card" style="width:480px;height:640px;border:0"></iframe>
<script>
  const card = document.getElementById('card');
  const hostContext = { theme: new URLSearchParams(location.search).get('theme') };
  const game = JSON.parse(decodeURIComponent(new URLSearchParams(location.search).get('game') || 'null'));
  const send = (message) => card.contentWindow.postMessage({ jsonrpc: '2.0', ...message }, '*');
  window.openedLinks = [];
  window.addEventListener('message', (event) => {
    if (event.source !== card.contentWindow) return;
    const { id, method } = event.data;
    if (id === undefined) {
      if (method === 'ui/notifications/initialized') window.hostReady = true;
      return;
    }
    if (method === 'ui/initialize')
      send({ id, result: { protocolVersion: '2026-01-26', hostInfo: { name: 'test-host', version: '0.0.0' }, hostCapabilities: { serverTools: {}, openLinks: {} }, hostContext } });
    else if (method === 'tools/call' && game)
      send({ id, result: { content: [], structuredContent: { game } } });
    else if (method === 'ui/open-link') {
      window.openedLinks.push(event.data.params.url);
      send({ id, result: {} });
    }
    else send({ id, result: {} });
  });
  window.deliver = (params) => send({ method: 'ui/notifications/tool-result', params });
  window.changeTheme = (theme) => send({ method: 'ui/notifications/host-context-changed', params: { theme } });
  card.srcdoc = ${JSON.stringify(VIEW_HTML).replace(/</g, '\\u003c')};
</script></body></html>`;

const GAME_ID = 'AbCdEfGhIjKlMnOp';
const playing = {
  gameId: GAME_ID,
  board: ['X', null, null, null, 'O', null, null, null, null],
  turn: 'X',
  moveNumber: 2,
  status: 'playing',
  winner: null,
  line: null,
  history: [
    { player: 'X', square: 0 },
    { player: 'O', square: 4 },
  ],
} as const;
const won = {
  gameId: GAME_ID,
  board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
  turn: 'O',
  moveNumber: 5,
  status: 'won',
  winner: 'X',
  line: [0, 1, 2],
  history: [
    { player: 'X', square: 0 },
    { player: 'O', square: 3 },
    { player: 'X', square: 1 },
    { player: 'O', square: 4 },
    { player: 'X', square: 2 },
  ],
} as const;

const asResult = (game: unknown) => ({
  content: [{ type: 'text', text: 'game' }],
  structuredContent: { game },
});
const results = {
  playing: asResult(playing),
  completed: asResult(won),
  'recoverable error (game gone)': {
    isError: true,
    content: [{ type: 'text', text: TEXT.noGame }],
  },
  'recoverable error (unreadable result)': {
    isError: true,
    content: [{ type: 'text', text: 'something else' }],
  },
};
const games: Record<string, unknown> = { playing, completed: won };

async function openCard(
  page: Page,
  theme: 'light' | 'dark',
  state: keyof typeof results,
): Promise<FrameLocator> {
  await page.route('https://host.test/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      headers: { 'content-security-policy': POLICY },
      body: HOST_PAGE,
    }),
  );
  const game = games[state];
  await page.goto(
    `https://host.test/?theme=${theme}${game === undefined ? '' : `&game=${encodeURIComponent(JSON.stringify(game))}`}`,
  );
  await page.waitForFunction(() => (window as any).hostReady === true);
  await page.evaluate(
    (params) => (window as any).deliver(params),
    results[state],
  );
  return page.frameLocator('#card');
}

const digestOfImage = (backgroundImage: string): string => {
  const match = /^url\("data:image\/png;base64,([^"]+)"\)$/.exec(
    backgroundImage,
  );
  expect(match, `a data: PNG, got ${backgroundImage.slice(0, 60)}`).not.toBe(
    null,
  );
  return createHash('sha256')
    .update(Buffer.from(match![1]!, 'base64'))
    .digest('hex');
};

const mark = (card: FrameLocator) => card.locator('.brand-mark');
const shownDigest = async (card: FrameLocator) =>
  digestOfImage(
    await mark(card).evaluate((el) => getComputedStyle(el).backgroundImage),
  );

const states = Object.keys(results) as (keyof typeof results)[];
const themes = ['light', 'dark'] as const;

for (const theme of themes)
  for (const state of states)
    test(`shows the ${theme} dragon and the credit: ${state}`, async ({
      page,
    }) => {
      const card = await openCard(page, theme, state);
      await expect(card.locator('.credit')).toHaveText(
        'Built with saga-a2ui, learn how to build your Saga.',
      );
      await expect(mark(card)).toBeVisible();
      const box = (await mark(card).boundingBox())!;
      expect(box.width).toBeGreaterThan(16);
      expect(box.height).toBeGreaterThan(16);
      await expect(mark(card)).toHaveAttribute('aria-label', 'saga dragon');
      // The bytes on screen are the SDK's selected file for the host theme, unchanged.
      expect(await shownDigest(card)).toBe(
        ICON_DIGESTS[`composer-icon-${theme}.png`],
      );
    });

test('the playing card names saga a2ui in its credit and says whose turn it is', async ({
  page,
}) => {
  const card = await openCard(page, 'light', 'playing');
  await expect(card.locator('.credit')).toHaveText(
    'Built with saga-a2ui, learn how to build your Saga.',
  );
  await expect(card.locator('.status')).toHaveText('Your move. You are X.');
});

test('the completed card still reports the result', async ({ page }) => {
  const card = await openCard(page, 'dark', 'completed');
  await expect(card.locator('.status')).toHaveText('You won!');
});

test('the dragon follows a later change of the host theme', async ({
  page,
}) => {
  const card = await openCard(page, 'light', 'playing');
  expect(await shownDigest(card)).toBe(ICON_DIGESTS['composer-icon-light.png']);
  await page.evaluate(() => (window as any).changeTheme('dark'));
  await expect
    .poll(() => shownDigest(card))
    .toBe(ICON_DIGESTS['composer-icon-dark.png']);
  await page.evaluate(() => (window as any).changeTheme('light'));
  await expect
    .poll(() => shownDigest(card))
    .toBe(ICON_DIGESTS['composer-icon-light.png']);
});

test('the host theme outranks the viewer preference', async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  const card = await openCard(page, 'light', 'playing');
  expect(await shownDigest(card)).toBe(ICON_DIGESTS['composer-icon-light.png']);
  await context.close();
});

test('the card does not fetch anything from the catalog name or any other site', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  const card = await openCard(page, 'dark', 'playing');
  await expect(mark(card)).toBeVisible();
  expect(
    requests.filter(
      (url) => !url.startsWith('https://host.test/') && !url.startsWith('data:'),
    ),
  ).toEqual([]);
});

for (const theme of themes)
  test(`the ${theme} credit opens the website and tutorial through the host`, async ({
    page,
  }) => {
    const card = await openCard(page, theme, 'playing');
    await page.locator('#card').evaluate((frame) => {
      frame.style.width = '320px';
    });
    await expect(card.locator('.credit')).toBeVisible();
    expect(await card.locator('html').evaluate((root) =>
      root.scrollWidth <= root.clientWidth,
    )).toBe(true);
    await card.getByRole('button', { name: 'saga-a2ui', exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as any).openedLinks))
      .toEqual(['https://saga-ai.dev/']);
    await card.getByRole('button', {
      name: 'how to build your Saga', exact: true,
    }).click();
    await expect.poll(() => page.evaluate(() => (window as any).openedLinks))
      .toEqual([
        'https://saga-ai.dev/',
        'https://docs.saga-a2ui.dev/docs/releases/0.11.0-rc.1/guides/build-tic-tac-toe-with-react',
      ]);
    await expect(card.locator('.credit')).toHaveText(
      'Built with saga-a2ui, learn how to build your Saga.',
    );
  });
