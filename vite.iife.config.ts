import { defineConfig } from 'vite';

// IIFE build: single-entry bundle for <script> tag users
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'actjs',
      formats: ['iife'],
      fileName: () => 'actjs.iife.js',
    },
    target: 'es2018',
    sourcemap: true,
    minify: 'esbuild',
    emptyOutDir: false, // don't clear dist from the main build
  },
});
