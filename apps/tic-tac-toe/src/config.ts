// Application settings: the bindings and variables from wrangler.jsonc, turned into the values
// the Worker composes with. Nothing here belongs to the SDK's delivery code or the game's rules.

/** The one exact route the game answers on. */
export const MCP_PATH = '/tic-tac-toe/mcp';

/** The directory, under the public origin, that serves the connector icons. */
const ICON_PATH = '/tic-tac-toe/icons';

export interface Settings {
  /** Host names (no scheme or port) accepted in the Host header and, with the same names, the Origin header. */
  readonly allowedHosts: readonly string[];
  /** The origin the icon files are announced from. */
  readonly publicOrigin: string;
}

export interface SettingsBindings {
  readonly ALLOWED_HOSTS?: string;
  readonly PUBLIC_ORIGIN?: string;
}

/** Reads the settings once; a missing or malformed value fails before any request is served. */
export function readSettings(bindings: SettingsBindings): Settings {
  const allowedHosts = (bindings.ALLOWED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter((host) => host !== '');
  if (allowedHosts.length === 0)
    throw new Error('ALLOWED_HOSTS must name at least one host.');
  let origin: URL;
  try {
    origin = new URL(bindings.PUBLIC_ORIGIN ?? '');
  } catch {
    throw new Error('PUBLIC_ORIGIN must be an absolute URL.');
  }
  if (origin.protocol !== 'https:' || origin.pathname !== '/')
    throw new Error('PUBLIC_ORIGIN must be an https origin with no path.');
  if (!allowedHosts.includes(origin.hostname))
    throw new Error('PUBLIC_ORIGIN must be one of the ALLOWED_HOSTS.');
  return { allowedHosts, publicOrigin: origin.origin };
}

/** What a host reads about the connector's icons: the saga dragon, light and dark. */
export interface BrandIcon {
  readonly src: string;
  readonly mimeType: 'image/png';
  readonly sizes: readonly string[];
  readonly theme: 'light' | 'dark';
}

/** The four unchanged dragon files in public/tic-tac-toe/icons, as the server announces them. */
export function brandIcons(publicOrigin: string): BrandIcon[] {
  const icon = (
    file: string,
    size: number,
    theme: BrandIcon['theme'],
  ): BrandIcon => ({
    src: `${publicOrigin}${ICON_PATH}/${file}`,
    mimeType: 'image/png',
    sizes: [`${size}x${size}`],
    theme,
  });
  return [
    icon('composer-icon-light.png', 128, 'light'),
    icon('composer-icon-dark.png', 128, 'dark'),
    icon('logo-light.png', 512, 'light'),
    icon('logo-dark.png', 512, 'dark'),
  ];
}
