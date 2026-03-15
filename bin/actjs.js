#!/usr/bin/env node
// actjs CLI — create, dev, build, preview, and add.
// Compiled output lives at dist/ after `npm run build:dev` / `npm run build:create`.

import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);

// `actjs add <package>[@version]` — add a CDN dependency to actjs.deps.json
if (argv[0] === 'add') {
  const pkgArg = argv[1];
  if (!pkgArg) {
    console.error('[actjs] Usage: actjs add <package>[@version]');
    process.exit(1);
  }

  // Split "lodash@4.17.21" → pkg="lodash", version="4.17.21"
  // Handle scoped packages like "@scope/pkg@1.0.0"
  let pkg, version;
  const atIdx = pkgArg.lastIndexOf('@');
  if (atIdx > 0) {
    pkg = pkgArg.slice(0, atIdx);
    version = pkgArg.slice(atIdx + 1);
  } else {
    pkg = pkgArg;
    // Resolve latest version from npm registry
    let res;
    try {
      res = await fetch(`https://registry.npmjs.org/${pkg}/latest`);
    } catch {
      console.error(`[actjs] Network error fetching "${pkg}" from npm registry`);
      process.exit(1);
    }
    if (!res.ok) {
      console.error(`[actjs] Package "${pkg}" not found on npm (status ${res.status})`);
      process.exit(1);
    }
    const data = await res.json();
    version = data.version;
  }

  const depsPath = join(process.cwd(), 'actjs.deps.json');
  let deps = { provider: 'esm.sh', packages: {} };
  if (existsSync(depsPath)) {
    try {
      deps = JSON.parse(readFileSync(depsPath, 'utf-8'));
    } catch {
      console.error('[actjs] Could not parse existing actjs.deps.json — overwriting');
    }
  }
  if (!deps.packages) deps.packages = {};
  deps.packages[pkg] = version;
  writeFileSync(depsPath, JSON.stringify(deps, null, 2) + '\n');
  console.log(`[actjs] Added ${pkg}@${version} → actjs.deps.json`);
  process.exit(0);
}

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
