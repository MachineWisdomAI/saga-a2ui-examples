import type { StartA2uiViewOptions } from '@saga-a2ui/react-mcp-stack';
import './brand.css';

// Tells the dragon which theme the host uses. The SDK's view connects to the host and passes the
// negotiated host context to the typed `hostContext` callback of its own startup; this is that
// callback. It reads only the context the stack hands it (the handshake's answer and any later
// change), sends nothing and parses no host message itself.

/** The stack's host-context callback, as the game's `startView` accepts it. */
export const showHostTheme: NonNullable<
  StartA2uiViewOptions<unknown>['hostContext']
> = (context) => {
  const theme = context?.theme;
  if (theme === 'light' || theme === 'dark')
    document.documentElement.setAttribute('data-host-theme', theme);
};
