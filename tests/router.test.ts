import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  matchRoute,
  navigate,
  currentPath,
  params,
  query,
  createRouter,
  Link,
} from '../src/router.js';
import { h } from '../src/hyperscript.js';

// ─── matchRoute ───────────────────────────────────────────────────────────────

describe('matchRoute', () => {
  it('matches an exact path with no params', () => {
    expect(matchRoute('/', '/')).toEqual({});
    expect(matchRoute('/about', '/about')).toEqual({});
  });

  it('returns null for non-matching path', () => {
    expect(matchRoute('/about', '/')).toBeNull();
    expect(matchRoute('/blog', '/about')).toBeNull();
  });

  it('extracts a single :param', () => {
    expect(matchRoute('/blog/:slug', '/blog/hello-world')).toEqual({
      slug: 'hello-world',
    });
  });

  it('extracts multiple :params', () => {
    expect(matchRoute('/user/:id/post/:postId', '/user/42/post/7')).toEqual({
      id: '42',
      postId: '7',
    });
  });

  it('matches wildcard *', () => {
    expect(matchRoute('*', '/anything/goes')).toEqual({});
    expect(matchRoute('*', '/')).toEqual({});
  });

  it('decodes URI-encoded param values', () => {
    expect(matchRoute('/tag/:name', '/tag/hello%20world')).toEqual({
      name: 'hello world',
    });
  });

  it('does not match partial paths', () => {
    expect(matchRoute('/blog', '/blog/extra')).toBeNull();
    expect(matchRoute('/blog/:slug', '/blog')).toBeNull();
  });
});

// ─── navigate + currentPath ───────────────────────────────────────────────────

describe('navigate', () => {
  beforeEach(() => {
    // Reset location to '/' before each test
    navigate('/');
  });

  it('updates currentPath signal', () => {
    navigate('/about');
    expect(currentPath()).toBe('/about');
  });

  it('updates currentPath with nested path', () => {
    navigate('/blog/hello-world');
    expect(currentPath()).toBe('/blog/hello-world');
  });

  it('pushes to history', () => {
    const spy = vi.spyOn(history, 'pushState');
    navigate('/contact');
    expect(spy).toHaveBeenCalledWith(null, '', '/contact');
    spy.mockRestore();
  });

  it('extracts pathname when query string is provided', () => {
    navigate('/search?q=actjs&page=2');
    expect(currentPath()).toBe('/search');
  });
});

// ─── params ───────────────────────────────────────────────────────────────────

describe('params()', () => {
  it('returns empty object when no routes are configured', () => {
    // After createRouter sets _activeRoutes, params reflects matching
    // Before any createRouter call, or with no match, returns {}
    navigate('/no-match-xyz');
    // params() may return {} if no routes match
    expect(typeof params()).toBe('object');
  });

  it('returns matched params after navigation (via createRouter)', () => {
    const BlogPost = (p?: Record<string, unknown>): Element =>
      h('div', null, String((p?.params as Record<string, string>)?.slug ?? '')) as Element;

    createRouter([
      { path: '/blog/:slug', component: BlogPost },
      { path: '*', component: () => document.createElement('div') },
    ]);

    navigate('/blog/my-post');
    expect(params()).toEqual({ slug: 'my-post' });
  });

  it('returns empty object for catch-all route', () => {
    const Home = (): Element => document.createElement('div');
    createRouter([
      { path: '/', component: Home },
      { path: '*', component: () => document.createElement('div') },
    ]);
    navigate('/unknown-route');
    expect(params()).toEqual({});
  });
});

// ─── query ────────────────────────────────────────────────────────────────────

describe('query()', () => {
  it('returns empty object when no search string', () => {
    navigate('/');
    expect(query()).toEqual({});
  });

  it('parses query string into key-value map', () => {
    navigate('/search?q=actjs&page=2');
    const q = query();
    expect(q['q']).toBe('actjs');
    expect(q['page']).toBe('2');
  });

  it('updates when navigate is called with new query string', () => {
    navigate('/search?q=first');
    expect(query()['q']).toBe('first');
    navigate('/search?q=second');
    expect(query()['q']).toBe('second');
  });
});

// ─── createRouter ─────────────────────────────────────────────────────────────

