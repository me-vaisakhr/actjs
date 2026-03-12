#!/usr/bin/env node
// create-actjs-app CLI — scaffolds a new actjs project.
// Compiled output lives at dist/create/index.js after `npm run build:create`.

import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distCreate = join(__dirname, '..', 'dist', 'create', 'index.js');

if (!existsSync(distCreate)) {
  console.error('[create-actjs-app] Scaffolder not built yet. Run: npm run build:create');
  process.exit(1);
}

const { runCreate } = await import(distCreate);
runCreate(process.argv.slice(2));
