import './brand.css';

// Tells the dragon which theme the host uses. The SDK's view connects to the host itself and does
// not expose the host's context, so this only watches the same messages the host posts to the
// card: the answer to the opening handshake and any later change. It sends nothing, and it
// trusts only the window that embeds the card.

type Theme = 'light' | 'dark';

/** The theme a host message states, if it states one. */
export function themeFromHostMessage(data: unknown): Theme | undefined {
  const message = data as {
    method?: unknown;
    params?: { theme?: unknown };
    result?: { hostContext?: { theme?: unknown } };
  } | null;
  const theme =
    message?.method === 'ui/notifications/host-context-changed'
      ? message.params?.theme
      : message?.result?.hostContext?.theme;
  return theme === 'light' || theme === 'dark' ? theme : undefined;
}

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window.parent) return;
  const theme = themeFromHostMessage(event.data);
  if (theme !== undefined)
    document.documentElement.setAttribute('data-host-theme', theme);
});
