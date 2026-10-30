import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { root } from './sdk-archive.mjs';

// The connector icons are the SDK's selected SAGA dragon files, used unchanged. Their digests are
// those recorded in the SDK's assets/brand/plugin/README.md; a replacement is a deliberate change
// to this table and to the SDK's, never an edit of the files here.

const expected = {
  'composer-icon-light.png':
    'b4bad3c7c3ff6baec188c69ac60f622c03c81b12d5aa6a4c9a4ca8f27c136912',
  'composer-icon-dark.png':
    '7609a165f30649cb6a06d5711da4b9e57918671b07bf9fbc9ec8f9a227969cab',
  'logo-light.png':
    '622ac01fb4ef89a81f8e17671bc8f299aabb1fd9c00439939bccbcd4ef685a1c',
  'logo-dark.png':
    '1c5d3adb66e8661fde7e3c37633fb459cca7eb19c0d1c2058271cda2ba08ca8e',
};

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
