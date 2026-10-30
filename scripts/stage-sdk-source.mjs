import fs from 'node:fs';
import path from 'node:path';
import {
  extract,
  fetchArchive,
  readPin,
  root,
  topDirectory,
  writePin,
} from './sdk-archive.mjs';

// Stages the SDK's canonical tic-tac-toe game (rules, operations, contract and view) from the
// pinned archive into .stage/game, ignored by Git. The hosted build imports those files and
// substitutes only its hosting and storage composition: there is no second copy of the rules.
//
//   npm run stage                         stage the pinned revision
//   npm run pin:update -- <40-char SHA>   pin another SDK revision (then review the diff)

const stageDirectory = path.join(root, '.stage');
const gameDirectory = path.join(stageDirectory, 'game');

/** The dependency versions the staged game was built and tested with must be the ones installed here. */
function checkDependencyPins(pin) {
  const staged = JSON.parse(
    fs.readFileSync(path.join(gameDirectory, 'package.json'), 'utf8'),
  );
  const ours = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
  );
  const declared = { ...ours.dependencies, ...ours.devDependencies };
  const wanted = { ...staged.dependencies, ...staged.devDependencies };
  const problems = [];
  for (const [name, version] of Object.entries(wanted))
    if (declared[name] !== version)
      problems.push(
        `${name}: the game pins ${version}, package.json has ${declared[name] ?? 'nothing'}`,
      );
  if (staged.dependencies['@saga-a2ui/react-mcp-stack'] !== pin.sdkVersion)
    problems.push(
      `sdk-source.json sdkVersion ${pin.sdkVersion} is not the game's react-mcp-stack pin ${staged.dependencies['@saga-a2ui/react-mcp-stack']}`,
    );
  if (problems.length > 0)
    throw new Error(
      `The staged game and this application disagree about dependencies:\n  ${problems.join('\n  ')}`,
    );
}

async function stage() {
  const pin = readPin();
  const { file, digest } = await fetchArchive(pin);
  fs.rmSync(stageDirectory, { recursive: true, force: true });
  extract(pin, file, pin.gamePath, gameDirectory, 3);
  fs.rmSync(path.join(gameDirectory, 'guided-change'), {
    recursive: true,
    force: true,
  });
  checkDependencyPins(pin);
  fs.writeFileSync(
    path.join(stageDirectory, 'manifest.json'),
    `${JSON.stringify({ repository: pin.repository, revision: pin.revision, tarSha256: digest, source: `${topDirectory(pin)}/${pin.gamePath}` }, null, 2)}\n`,
  );
  console.log(`Staged ${pin.repository}@${pin.revision} (${pin.gamePath}) into .stage/game`);
}

async function update(revision) {
  const pin = { ...readPin(), revision, tarSha256: '' };
  const { digest } = await fetchArchive(pin, { verify: false });
  writePin({ ...pin, tarSha256: digest });
  console.log(
    `Pinned ${revision} (tar sha256 ${digest}). Review sdk-source.json, set sdkVersion and the dependency versions in package.json to match the game, then run npm run check.`,
  );
}

const [, , flag, revision] = process.argv;
if (flag === '--update') {
  if (revision === undefined) throw new Error('Usage: npm run pin:update -- <revision>');
  await update(revision);
} else await stage();
