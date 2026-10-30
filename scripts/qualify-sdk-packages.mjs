import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { extract, fetchArchive, readPin, root } from './sdk-archive.mjs';

// Local qualification only. The SDK packages this application depends on may not be on the npm
// registry yet. This installs exactly the pinned revision's packages, packed with `npm pack`, so
// the build, type checks and tests run against the intended SDK code. Tarballs are not registry
// consumption: once the packages are published, `npm ci` replaces this step (see README).
//
//   npm run qualify:sdk

const packages = ['core', 'components', 'mcp', 'react', 'react-mcp-stack'];
const work = path.join(root, '.qualify');

const pin = readPin();
const { file } = await fetchArchive(pin);
fs.rmSync(work, { recursive: true, force: true });
extract(pin, file, 'packages', path.join(work, 'packages'), 2);

fs.mkdirSync(path.join(work, 'tarballs'), { recursive: true });
const tarballs = [];
for (const name of packages) {
  const directory = path.join(work, 'packages', name);
  const { name: packageName, version } = JSON.parse(
    fs.readFileSync(path.join(directory, 'package.json'), 'utf8'),
  );
  if (version !== pin.sdkVersion)
    throw new Error(
      `packages/${name} is ${version}; sdk-source.json says ${pin.sdkVersion}.`,
    );
  execFileSync(
    'npm',
    ['pack', '--ignore-scripts', '--pack-destination', path.join(work, 'tarballs')],
    { cwd: directory, stdio: 'ignore' },
  );
  // npm names the file after the package: @saga-a2ui/core 0.11.0-rc.1 -> saga-a2ui-core-0.11.0-rc.1.tgz
  const filename = `${packageName.replace(/^@/, '').replace('/', '-')}-${version}.tgz`;
  const tarball = path.join(work, 'tarballs', filename);
  if (!fs.existsSync(tarball)) throw new Error(`npm pack did not write ${filename}`);
  tarballs.push(tarball);
}

execFileSync(
  'npm',
  [
    'install',
    '--no-save',
    '--no-package-lock',
    '--ignore-scripts',
    ...tarballs,
  ],
  { cwd: root, stdio: 'inherit' },
);
console.log(
  `Installed ${packages.length} SDK packages (${pin.sdkVersion}) packed from ${pin.repository}@${pin.revision}.`,
);
