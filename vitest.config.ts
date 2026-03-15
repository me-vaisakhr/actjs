import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/vite-plugin.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
  resolve: {
    alias: {
      actjs: '/Users/vaisakhrkrishnan/Documents/personal/actjs/src/index.ts',
      'actjs/jsx-runtime': '/Users/vaisakhrkrishnan/Documents/personal/actjs/src/jsx-runtime.ts',
      'actjs/server': '/Users/vaisakhrkrishnan/Documents/personal/actjs/src/hydration.ts',
    },
  },
});
