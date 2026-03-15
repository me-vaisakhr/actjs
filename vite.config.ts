import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Main build: ESM + CJS for all three entry points
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        'jsx-runtime': 'src/jsx-runtime.ts',
        server: 'src/hydration.ts',
        'vite-plugin': 'src/vite-plugin.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (entryName === 'index') {
          return format === 'es' ? 'actjs.esm.js' : 'actjs.cjs.js';
        }
        if (entryName === 'jsx-runtime') {
          return format === 'es' ? 'jsx-runtime.js' : 'jsx-runtime.cjs.js';
        }
        if (entryName === 'server') {
          return format === 'es' ? 'actjs.server.esm.js' : 'actjs.server.cjs.js';
        }
        return `${entryName}.${format === 'es' ? 'js' : 'cjs.js'}`;
      },
    },
    rollupOptions: {
      // Externalize Node.js built-ins and vite (used by vite-plugin entry only)
      external: ['vite', 'node:fs', 'node:path'],
    },
    target: 'es2018',
    sourcemap: true,
    minify: 'esbuild',
  },
  plugins: [
    dts({
      include: ['src'],
      insertTypesEntry: false,
      outDir: 'dist',
    }),
  ],
});
