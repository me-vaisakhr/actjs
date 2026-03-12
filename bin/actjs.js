#!/usr/bin/env node
// actjs CLI — create, dev, build, and preview.
// Compiled output lives at dist/ after `npm run build:dev` / `npm run build:create`.

import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);

// `actjs create <name> [options]` — scaffold a new project
if (argv[0] === 'create') {
  const distCreate = join(__dirname, '..', 'dist', 'create', 'index.js');
  if (!existsSync(distCreate)) {
    console.error('[actjs] Scaffolder not built yet. Run: npm run build:create');
    process.exit(1);
  }
  const { runCreate } = await import(distCreate);
  runCreate(argv.slice(1));
  process.exit(0);
}

// `actjs dev | build | preview [options]`
const distServer = join(__dirname, '..', 'dist', 'dev', 'server.js');
if (!existsSync(distServer)) {
  console.error('[actjs] Dev server not built yet. Run: npm run build:dev');
  process.exit(1);
}

const { startDevServer } = await import(distServer);
await startDevServer(argv);
