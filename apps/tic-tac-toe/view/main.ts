import '@saga-a2ui/react-mcp-stack/attribution.css';
import '../../../.stage/game/src/index.css';
import { startView } from '../../../.stage/game/src/view.js';
import { showHostTheme } from './brand.js';

// The card's entry. It does what the pinned SDK game's own entry does (the same styles, then the
// game's canonical `startView`, the one owner of the view) and adds one thing: the dragon above the
// game learns the host's theme through the typed `hostContext` callback `startView` accepts.
await startView({ hostContext: showHostTheme });
