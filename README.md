# js-act

[![npm](https://img.shields.io/npm/v/js-act)](https://www.npmjs.com/package/js-act)
[![jsdelivr](https://img.shields.io/jsdelivr/npm/hw/js-act)](https://www.jsdelivr.com/package/npm/js-act)
[![license](https://img.shields.io/npm/l/js-act)](LICENSE)

> Lightweight SSR-first frontend library with fine-grained signals and island architecture.

**Zero runtime dependencies. 8 kB gzipped.**

```html
<!-- Zero build step — drop in and go -->
<script src="https://cdn.jsdelivr.net/npm/js-act/dist/actjs.iife.js"></script>
<script>
  const { component, signal, el, createApp } = actjs;

  const Counter = component(() => {
    const [count, setCount] = signal(0);
    return () => el.section(null,
      el.p(null, `Count: ${count()}`),
      el.button({ onclick: () => setCount(c => c + 1) }, 'Increment'),
    );
  }, { hydrate: 'interactive' });

  createApp('#root').mount(Counter);
</script>
```

---

## Features

| Feature | Detail |
|---|---|
| **Fine-grained signals** | `signal<T>()` — explicit getter call IS the subscription. No Proxy, no magic. |
| **Island architecture** | Per-component `hydrate: 'static' | 'interactive' | 'visible'`. Static = zero JS shipped. |
| **SSR-first** | `renderToString()` + streaming-ready. Works with any server framework. |
| **`useHead()`** | Reactive `<title>/<meta>/<link>` management. SSR + client. |
| **`resource()` + `Suspense`** | Async data loading with streaming fallback. |
| **JSX support** | React 17+ automatic transform via `js-act/jsx-runtime`. |
| **`el.*` hyperscript** | `el.button(...)` — no-build syntax for script-tag users. |
| **External packages** | `actjs add lodash` — declare CDN deps in `actjs.deps.json`. Works from npm or jsDelivr/esm.sh/unpkg. |
| **Zero dependencies** | No `dependencies` in package.json. Ever. |

---

## Scaffold a new project

```bash
npx create-actjs-app my-app        # TypeScript (default)
npx create-actjs-app my-app --template javascript

cd my-app
npm install

npm run build   # production build → dist/index.html (opens without a server)
npm run dev     # dev server with hot reload → http://localhost:3000
```

> **`npm run build` first** — produces a self-contained `dist/index.html` you can open directly.
> Use `npm run dev` when you need live hot reload during development.

---

## Install (existing project)

> **Requires Node.js 20+** — the CLI and dev server use features unavailable in Node 18.

```bash
npm install js-act
```

Or via CDN (no build step):

```html
<script src="https://cdn.jsdelivr.net/npm/js-act/dist/actjs.iife.js"></script>
```

---

## Quick start

### Using Vite directly (alternative to `actjs dev`)

If you prefer Vite as your dev server — or if `actjs dev` isn't working — add `actjsPlugin()` to your config. It wires up the JSX transform automatically:

```bash
npm install -D vite js-act
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { actjsPlugin } from 'js-act/vite';

export default defineConfig({
  plugins: [actjsPlugin()],
});
```

Then run `vite` / `vite build` as normal. No extra `jsxImportSource` config needed — the plugin sets it for you.

---

### With npm + TypeScript (JSX)

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "js-act"
  }
}
```

```tsx
// counter.tsx
import { component, signal, computed } from 'js-act';
import { createApp } from 'js-act';

const Counter = component(() => {
  const [count, setCount] = signal(0);
  const doubled = computed(() => count() * 2);

  return () => (
    <section>
      <p>{count()} × 2 = {doubled()}</p>
      <button onclick={() => setCount(c => c + 1)}>Increment</button>
    </section>
  );
}, { hydrate: 'interactive' });

createApp('#root').mount(Counter);
```

### With Django / Laravel / PHP (IIFE, no build)

```html
<!-- base.html -->
<script src="/static/actjs.iife.js" defer></script>

<!-- page.html -->
<div id="like-button"></div>
<script>
  const { component, signal, el, createApp } = actjs;

  const LikeButton = component(() => {
    const [liked, setLiked] = signal(false);
    const [count, setCount] = signal({{ post.likes }});

    const toggle = () => {
      setLiked(l => !l);
      setCount(c => liked() ? c - 1 : c + 1);
    };

    return () => el.button(
      { onclick: toggle, class: liked() ? 'liked' : '' },
      `${liked() ? '❤️' : '🤍'} ${count()}`
    );
  }, { hydrate: 'interactive' });

  createApp('#like-button').mount(LikeButton);
</script>
```

---

## API

### Signals

```ts
// Fine-grained signal
const [count, setCount] = signal(0);
count();           // read (auto-subscribes in render context)
setCount(1);       // set directly
setCount(n => n + 1); // update with function

// Derived signal
const doubled = computed(() => count() * 2);
doubled(); // auto-tracks count()

// Global keyed signal (for IIFE users without module scope)
const [theme, setTheme] = globalSignal('theme', 'light');
```

### Lifecycle

```ts
const MyComp = component(() => {
  onInit(async () => { /* server + client — data loading */ });
  onMount(() => { /* client only — DOM available */ });
  onDestroy(() => { /* client only — cleanup */ });

  return () => <div />;
});
```

### Head management (SEO)

```ts
const Page = component(() => {
  useHead({
    title: 'My Page',
    meta: [{ name: 'description', content: 'Description here' }],
    link: [{ rel: 'canonical', href: 'https://example.com/page' }],
  });
  return () => <main>...</main>;
});
```

### Async data + Suspense

```tsx
const BlogPage = component(() => {
  const posts = resource(() => fetch('/api/posts').then(r => r.json()));

  return () => (
    <Suspense fallback={<p>Loading...</p>}>
      <PostList posts={posts()} />
    </Suspense>
  );
});
```

### Island hydration strategies

```ts
// Static (default) — renders to HTML, ships ZERO JS
const Header = component(() => () => <header>...</header>);

// Interactive — hydrates on page load
const Counter = component(() => ..., { hydrate: 'interactive' });

// Visible — hydrates when scrolled into view (best for LCP)
const HeavyWidget = component(() => ..., { hydrate: 'visible' });
```

### Router

```ts
import { createRouter, navigate, Link, params, query } from 'js-act';

const App = createRouter([
  { path: '/',           component: Home },
  { path: '/blog/:slug', component: BlogPost },
  { path: '*',           component: NotFound },
], { base: '/app' }); // optional base path

createApp('#root').mount(App);

// Programmatic navigation
navigate('/blog/hello-world');

// Reactive route params / query — read inside a component render
const BlogPost = component(() => () => {
  const { slug } = params();        // auto-subscribes to route changes
  const { page } = query();         // ?page=2
  return <article data-slug={slug}>...</article>;
});

// Declarative link (no full-page reload)
Link({ href: '/blog/hello', children: 'Read more' });
// or in JSX:
// <Link href="/blog/hello">Read more</Link>
```

### SSR

```ts
import { renderToString } from 'js-act/server';

const html = await renderToString(MyPage);
// Returns: <title>...</title><main>...</main>
```

### App factory

```ts
const app = createApp('#root', { hydrate: false });
app.mount(MyComponent);

// Utilities (auto-cleaned on destroy)
app.criticalCSS('body { margin: 0 }');
app.criticalStylesheet('/styles.css');
app.safeSetInterval(fn, 1000);
app.safeSetTimeout(fn, 500);

app.destroy(); // cleans timers, styles, calls onDestroy
```

---

## External packages

js-act supports two ways to use external packages like lodash, bootstrap, or tailwind.

### Option A — npm install (bundled projects)

Standard npm workflow. Vite handles bundling automatically.

```bash
npm install lodash bootstrap
```

```ts
import _ from 'lodash'
import 'bootstrap/dist/css/bootstrap.min.css'
```

### Option B — CDN (no bundler / IIFE users)

Declare deps in `actjs.deps.json` — the CLI resolves versions from npm and js-act loads them from CDN.

```bash
actjs add lodash          # resolves latest from npm registry
actjs add bootstrap@5.3.3 # pinned version
```

This creates/updates `actjs.deps.json`:

```json
{
  "provider": "esm.sh",
  "packages": {
    "lodash": "4.17.21",
    "bootstrap": "5.3.3"
  }
}
```

Supported CDN providers: `"esm.sh"` (default, ESM + tree-shaking), `"jsdelivr"`, `"unpkg"`.

#### With Vite (build-time — recommended)

Add the plugin to your `vite.config.ts`. It reads `actjs.deps.json` and automatically injects an import map + stylesheet links into your HTML and externalizes packages from the bundle.

```ts
import { actjsPlugin } from 'js-act/vite'

export default defineConfig({
  plugins: [actjsPlugin()],
})
```

Your code then imports packages by name — no URL needed:

```ts
import _ from 'lodash'  // resolved via the injected import map
```

#### Runtime loading (IIFE / no bundler)

For script-tag users, call `useDeps()` before mounting your app:

```html
<script src="https://cdn.jsdelivr.net/npm/js-act/dist/actjs.iife.js"></script>
<script type="module">
  const { useDeps, createApp, component, signal, el } = actjs;

  await useDeps({
    provider: 'esm.sh',
    packages: { lodash: '4.17.21', bootstrap: '5.3.3' }
  });

  // Bootstrap CSS is injected, lodash is available via import map
  createApp('#root').mount(MyApp);
</script>
```

You can also use the lower-level helpers directly:

```ts
import { loadScript, loadStylesheet, defineImportMap, preloadResource } from 'js-act';

// Load a stylesheet
await loadStylesheet('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css');

// Load a script
await loadScript('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');

// Set up an import map for ESM bare imports
defineImportMap({ lodash: 'https://esm.sh/lodash@4.17.21' });

// Preload hint for the browser
preloadResource('https://esm.sh/lodash@4.17.21', 'script');
```

All helpers are:
- **SSR-safe** — no-op when `document` is undefined
- **Idempotent** — the same URL is never injected twice even with concurrent callers
- **Tree-shakeable** — unused helpers add zero bytes to your bundle

---

## Build outputs

| File | Use |
|---|---|
| `dist/actjs.esm.js` | ESM — import via npm |
| `dist/actjs.cjs.js` | CJS — require() in Node.js |
| `dist/actjs.iife.js` | Script tag — `<script src="...">` |
| `dist/jsx-runtime.js` | JSX transform (auto-imported by TypeScript) |
| `dist/actjs.server.esm.js` | SSR — `renderToString()` |
| `dist/vite-plugin.js` | Vite plugin — `import { actjsPlugin } from 'js-act/vite'` |

---

## Examples

- [Counter](examples/counter/index.html) — IIFE build, no tooling
- [Blog](examples/blog/index.html) — island architecture (static header, interactive like buttons, lazy newsletter)
- [Todo](examples/todo/index.html) — signals, computed, list rendering
- [Landing](examples/landing/index.html) — full landing page with components

---

## Development

```bash
npm install
npm test            # run tests
npm run typecheck   # TypeScript check
npm run build       # build all formats
npm run test:coverage  # coverage report
```

---

## License

MIT
