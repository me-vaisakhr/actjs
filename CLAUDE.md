# actjs — AI Context Guide

A minimal, SSR-first frontend library with fine-grained signals and island hydration. **8 kB gzipped**, zero runtime dependencies.

---

## Architecture Overview

```
src/
  signal.ts        Fine-grained reactivity: signal(), computed(), currentObserver tracking
  component.ts     Island factory: component() → setup once, render reactively
  diff.ts          DOM reconciler: reconcileChildren() diffs old vs. new element trees
  app.ts           createApp() — resolves container, mounts root, cleanup on destroy()
  jsx-runtime.ts   React 17+ automatic transform: jsx/jsxs/jsxDEV, JSX namespace
  hyperscript.ts   h(), el(), ref(), Fragment — low-level DOM builders used by JSX
  router.ts        createRouter(), navigate(), Link, params, query, currentPath
  loader.ts        loadScript(), loadStylesheet(), defineImportMap(), useDeps()
  deps.ts          CDN URL resolver: resolveUrl(pkg, version, provider)
  vite-plugin.ts   actjsPlugin() — reads actjs.deps.json, injects import map in HTML
  hydration.ts     renderToString() for SSR; serializeElement() for DOM → string
  head.ts          useHead() — sets document title/meta/link; renderHeadToString() for SSR
  lifecycle.ts     onInit(), onMount(), onDestroy() — hook into component setup context
  resource.ts      resource() — async data fetching with loading/error signals
  global-signal.ts globalSignal() — module-level reactive state shared across components
  scheduler.ts     makeScheduler() — debounces re-renders via microtask queue
  context.ts       createSetupContext() / setCurrentSetup() — tracks active component setup
  ssr-context.ts   isSSRMode(), setSSRMode() — SSR flag and head output store
  css.ts           CssManager — injects/removes critical CSS and stylesheets
  timers.ts        TimerManager — safeSetTimeout/Interval that auto-clean on destroy()
  template.ts      html`` tagged template — builds DOM from HTML string
  types.ts         All exported TypeScript interfaces and types

src/create/
  index.ts         runCreate() — scaffolds a new project directory
  templates.ts     tsTemplate(), jsTemplate() — returns { filePath → content } maps

bin/
  actjs.js         CLI entry: dev, build, preview, create, add, remove
```

---

## Signal Mental Model

```ts
// signal() returns [getter, setter] — getter is reactive when called inside a tracking context
const [count, setCount] = signal(0);

// computed() memoizes a derived value — re-runs when any tracked signal changes
const doubled = computed(() => count() * 2);

// Reading count() inside computed() auto-subscribes it to count's subscriber set.
// The currentObserver module variable (signal.ts) tracks the active effect.
// null = not tracking (safe to read signals without side effects)
```

**How tracking works**:
1. `currentObserver` is set to the active `Effect` before running a render/computed fn
2. Each `signal` getter checks `currentObserver` and adds it to its subscriber set
3. On `setter()` call, all subscribers are notified via `effect.run()`
4. `component()`'s `doRender()` creates a `renderEffect` — reading any signal inside the render fn auto-subscribes that render to re-run on signal change
5. `computed()` creates its own `Effect` — re-runs the compute fn when deps change, then notifies downstream observers
6. Both `doRender()` and `computed()` restore `currentObserver` in a `finally` block, so a thrown error never leaves tracking in a broken state

---

## Component Lifecycle

```ts
const MyComponent = component((props) => {
  // SETUP PHASE — runs ONCE per mount
  const [count, setCount] = signal(0);
  const double = computed(() => count() * 2);

  onInit(async () => { /* runs server + client, after first render */ });
  onMount(() => { /* client-only, after DOM is appended */ });
  onDestroy(() => { /* client-only, on app.destroy() */ });

  useHead({ title: 'My Page', meta: [{ name: 'description', content: '...' }] });

  // RENDER PHASE — returns a function that re-runs when signals change
  return () => (
    <div>{count()} × 2 = {double()}</div>
  );
}, { hydrate: 'interactive' });
```

**hydrate strategies** (set via `options.hydrate`):
- `'static'` (default) — render immediately, no re-hydration needed (SSR-only islands)
- `'interactive'` — render immediately, track signals and re-render on change
- `'visible'` — defer mount until the element enters the viewport (IntersectionObserver)
- `'idle'` — not yet implemented; maps to `interactive` for now

---

## SSR Flow

```ts
import { renderToString } from 'actjs/ssr'; // or from dist/

// 1. Sets isSSRMode() = true — suppresses onMount, onDestroy, browser APIs
// 2. Calls componentFn() — runs setup + initial render
// 3. Waits for onInit async hooks via queueMicrotask
// 4. Serializes DOM to HTML string (serializeElement)
// 5. Prepends useHead() output (title/meta/link tags)
const html = await renderToString(MyComponent, { title: 'SSR Page' });

// Client rehydration — pass hydrate:true to reconcile instead of replace
createApp('#root', { hydrate: true }).mount(MyComponent);
```

