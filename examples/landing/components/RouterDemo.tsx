import { component, signal } from 'js-act';

interface Route {
  path: string;
  label: string;
}

const routes: Route[] = [
  { path: '/',           label: 'Home' },
  { path: '/about',      label: 'About' },
  { path: '/blog/:slug', label: 'Blog post' },
  { path: '/user/:id',   label: 'User page' },
  { path: '*',           label: 'Not Found' },
];

function matchLocal(pattern: string, pathname: string): Record<string, string> | null {
  if (pattern === '*') return {};
  const keys: string[] = [];
  const regexStr = pattern.replace(/:([^/]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; });
  const m = pathname.match(new RegExp(`^${regexStr}$`));
  if (!m) return null;
  const result: Record<string, string> = {};
  keys.forEach((k, i) => { result[k] = m[i + 1] ?? ''; });
  return result;
}

function findMatch(path: string) {
  for (const route of routes) {
    const p = matchLocal(route.path, path);
    if (p !== null) return { route, params: p };
  }
  return null;
}

const navLinks: [string, string][] = [
  ['/', '/'],
  ['/about', '/about'],
  ['/blog/hello-world', '/blog/hello-world'],
  ['/blog/actjs-intro', '/blog/actjs-intro'],
  ['/user/42', '/user/42'],
  ['/missing', '/missing'],
];

export const RouterDemo = component(() => {
  const [demoPath, setDemoPath] = signal('/');
  const [demoParams, setDemoParams] = signal<Record<string, string>>({});

  const demoNavigate = (to: string) => {
    setDemoPath(to);
    const m = findMatch(to);
    setDemoParams(m ? m.params : {});
  };

  return () => {
    const path = demoPath();
    const p = demoParams();
    const match = findMatch(path);

    let content: Element | DocumentFragment;
    if (!match || match.route.path === '*') {
      content = (
        <div>
          <div class="rd-404">404</div>
          <div class="d-muted">{`No route matched "${path}"`}</div>
        </div>
      );
    } else if (match.route.path === '/' || match.route.path === '/about') {
      content = (
        <div>
          <div class="rd-title-lg">{match.route.label}</div>
          <div class="d-muted">{`Matched route: ${match.route.path}`}</div>
        </div>
      );
    } else {
      content = (
        <div>
          <div class="rd-title-sm">{match.route.label}</div>
          <div class="d-value">{`params = ${JSON.stringify(p)}`}</div>
        </div>
      );
    }

    return (
      <div class="router-demo">
        <div class="router-bar">
          <div class="router-dot router-dot-red" />
          <div class="router-dot router-dot-amber" />
          <div class="router-dot router-dot-green" />
          <div class="router-url">{path}</div>
        </div>
        <div class="router-content">{content}</div>
        <div class="router-nav">
          {navLinks.map(([to, label]) => (
            <button type="button" class="router-link" onClick={() => demoNavigate(to)}>{label}</button>
          ))}
        </div>
      </div>
    );
  };
}, { hydrate: 'interactive' });
