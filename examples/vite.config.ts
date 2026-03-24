import { defineConfig } from 'vite';

// Shared Vite config for all examples.
// Root is set via VITE_EXAMPLE env var (default: landing).
const r = (path: string) => new URL(path, import.meta.url).pathname;
const example = process.env['VITE_EXAMPLE'] ?? 'landing';

export default defineConfig({
  root: r(example),
  esbuild: {
    // Use actjs automatic JSX runtime for all .tsx files
    jsxImportSource: 'js-act',
    jsx: 'automatic',
  },
  resolve: {
    // Resolve bare 'actjs' imports to the local source
    // More-specific paths must come before the generic 'actjs' entry
    alias: [
      { find: 'actjs/jsx-runtime', replacement: r('../src/jsx-runtime.ts') },
      { find: 'actjs/server',      replacement: r('../src/hydration.ts') },
      { find: 'actjs',             replacement: r('../src/index.ts') },
    ],
  },
});
