import { createMcpFetchApp } from '@saga-a2ui/react-mcp-stack/server/http';
import {
  createGameServer,
  prepareBoardViews,
} from '../game/server/operations.js';
import { brandIcons, MCP_PATH, readSettings, type Settings } from './config.js';
import { createDurableGameStore } from './game-store.js';
import { GameObject } from './game-object.js';
import { VIEW_HTML } from '../generated/view-html.js';

// The Worker's composition root: the SDK's Fetch entry, the staged game's operations and view,
// and the Durable Object store. The game's rules and view are the pinned SDK source; everything
// that is specific to this deployment is in config.ts and wrangler.jsonc.

export { GameObject };

interface Env {
  readonly GAMES: DurableObjectNamespace<GameObject>;
  readonly ALLOWED_HOSTS?: string;
  readonly PUBLIC_ORIGIN?: string;
}

const views = prepareBoardViews(VIEW_HTML);

function createApp(env: Env, settings: Settings) {
  const store = createDurableGameStore(env.GAMES);
  const icons = brandIcons(settings.publicOrigin).map((icon) => ({
    ...icon,
    sizes: [...icon.sizes],
  }));
  return createMcpFetchApp({
    path: MCP_PATH,
    allowedHosts: [...settings.allowedHosts],
    allowedOrigins: [...settings.allowedHosts],
    createServer: (lifetime) =>
      createGameServer({ views, store, lifetime, icons }),
  });
}

let app: ReturnType<typeof createApp> | undefined;

export default {
  fetch(request: Request, env: Env): Promise<Response> | Response {
    app ??= createApp(env, readSettings(env));
    return app.fetch(request);
  },
};
