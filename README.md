# js-act

[![npm](https://img.shields.io/npm/v/js-act)](https://www.npmjs.com/package/js-act)
[![jsdelivr](https://img.shields.io/jsdelivr/npm/hw/js-act)](https://www.jsdelivr.com/package/npm/js-act)
[![license](https://img.shields.io/npm/l/js-act)](LICENSE)

> Lightweight SSR-first frontend library with fine-grained signals and island architecture.

**8 kB gzipped. Zero runtime dependencies. Works with a script tag or npm.**

---

## Create a new app

The fastest way to get started — scaffold a project in one command:

```bash
npx js-act create my-app
cd my-app
npm install
npm run dev        # → http://localhost:3410
```

TypeScript by default. Add `--template javascript` for plain JS.

```bash
npm run build      # → dist/index.html (opens without a server)
```

> Requires Node.js 20+.

---

## Or add to an existing project

```bash
npm install js-act
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { actjsPlugin } from 'js-act/vite';

export default defineConfig({
  plugins: [actjsPlugin()], // wires up JSX transform automatically
});
```

```tsx
// src/main.tsx
import { component, signal, createApp } from 'js-act';

const Counter = component(() => {
  const [count, setCount] = signal(0);

  return () => (
    <div>
      <p>Count: {count()}</p>
      <button onclick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}, { hydrate: 'interactive' });

createApp('#root').mount(Counter);
```

---

## Or drop in a script tag (no build step)

```html
<script src="https://cdn.jsdelivr.net/npm/js-act/dist/actjs.iife.js"></script>
<script>
  const { component, signal, el, createApp } = actjs;

  const Counter = component(() => {
    const [count, setCount] = signal(0);
    return () => el.div(null,
      el.p(null, `Count: ${count()}`),
      el.button({ onclick: () => setCount(c => c + 1) }, '+1'),
    );
  }, { hydrate: 'interactive' });

  createApp('#root').mount(Counter);
</script>
```

---

## Why js-act?

| | js-act | React | Vue | Svelte |
|---|---|---|---|---|
| Gzipped size | **8 kB** | 45 kB | 34 kB | 10 kB |
| Runtime deps | **0** | 2 | 1 | 0 |
| SSR built-in | ✅ | ❌ (needs Next) | ❌ (needs Nuxt) | ❌ (needs SvelteKit) |
| Script tag | ✅ | ⚠️ | ⚠️ | ❌ |
| Island hydration | ✅ | ❌ | ❌ | ⚠️ |

---

## Key concepts

### Signals — explicit, fine-grained reactivity

```ts
const [count, setCount] = signal(0);           // read/write pair
const doubled = computed(() => count() * 2);   // auto-tracks deps

// Reading inside a render fn = auto-subscribe to updates
return () => <p>{count()} × 2 = {doubled()}</p>;
```

### Components — setup once, render reactively

```ts
const MyComp = component((props) => {
  // Setup runs ONCE
  const [name, setName] = signal('');
  onMount(() => { /* DOM ready */ });
  onDestroy(() => { /* cleanup */ });
  useInterval(() => tick(), 1000); // auto-clears on destroy

  // Render fn re-runs when signals change
  return () => <input value={name()} onInput={e => setName(e.target.value)} />;
}, { hydrate: 'interactive' });
```

### Island hydration — ship zero JS for static content

```ts
// Static (default) — renders to HTML, zero JS sent to browser
const Header = component(() => () => <header>...</header>);

// Interactive — hydrates immediately
const Counter = component(() => ..., { hydrate: 'interactive' });

// Visible — hydrates only when scrolled into view
const HeavyWidget = component(() => ..., { hydrate: 'visible' });
```

### Router

```ts
import { createRouter, navigate, Link, params } from 'js-act';

const App = createRouter([
  { path: '/',           component: Home },
  { path: '/post/:slug', component: Post },
  { path: '*',           component: NotFound },
]);

// Inside a component:
const { slug } = params(); // reactive — updates on route change
navigate('/post/hello');
```

### SSR

```ts
import { renderToString } from 'js-act/server';

const html = await renderToString(MyPage);
// → "<title>My Page</title><main>...</main>"
```

---

## CLI

```bash
actjs create <name>          # scaffold a new project
actjs dev                    # dev server with HMR
actjs build                  # production build
actjs preview                # preview the build
actjs add <pkg>[@version]    # add a CDN dependency
actjs remove <pkg>           # remove a CDN dependency
```

---

## Contributing

Contributions are welcome! Here's how to get started:

```bash
git clone https://github.com/me-vaisakhr/actjs.git
cd js-act
npm install
npm test           # run the test suite
npm run typecheck  # TypeScript check
npm run build:all  # build all outputs
```

- All source lives in `src/` — one file per module
- Tests live in `tests/` — one file per source module, 100% coverage enforced
- Open an issue before starting large changes so we can align on approach
- PRs should include tests for any new behavior

---

## License

MIT
