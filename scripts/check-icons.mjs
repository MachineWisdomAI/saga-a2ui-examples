import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ICON_DIGESTS as expected } from './icon-digests.mjs';
import { root } from './sdk-archive.mjs';

// Checks that the dragon icon files are the SDK's selected artwork, byte for byte. The digests
// are in icon-digests.mjs.

const directory = path.join(
  root,
  'apps/tic-tac-toe/public/tic-tac-toe/icons',
);
const present = fs.readdirSync(directory).sort();
if (JSON.stringify(present) !== JSON.stringify(Object.keys(expected).sort()))
  throw new Error(`Unexpected icon files: ${present.join(', ')}`);
for (const [file, digest] of Object.entries(expected)) {
  const actual = createHash('sha256')
    .update(fs.readFileSync(path.join(directory, file)))
    .digest('hex');
  if (actual !== digest) throw new Error(`${file} is ${actual}, not ${digest}.`);
}
console.log(`The ${present.length} dragon icons match the SDK's recorded digests.`);