**SSR pitfalls**:
- `onMount` / `onDestroy` do NOT run during SSR — use `onInit` for shared init logic
- Browser globals (`window`, `document`, `location`) are not available — guard with `typeof window !== 'undefined'` or `isSSRMode()`
- `loadScript()` / `loadStylesheet()` no-op during SSR — safe to call unconditionally

---

## External Packages (CDN)

**Declarative approach** (recommended for Vite projects):
```sh
actjs add lodash         # writes to actjs.deps.json, resolves latest from npm
actjs add bootstrap@5.3  # pin a version
actjs remove lodash      # remove from actjs.deps.json
```

`actjs.deps.json`:
```json
{ "provider": "esm.sh", "packages": { "lodash": "4.17.21" } }
```

`vite.config.ts`:
```ts
import { actjsPlugin } from 'actjs/vite';
export default defineConfig({ plugins: [actjsPlugin()] });
// → injects <script type="importmap"> in HTML, externalizes packages from bundle
```

**Runtime approach** (IIFE / no bundler):
```ts
import { useDeps, loadScript, loadStylesheet } from 'actjs';
await useDeps({ provider: 'esm.sh', packages: { lodash: '4.17.21' } });
// or ad-hoc:
await loadScript('https://cdn.example.com/lib.min.js');
await loadStylesheet('https://cdn.example.com/style.css');
```

CDN providers: `esm.sh` (ESM, tree-shakeable), `jsdelivr`, `unpkg`.

---

## Router

```ts
import { createRouter, navigate, Link, params, query } from 'actjs';

const App = createRouter([
  { path: '/',           component: Home },
  { path: '/user/:id',   component: UserProfile },
  { path: '*',           component: NotFound },   // catch-all fallback
], { base: '/app' }); // optional base path prefix

// Inside a component render fn:
const id = params().id;          // reactive — re-renders on route change
const tab = query().tab;         // reactive URL query params
navigate('/user/42?tab=posts');  // programmatic navigation
```

`Link` renders an `<a>` that calls `navigate()` on click (no page reload).

---

## Common Patterns

**Conditional rendering**:
```tsx
return () => (
  <div>
    {count() > 0 && <span>Positive</span>}
    {error() ? <div class="error">{error()}</div> : <div>OK</div>}
  </div>
);
```

**List rendering**:
```tsx
return () => (
  <ul>
    {items().map(item => <li key={item.id}>{item.name}</li>)}
  </ul>
);
```

**Async data with resource()**:
```ts
const users = resource(() => fetch('/api/users').then(r => r.json()));
// users()          → data (undefined while loading)
// users.loading()  → boolean
// users.error()    → Error | undefined
```

**Global shared state**:
```ts
// shared-state.ts
export const [theme, setTheme] = globalSignal('light');

// In any component — reads and subscribes automatically:
return () => <div class={theme()}>...</div>;
```

---

## Pitfalls

1. **Circular computed deps will hang** — no cycle detection. A computed that reads itself (directly or transitively) will loop forever.
2. **Computed signals must be pure** — side effects (DOM mutations, `fetch`, `setX(...)`) inside `computed()` will re-run on every read and cause bugs. Use `onInit` or event handlers for side effects.
3. **Reading signals outside tracking context is fine** — calling `count()` outside a render fn or computed just returns the current value without subscribing.
4. **`onInit` async errors are logged to console** — they don't crash the component. Check the browser console if init logic seems to be silently failing.
5. **`onMount` fires after the microtask queue flushes** — DOM may not be in final position yet when called. Use `ref` + direct DOM access if you need post-layout reads.

---

## Testing

```sh
npm test                 # run all tests (vitest + jsdom)
npm run test:coverage    # must hit 100% — enforced in vitest.config.ts
npm run typecheck        # tsc --noEmit, strict mode
npm run build            # produces dist/ (ESM + IIFE + types)
```

- All tests live in `tests/`, one file per `src/` module
- jsdom provides `document`, `window`, `HTMLElement`, etc.
- Import `{ __resetLoaderState }` from `src/loader.ts` between loader tests

---

## Build Outputs

| File | Format | Use case |
|------|--------|----------|
| `dist/index.esm.js` | ESM | Vite / bundler projects |
| `dist/index.iife.js` | IIFE (`window.actjs`) | Script tag, no bundler |
| `dist/index.d.ts` | Types | TypeScript consumers |
| `dist/jsx-runtime.esm.js` | ESM | JSX transform |
| `dist/vite-plugin.esm.js` | ESM | `actjs/vite` subpath export |
| `dist/dev/server.js` | CJS | `actjs dev` / `actjs build` dev server |
| `dist/create/index.js` | ESM | `actjs create` scaffolder |

Config: `vite.config.ts` at repo root — builds all entry points via `lib.entry` map.

---

## CLI Reference

```sh
actjs dev               # start Vite dev server
actjs build             # Vite production build
actjs preview           # preview production build
actjs create <name>     # scaffold new project (--template typescript|javascript)
actjs add <pkg>[@ver]   # add CDN dep to actjs.deps.json
actjs remove <pkg>      # remove CDN dep from actjs.deps.json
actjs --help            # print this reference
actjs --version         # print actjs version
```
