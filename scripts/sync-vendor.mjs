#!/usr/bin/env node
/**
 * Copies Alpine.js's ESM build into public/js/vendor/ so it can be served as
 * a plain static file and loaded with a native <script type="module"> tag —
 * no bundler step, matching this fork's zero-hydration, vanilla-island
 * architecture. Runs via the `predev`/`prebuild` npm scripts.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(projectRoot, 'node_modules/alpinejs/dist/module.esm.js');
const destinationDir = join(projectRoot, 'public/js/vendor');
const destination = join(destinationDir, 'alpine.mjs');

mkdirSync(destinationDir, { recursive: true });
copyFileSync(source, destination);

const { version } = JSON.parse(readFileSync(join(projectRoot, 'node_modules/alpinejs/package.json'), 'utf8'));
const header = `// Alpine.js v${version} — https://alpinejs.dev — MIT License\n// Vendored verbatim by scripts/sync-vendor.mjs, do not edit by hand.\n`;
writeFileSync(destination, header + readFileSync(destination, 'utf8'));

console.log(`sync-vendor: copied alpinejs v${version} -> public/js/vendor/alpine.mjs`);
