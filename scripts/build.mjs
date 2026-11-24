#!/usr/bin/env node
/* Build statis tanpa framework:
   1) menyalin file bersama (shared/*) ke store/assets dan admin/assets
   2) mengompilasi Tailwind -> assets/tailwind.css (menggantikan skrip cdn.tailwindcss.com
      yang tidak dianjurkan untuk produksi dan butuh izin script dari pihak ketiga).
   Jalankan:  npm install   lalu   npm run build
   Jalankan ulang setiap kali kamu menambah class Tailwind baru di HTML/JS. */
import { readFileSync, writeFileSync, copyFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, 'package.json'));
const twDir = dirname(require.resolve('tailwindcss/package.json'));
const { compile } = await import(pathToFileURL(join(twDir, 'dist', 'lib.mjs')).href);

const targets = {
  store: { dir: 'store', shared: ['utils.js', 'config.js', 'style.css'], sources: ['index.html', 'assets/script.js', 'assets/utils.js'] },
  admin: { dir: 'admin', shared: ['utils.js', 'config.js', 'style.css'], sources: ['index.html', 'assets/admin.js', 'assets/utils.js'] }
};

const input = readFileSync(join(root, 'shared', 'tailwind.input.css'), 'utf8');

async function loadStylesheet(id, base) {
  const path = id === 'tailwindcss' ? join(twDir, 'index.css') : resolve(base, id);
  return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
}
const tokens = (text) => text.split(/[\s"'`<>=(){};,$\\]+/).filter(Boolean);

for (const [name, t] of Object.entries(targets)) {
  const assets = join(root, t.dir, 'assets');
  mkdirSync(assets, { recursive: true });
  for (const f of t.shared) copyFileSync(join(root, 'shared', f), join(assets, f));

  const cands = new Set();
  for (const s of t.sources) tokens(readFileSync(join(root, t.dir, s), 'utf8')).forEach(c => cands.add(c));
  const compiler = await compile(input, { base: root, loadStylesheet });
  const css = compiler.build([...cands]);
  writeFileSync(join(assets, 'tailwind.css'), css);
  console.log(`${name}: assets/tailwind.css  ${(css.length / 1024).toFixed(1)} KB  (${cands.size} kandidat)`);
}
