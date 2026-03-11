import { signal, computed } from './signal.js';
import { component } from './component.js';
import { h } from './hyperscript.js';
import type { Child, Route, RouterOptions } from './types.js';

// ─── Module-level router state ────────────────────────────────────────────────

const safePathname = (): string =>
  /* c8 ignore next */
  typeof location !== 'undefined' ? location.pathname : '/';

const safeSearch = (): string =>
  /* c8 ignore next */
  typeof location !== 'undefined' ? location.search : '';

const [_path, _setPath] = signal(safePathname());
const [_search, _setSearch] = signal(safeSearch());

/** List of routes set by the most recent createRouter() call. */
let _activeRoutes: Route[] = [];
let _base = '';

// ─── Route matching ───────────────────────────────────────────────────────────

/**
 * Match a route pattern against a pathname.
 * Returns extracted params if matched, null if not.
 * Supports `:param` segments and `*` wildcard.
 */
export function matchRoute(
  pattern: string,
  pathname: string,
): Record<string, string> | null {
  if (pattern === '*') return {};

  const keys: string[] = [];
  const regexStr = pattern.replace(/:([^/]+)/g, (_: string, key: string) => {
    keys.push(key);
    return '([^/]+)';
  });

  const regex = new RegExp(`^${regexStr}$`);
  const m = pathname.match(regex);
  if (!m) return null;

  const paramResult: Record<string, string> = {};
  keys.forEach((k, i) => {
    /* c8 ignore next */
    paramResult[k] = decodeURIComponent(m[i + 1] ?? '');
  });
  return paramResult;
}

function normalize(path: string): string {
  if (!_base) return path;
  return path.startsWith(_base) ? path.slice(_base.length) || '/' : path;
}

function findMatch(
  path: string,
): { route: Route; params: Record<string, string> } | null {
  const normalized = normalize(path);
  for (const route of _activeRoutes) {
    const p = matchRoute(route.path, normalized);
    if (p !== null) return { route, params: p };
  }
  return null;
}

// ─── Public reactive getters ──────────────────────────────────────────────────

/** Reactive getter for the current pathname. Subscribes caller to path changes. */
export const currentPath: () => string = _path;

/**
 * Reactive getter for current route params.
 * Reading params() inside a component render auto-subscribes to route changes.
 */
export const params: () => Record<string, string> = computed(() => {
  const path = _path(); // track
  return findMatch(path)?.params ?? {};
});

/**
 * Reactive getter for current URL query string as a key-value map.
 * Reading query() inside a component render auto-subscribes to route changes.
 */
export const query: () => Record<string, string> = computed(() => {
  const search = _search(); // track — re-evaluates when navigate() updates search
  const queryResult: Record<string, string> = {};
  new URLSearchParams(search).forEach((v, k) => {
    queryResult[k] = v;
  });
  return queryResult;
});

// ─── Navigation ───────────────────────────────────────────────────────────────

/**
 * Programmatic navigation. Pushes to browser history and updates path signal.
 * No-op during SSR.
 */
export function navigate(to: string): void {
  /* c8 ignore next */
  if (typeof history === 'undefined') return;
  history.pushState(null, '', to);
  const qIdx = to.indexOf('?');
  const pathname = qIdx !== -1 ? to.slice(0, qIdx) : to;
  const search = qIdx !== -1 ? to.slice(qIdx) : '';
  _setPath(pathname);
  _setSearch(search);
}

// Sync signal on browser back/forward
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    _setPath(location.pathname);
    _setSearch(location.search);
  });
}

// ─── Link component ───────────────────────────────────────────────────────────

/**
 * Declarative navigation link. Renders an <a> that calls navigate() on click.
 * Prevents full page reload.
 * Props: href (required), class?, and any other valid <a> attributes.
 */
export function Link(props: Record<string, unknown>): Element {
  const { href, children, ...rest } = props;
  const childrenArr: Child[] = Array.isArray(children)
    ? (children as Child[])
    : children !== undefined
      ? [children as Child]
      : [];

  return h(
    'a',
    {
      ...rest,
      href,
      onclick: (e: Event) => {
        e.preventDefault();
        navigate(href as string);
      },
    },
    ...childrenArr,
  ) as Element;
}

// ─── Router factory ───────────────────────────────────────────────────────────

/**
 * Create a router component from a list of routes.
 * Returns a component factory compatible with createApp().mount().
 *
 * Routes are matched top-to-bottom. Use `*` as the last route for 404.
 *
 * @example
 * const App = createRouter([
 *   { path: '/',           component: Home },
 *   { path: '/blog/:slug', component: BlogPost },
 *   { path: '*',           component: NotFound },
 * ]);
 * createApp('#root').mount(App);
 */
export function createRouter(
  routes: Route[],
  options: RouterOptions = {},
): () => Element {
  _activeRoutes = routes;
  _base = options.base ?? '';

  const RouterComponent = component(
    () => {
      return (): Element => {
        const path = _path(); // subscribe — re-renders when navigate() fires
        const normalized = normalize(path);

        for (const route of routes) {
          const extractedParams = matchRoute(route.path, normalized);
          if (extractedParams !== null) {
            return route.component({ params: extractedParams });
          }
        }

        // No match — return empty div (user should add a '*' catch-all)
        return document.createElement('div');
      };
    },
    { hydrate: 'interactive' },
  );

  return RouterComponent;
}
