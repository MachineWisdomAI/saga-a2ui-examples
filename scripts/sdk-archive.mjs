import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

// The one place that knows how the SDK source reaches this repository: an explicit pinned public
// archive, downloaded at build time (never at runtime) and checked against the digest in
// sdk-source.json. The digest covers the decompressed tar, which `git archive` makes reproducible
// for one revision; the gzip layer is the host's and may change without changing the content.

export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
export const pinPath = path.join(root, 'sdk-source.json');
const cacheDir = path.join(root, '.cache');

export function readPin() {
  const pin = JSON.parse(fs.readFileSync(pinPath, 'utf8'));
  if (!/^[0-9a-f]{40}$/.test(pin.revision))
    throw new Error('sdk-source.json: revision must be a full 40-character commit SHA.');
  return pin;
}

export const archiveUrl = (pin) =>
  `https://github.com/${pin.repository}/archive/${pin.revision}.tar.gz`;

/** The top-level directory every member of the archive sits under. */
export const topDirectory = (pin) =>
  `${pin.repository.split('/')[1]}-${pin.revision}`;

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** The pinned archive's path in the local cache, downloaded when absent. */
export async function fetchArchive(pin, { verify = true } = {}) {
  fs.mkdirSync(cacheDir, { recursive: true });
  const file = path.join(cacheDir, `sdk-${pin.revision}.tar.gz`);
  if (!fs.existsSync(file)) {
    const response = await fetch(archiveUrl(pin));
    if (!response.ok)
      throw new Error(`Could not download ${archiveUrl(pin)}: ${response.status}`);
    fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  }
  const digest = sha256(gunzipSync(fs.readFileSync(file)));
  if (verify && digest !== pin.tarSha256) {
    fs.rmSync(file);
    throw new Error(
      `The archive for ${pin.revision} has tar digest ${digest}, not the pinned ${pin.tarSha256}. ` +
        'Nothing was staged. If you are updating the pin on purpose, run: npm run pin:update -- <revision>',
    );
  }
  return { file, digest };
}

/** Extracts `member` (a path inside the archive's top directory) into `destination`. */
export function extract(pin, file, member, destination, strip) {
  fs.mkdirSync(destination, { recursive: true });
  execFileSync(
    'tar',
    [
      '-xzf',
      file,
      '-C',
      destination,
      `--strip-components=${strip}`,
      `${topDirectory(pin)}/${member}`,
    ],
    { stdio: 'inherit' },
  );
}

export function writePin(pin) {
  fs.writeFileSync(pinPath, `${JSON.stringify(pin, null, 2)}\n`);
}
