import { component, signal, el } from 'actjs';

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
      content = el.div(
        el.div({ style: 'font-size:2rem;font-family:var(--font-display);font-weight:800;color:var(--red)' }, '404'),
        el.div({ class: 'd-muted', style: 'font-size:0.85rem' }, `No route matched "${path}"`),
      );
    } else if (match.route.path === '/' || match.route.path === '/about') {
      content = el.div(
        el.div({ style: 'font-size:1.25rem;font-family:var(--font-display);font-weight:700;margin-bottom:0.3rem' }, match.route.label),
        el.div({ class: 'd-muted', style: 'font-size:0.85rem' }, `Matched route: ${match.route.path}`),
      );
    } else {
      content = el.div(
        el.div({ style: 'font-size:1.1rem;font-family:var(--font-display);font-weight:700;margin-bottom:0.3rem' }, match.route.label),
        el.div({ class: 'd-value' }, `params = ${JSON.stringify(p)}`),
      );
    }

    const navLinks = [
      ['/', '/'],
      ['/about', '/about'],
      ['/blog/hello-world', '/blog/hello-world'],
      ['/blog/actjs-intro', '/blog/actjs-intro'],
      ['/user/42', '/user/42'],
      ['/missing', '/missing'],
    ] as [string, string][];

    return el.div({ class: 'router-demo' },
      el.div({ class: 'router-bar' },
        el.div({ class: 'router-dot', style: 'background:var(--red)' }),
        el.div({ class: 'router-dot', style: 'background:var(--accent3)' }),
        el.div({ class: 'router-dot', style: 'background:var(--green)' }),
        el.div({ class: 'router-url' }, path),
      ),
      el.div({ class: 'router-content' }, content),
      el.div({ class: 'router-nav' },
        ...navLinks.map(([to, label]) =>
          el.button({ class: 'router-link', onclick: () => demoNavigate(to) }, label)
        ),
      ),
    );
  };
}, { hydrate: 'interactive' });
