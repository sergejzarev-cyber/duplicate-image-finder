import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const pub = join(root, 'public');

if (!existsSync(dist)) {
  console.error('dist/ not found — run vite build first');
  process.exit(1);
}

const files = [
  'google400ad3b54f5d459e.html',
  'robots.txt',
  'sitemap.xml',
];

for (const name of files) {
  const from = join(pub, name);
  const to = join(dist, name);
  if (!existsSync(from)) {
    console.warn('skip missing', name);
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log('copied', name, '-> dist/');
}
