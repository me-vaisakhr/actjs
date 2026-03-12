# actjs

[![npm](https://img.shields.io/npm/v/actjs)](https://www.npmjs.com/package/actjs)
[![jsdelivr](https://img.shields.io/jsdelivr/npm/hw/actjs)](https://www.jsdelivr.com/package/npm/actjs)
[![license](https://img.shields.io/npm/l/actjs)](LICENSE)

> Lightweight SSR-first frontend library with fine-grained signals and island architecture.

**Zero runtime dependencies. 8 kB gzipped.**

```html
<!-- Zero build step — drop in and go -->
<script src="https://cdn.jsdelivr.net/npm/actjs/dist/actjs.iife.js"></script>
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
| **JSX support** | React 17+ automatic transform via `actjs/jsx-runtime`. |
| **`el.*` hyperscript** | `el.button(...)` — no-build syntax for script-tag users. |
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

```bash
npm install actjs
```

Or via CDN (no build step):

```html
<script src="https://cdn.jsdelivr.net/npm/actjs/dist/actjs.iife.js"></script>
```

---

## Quick start

### With npm + TypeScript (JSX)

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "actjs"
  }
}
```

```tsx
// counter.tsx
import { component, signal, computed } from 'actjs';
import { createApp } from 'actjs';

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
import { createRouter, navigate, Link, params, query } from 'actjs';

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
import { renderToString } from 'actjs/server';

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

## Build outputs

| File | Use |
|---|---|
| `dist/actjs.esm.js` | ESM — import via npm |
| `dist/actjs.cjs.js` | CJS — require() in Node.js |
| `dist/actjs.iife.js` | Script tag — `<script src="...">` |
| `dist/jsx-runtime.js` | JSX transform (auto-imported by TypeScript) |
| `dist/actjs.server.esm.js` | SSR — `renderToString()` |

---

## Examples

- [Counter](examples/counter/index.html) — IIFE build, no tooling
- [Blog](examples/blog/index.html) — island architecture (static header, interactive like buttons, lazy newsletter)
- [Todo](examples/todo/index.html) — signals, computed, list rendering

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
