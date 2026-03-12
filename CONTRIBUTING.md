# Contributing to actjs

Thank you for your interest in contributing!

## Getting started

```bash
git clone https://github.com/vaisakhrkrishnan/actjs
cd actjs
npm install
npm test
```

## Project structure

```
src/          # Library source — one module per concern
tests/        # Vitest tests — one file per src module
examples/     # Browser-runnable examples using the IIFE build
dist/         # Generated — do not commit
```

## Development workflow

1. Make your changes in `src/`
2. Add or update tests in `tests/`
3. Run `npm test` — all 155 tests must pass
4. Run `npm run typecheck` — zero TypeScript errors
5. Run `npm run build` — build must succeed
6. Open an example in the browser to do a quick smoke test

## Conventions

- **No runtime dependencies.** `dependencies` in `package.json` must always be empty.
- **100% test coverage.** Every line in `src/` must be covered. `npm run test:coverage` enforces this.
- **Strict TypeScript.** `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` are all on.
- **Zero DOM abstractions.** Work with real DOM nodes — no virtual DOM, no wrappers.
- **SSR awareness.** Any new feature that touches the DOM must work correctly in both `renderToString()` and client contexts. Check `isSSRMode()` if needed.

## Pull request checklist

- [ ] Tests added / updated
- [ ] `npm test` passes (155+ tests)
- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run build` succeeds
- [ ] No new runtime dependencies added

## Filing issues

Please use [GitHub Issues](hhttps://github.com/me-vaisakhr/actjs/issues) to report bugs or request features. Include a minimal reproduction when possible.
