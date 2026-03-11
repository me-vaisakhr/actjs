#!/usr/bin/env node
/**
 * Compile src/dev/ → dist/dev/ using esbuild.
 * This is a separate build step from the main Vite library build.
 * Platform: Node.js ESM. Externals: ws, esbuild (not bundled).
 */

import * as esbuild from 'esbuild';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

if (!existsSync(join(root, 'dist'))) mkdirSync(join(root, 'dist'));

await esbuild.build({
  entryPoints: [join(root, 'src', 'dev', 'server.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  outdir: join(root, 'dist', 'dev'),
  external: ['ws', 'esbuild'],
  sourcemap: true,
  loader: { '.ts': 'ts' },
  // Resolve .js imports in TypeScript source to .ts (TS ESM convention)
  plugins: [{
    name: 'ts-ext-resolve',
    setup(build) {
      build.onResolve({ filter: /\.js$/ }, args => {
        if (args.importer && args.path.startsWith('.')) {
          const tsPath = args.path.replace(/\.js$/, '.ts');
          const resolved = join(dirname(args.importer), tsPath);
          if (existsSync(resolved)) return { path: resolved };
        }
        return null;
      });
    },
  }],
});

console.log('✓ dist/dev/server.js built');
