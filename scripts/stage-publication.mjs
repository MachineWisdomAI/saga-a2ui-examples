import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));

// Writes the build directory that `saga publish check|prepare` reads (README: "Publish
// preparation"). The Worker serves the one built board page under two view addresses,
// `new-game.html` and `show-game.html` (prepareBoardViews in the staged game); the publish
// tooling compares the served bytes with files of those names, so both are copies of the page
// `npm run build:view` built. Run after it:
//
//   npm run build:view && npm run stage:publication

const built = path.join(root, '.stage', 'view', 'index.html');
if (!fs.existsSync(built))
  throw new Error('Run `npm run build:view` first: .stage/view/index.html is missing.');

const out = path.join(root, '.stage', 'publication');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const name of ['new-game.html', 'show-game.html'])
  fs.copyFileSync(built, path.join(out, name));
console.log(`Wrote new-game.html and show-game.html to ${path.relative(root, out)}.`);
