/**
 * Append the JSX namespace declaration to dist/jsx-runtime.d.ts if missing.
 *
 * vite-plugin-dts silently drops `export declare namespace JSX` from module
 * files (a known quirk with ambient namespace declarations). Without this block,
 * TypeScript reports error 7026 ("JSX element implicitly has type 'any' because
 * no interface 'JSX.IntrinsicElements' exists") in any project that consumes
 * actjs via the compiled dist.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root    = join(dirname(fileURLToPath(import.meta.url)), '..');
const dtsPath = join(root, 'dist', 'jsx-runtime.d.ts');

const current = readFileSync(dtsPath, 'utf-8');

if (current.includes('namespace JSX')) {
  console.log('✓ dist/jsx-runtime.d.ts already has JSX namespace — skipping patch');
  process.exit(0);
}

const patch = `
export declare namespace JSX {
  type Element = globalThis.Element | DocumentFragment;
  interface IntrinsicElements {
    [tagName: string]: Props & { children?: Child | Child[] };
  }
}
`;

writeFileSync(dtsPath, current.trimEnd() + '\n' + patch, 'utf-8');
console.log('✓ Patched dist/jsx-runtime.d.ts with JSX namespace');
