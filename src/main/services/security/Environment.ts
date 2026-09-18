import fs from 'node:fs';
import path from 'node:path';

export function loadLocalEnvironment(root: string): void {
  const candidates = [path.join(root, 'env.local', 'env.local'), path.join(root, '.env.local')];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/u);
    if (match?.[1] && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/gu, '');
  }
}
