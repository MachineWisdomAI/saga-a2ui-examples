import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

// Maintained copy, including dotfiles and newly added source. Identifiers keep their spelling.
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const failures = [];
for (const file of new Set(files)) {
  if (!fs.existsSync(file) || file === 'scripts/check-brand.mjs' || file === 'package-lock.json' || !/\.(md|json|html|ts|tsx|mjs|css)$/.test(file) && file !== '.gitignore') continue;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const historical = file === 'README.md' && line.includes('**SAGA Tic Tac Toe** (historical label, before the lowercase naming correction)');
    const copy = historical ? line.replace('SAGA Tic Tac Toe', 'saga Tic Tac Toe') : line;
    if (/\bSAGA\b|\bMachineWisdom\b/.test(copy)) failures.push(`${file}:${i + 1}: incorrect brand spelling`);
  });
}
if (failures.length) throw new Error(failures.join('\n'));
console.log('Maintained brand copy uses saga and Machine Wisdom.');
