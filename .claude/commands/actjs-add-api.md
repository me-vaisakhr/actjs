Add a new public API to actjs: $ARGUMENTS

Complete ALL of the following steps in order. Do not skip any.

---

## Step 1 — Create `src/<name>.ts`

Write the implementation file:
- **No runtime dependencies** — `dependencies` in package.json must stay empty
- **SSR-safe** — guard any browser API (`document`, `window`, `localStorage`) with `typeof document !== 'undefined'`
- Export all public functions/types from this file

## Step 2 — Add JSDoc with `@example`

Every exported function needs a JSDoc block:
- One `@example` block — copy-paste-runnable, under 10 lines
- Describe what the function does, what it returns, and any gotchas

## Step 3 — Add types to `src/types.ts` if needed

If the new API takes an options object or returns a structured type, define it in `src/types.ts` in the appropriate section. Follow the existing naming conventions (e.g., `LoadScriptOptions`, `CreateAppOptions`).

## Step 4 — Export from `src/index.ts` barrel

Add the export to the appropriate block in `src/index.ts`:
- Value exports: `export { myFn } from './my-file.js';`
- Type-only exports: `export type { MyType } from './types.js';`

## Step 5 — Create `tests/<name>.test.ts`

Write tests with **100% coverage** (enforced by vitest.config.ts):
- Import directly from `../src/<name>.ts` (not from barrel `../src/index.ts`)
- Use `happy-dom` environment — `document`, `window`, etc. are available
- Cover: happy path, edge cases, error cases, SSR mode (test with `typeof document === 'undefined'` mock if relevant)
- Pattern from existing tests: see `tests/loader.test.ts` for async patterns, `tests/signal.test.ts` for reactivity patterns

## Step 6 — Update `CLAUDE.md`

Add the new API to:
1. The **Architecture Overview** table (`src/<name>.ts — description`)
2. The relevant section body (with a usage example if it's user-facing)

## Step 7 — Verify everything passes

Run in order:
```sh
npm run typecheck   # must produce 0 new errors
npm test            # all tests must pass
npm run build       # bundle must stay under 8 kB gzipped
```

Do not declare the task done until all three pass.
