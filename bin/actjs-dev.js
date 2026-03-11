#!/usr/bin/env node
// actjs-dev CLI — starts the actjs development server.
// Compiled output lives at dist/dev/server.js after `npm run build:dev`.
// During library development, source is run via tsx or after build.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distServer = join(__dirname, '..', 'dist', 'dev', 'server.js');

if (!existsSync(distServer)) {
  console.error('[actjs-dev] Dev server not built yet. Run: npm run build:dev');
  process.exit(1);
}

const { startDevServer } = await import(distServer);
await startDevServer(process.argv.slice(2));
