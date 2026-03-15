// Template file contents for `create-actjs`.
// Each exported function returns a map of { relative-path → file-content }.

function sharedStyleCss(): string {
  return `*,
*::before,
*::after { box-sizing: border-box; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 480px;
  margin: 4rem auto;
  padding: 1rem;
  background: #fff;
  color: #111;
}

h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }

input[type="text"] {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

button {
  padding: 0.5rem 1.25rem;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  font-size: 1rem;
}

button.primary {
  background: #0070f3;
  color: #fff;
  border-color: #0070f3;
}

button.primary:hover { background: #005fd3; }

.greeting {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.count {
  font-size: 2rem;
  font-weight: 700;
  min-width: 3rem;
  text-align: center;
}

.muted { color: #6b7280; font-size: 0.9rem; }
`;
}

function sharedPackageJson(name: string, binCmd: string, actjsDep?: string): string {
  const pkg: Record<string, unknown> = {
    name,
    version: '0.1.0',
    type: 'module',
    scripts: { dev: `${binCmd} dev`, build: `${binCmd} build` },
  };
  if (actjsDep) pkg['devDependencies'] = { actjs: actjsDep };
  return JSON.stringify(pkg, null, 2) + '\n';
}

const sharedGitignore = 'node_modules\ndist\n';

function sharedViteConfig(): string {
  return `import { defineConfig } from 'vite';
import { actjsPlugin } from 'actjs/vite';

export default defineConfig({
  plugins: [actjsPlugin()],
});
`;
}

function sharedReadme(name: string): string {
  return `# ${name}

A project built with [actjs](https://github.com/vaisakhrkrishnan/actjs) — a lightweight, SSR-first frontend framework.

## Getting started

\`\`\`sh
npm install
npm run dev
\`\`\`

## Scripts

| Command | Description |
|---------|-------------|
| \`npm run dev\` | Start development server with hot reload |
| \`npm run build\` | Production build to \`dist/\` |
`;
}

// ─── TypeScript template ──────────────────────────────────────────────────────

export function tsTemplate(name: string, binCmd: string, actjsDep?: string): Record<string, string> {
  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./src/main.tsx"></script>
</body>
</html>
`,

    'src/main.tsx': `import { component, signal, computed, createApp } from 'actjs';

const App = component(() => {
  const [name, setName]   = signal('');
  const [count, setCount] = signal(0);

  const greeting = computed(() => {
    const n = name().trim();
    return n ? \`Hello, \${n}!\` : 'Enter your name below.';
  });

  const summary = computed(() =>
    count() === 0
      ? 'No clicks yet.'
      : \`Clicked \${count()} time\${count() === 1 ? '' : 's'}.\`
  );

  return () => (
    <div>
      <h1>${name}</h1>

      <p class="greeting">{greeting()}</p>
      <input
        type="text"
        placeholder="Your name"
        value={name()}
        onInput={(e: Event) => setName((e.target as HTMLInputElement).value)}
      />

      <div class="row">
        <button type="button" onClick={() => setCount(c => c - 1)}>−</button>
        <span class="count">{count()}</span>
        <button type="button" class="primary" onClick={() => setCount(c => c + 1)}>+</button>
      </div>
      <p class="muted">{summary()}</p>
    </div>
  );
}, { hydrate: 'interactive' });

createApp('#root').mount(App);
`,

    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "actjs",
    "strict": true,
    "skipLibCheck": true,
    "paths": {
      "actjs": ["./vendor/actjs/index"],
      "actjs/jsx-runtime": ["./vendor/actjs/jsx-runtime"]
    }
  },
  "include": ["src"]
}
`,

    'vite.config.ts': sharedViteConfig(),
    'README.md':      sharedReadme(name),
    'style.css':      sharedStyleCss(),
    'package.json':   sharedPackageJson(name, binCmd, actjsDep),
    '.gitignore':     sharedGitignore,
  };
}

// ─── JavaScript template ──────────────────────────────────────────────────────

export function jsTemplate(name: string, binCmd: string, actjsDep?: string): Record<string, string> {
  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./src/main.jsx"></script>
</body>
</html>
`,

    'src/main.jsx': `import { component, signal, computed, createApp } from 'actjs';

const App = component(() => {
  const [name, setName]   = signal('');
  const [count, setCount] = signal(0);

  const greeting = computed(() => {
    const n = name().trim();
    return n ? \`Hello, \${n}!\` : 'Enter your name below.';
  });

  const summary = computed(() =>
    count() === 0
      ? 'No clicks yet.'
      : \`Clicked \${count()} time\${count() === 1 ? '' : 's'}.\`
  );

  return () => (
    <div>
      <h1>${name}</h1>

      <p class="greeting">{greeting()}</p>
      <input
        type="text"
        placeholder="Your name"
        value={name()}
        onInput={(e) => setName(e.target.value)}
      />

      <div class="row">
        <button type="button" onClick={() => setCount(c => c - 1)}>−</button>
        <span class="count">{count()}</span>
        <button type="button" class="primary" onClick={() => setCount(c => c + 1)}>+</button>
      </div>
      <p class="muted">{summary()}</p>
    </div>
  );
}, { hydrate: 'interactive' });

createApp('#root').mount(App);
`,

    'vite.config.js': sharedViteConfig(),
    'README.md':      sharedReadme(name),
    'style.css':      sharedStyleCss(),
    'package.json':   sharedPackageJson(name, binCmd, actjsDep),
    '.gitignore':     sharedGitignore,
  };
}
