// The bindings declared in wrangler.jsonc, for `cloudflare:workers` and `cloudflare:test`.
declare namespace Cloudflare {
  interface Env {
    GAMES: DurableObjectNamespace<import('./src/game-object.js').GameObject>;
    ALLOWED_HOSTS: string;
    PUBLIC_ORIGIN: string;
  }
}