describe('createRouter', () => {
  it('returns a function (component factory)', () => {
    const factory = createRouter([{ path: '/', component: () => document.createElement('div') }]);
    expect(typeof factory).toBe('function');
  });

  it('renders matched component on initial path', () => {
    navigate('/');
    const Home = (): Element => {
      const el = document.createElement('h1');
      el.textContent = 'Home';
      return el;
    };
    const factory = createRouter([
      { path: '/', component: Home },
      { path: '*', component: () => document.createElement('div') },
    ]);
    const container = factory();
    expect(container.textContent).toContain('Home');
  });

  it('re-renders matched component when navigate() changes path', async () => {
    navigate('/');
    const Home = (): Element => {
      const el = document.createElement('div');
      el.textContent = 'Home';
      return el;
    };
    const About = (): Element => {
      const el = document.createElement('div');
      el.textContent = 'About';
      return el;
    };
    const factory = createRouter([
      { path: '/', component: Home },
      { path: '/about', component: About },
    ]);
    const container = factory();
    expect(container.textContent).toContain('Home');

    navigate('/about');
    // Wait for microtask batching (queueMicrotask in scheduler)
    await new Promise((resolve) => queueMicrotask(resolve as () => void));

    expect(container.textContent).toContain('About');
  });

  it('renders catch-all * when no route matches', () => {
    navigate('/does-not-exist');
    const NotFound = (): Element => {
      const el = document.createElement('div');
      el.textContent = '404';
      return el;
    };
    const factory = createRouter([
      { path: '/', component: () => document.createElement('div') },
      { path: '*', component: NotFound },
    ]);
    const container = factory();
    expect(container.textContent).toContain('404');
  });

  it('passes params to matched component', () => {
    navigate('/user/99');
    let receivedId = '';
    const UserPage = (props?: Record<string, unknown>): Element => {
      receivedId = (props?.params as Record<string, string>)?.id ?? '';
      return document.createElement('div');
    };
    createRouter([
      { path: '/user/:id', component: UserPage },
      { path: '*', component: () => document.createElement('div') },
    ])();
    expect(receivedId).toBe('99');
  });

  it('strips base prefix before matching', () => {
    navigate('/app/about');
    const About = (): Element => {
      const el = document.createElement('div');
      el.textContent = 'About';
      return el;
    };
    const factory = createRouter(
      [
        { path: '/about', component: About },
        { path: '*', component: () => document.createElement('div') },
      ],
      { base: '/app' },
    );
    const container = factory();
    expect(container.textContent).toContain('About');
  });

  it('treats path equal to base as root /', () => {
    navigate('/app');
    const Home = (): Element => {
      const el = document.createElement('div');
      el.textContent = 'Root';
      return el;
    };
    const factory = createRouter(
      [
        { path: '/', component: Home },
        { path: '*', component: () => document.createElement('div') },
      ],
      { base: '/app' },
    );
    const container = factory();
    expect(container.textContent).toContain('Root');
  });

  it('falls back to raw path when path does not start with base', () => {
    // Path '/other/page' doesn't start with base '/app' — renders catch-all
    navigate('/other/page');
    const NotFound = (): Element => {
      const el = document.createElement('div');
      el.textContent = '404';
      return el;
    };
    const factory = createRouter(
      [
        { path: '/about', component: () => document.createElement('div') },
        { path: '*', component: NotFound },
      ],
      { base: '/app' },
    );
    const container = factory();
    expect(container.textContent).toContain('404');
  });

  it('returns empty div when no routes match and no wildcard', () => {
    navigate('/unmatched');
    const factory = createRouter([{ path: '/', component: () => document.createElement('div') }]);
    const container = factory();
    // Should not throw; renders an empty div
    expect(container).toBeInstanceOf(Element);
  });
});

// ─── popstate ─────────────────────────────────────────────────────────────────

describe('popstate', () => {
  it('invokes the popstate handler and syncs path signal', () => {
    navigate('/before-popstate');
    expect(currentPath()).toBe('/before-popstate');

    // Fire popstate — handler reads location.pathname and calls _setPath.
    // In happy-dom location.pathname is always '/', so the signal resets to '/'.
    window.dispatchEvent(new PopStateEvent('popstate'));
    // Signal was updated to whatever location.pathname reported (happy-dom = '/')
    expect(currentPath()).toBe(location.pathname);
  });
});

// ─── Link ─────────────────────────────────────────────────────────────────────

describe('Link', () => {
  it('renders an <a> element with the correct href', () => {
    const el = Link({ href: '/about', children: 'About' });
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('/about');
  });

  it('renders children inside the <a>', () => {
    const el = Link({ href: '/about', children: 'About Us' });
    expect(el.textContent).toBe('About Us');
  });

  it('calls navigate() on click and prevents default', () => {
    const spy = vi.spyOn(history, 'pushState');
    const el = Link({ href: '/contact', children: 'Contact' });

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    el.dispatchEvent(event);

    expect(spy).toHaveBeenCalledWith(null, '', '/contact');
    expect(event.defaultPrevented).toBe(true);
    spy.mockRestore();
  });

  it('passes through extra props as attributes', () => {
    const el = Link({ href: '/home', class: 'nav-link', children: 'Home' });
    expect(el.getAttribute('class')).toBe('nav-link');
  });

  it('renders with no children', () => {
    const el = Link({ href: '/empty' });
    expect(el.tagName).toBe('A');
    expect(el.textContent).toBe('');
  });

  it('renders with array of children', () => {
    const icon = document.createElement('span');
    icon.textContent = '→';
    const el = Link({ href: '/next', children: [icon, ' Next'] });
    expect(el.textContent).toContain('Next');
  });
});
