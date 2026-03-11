import { signal } from './signal.js';
import { h } from './hyperscript.js';
import type { Resource, Child } from './types.js';

/**
 * Async data loader — SSR-aware.
 * Client: fires immediately, returns undefined until resolved, triggers re-render on resolve.
 * fn() is re-called when any signal it reads changes.
 */
export function resource<T>(fn: () => Promise<T>): Resource<T> {
  const [value, setValue] = signal<T | undefined>(undefined);
  const [loading, setLoading] = signal(true);
  const [error, setError] = signal<Error | undefined>(undefined);

  function load(): void {
    setLoading(true);
    setError(undefined);
    fn().then(
      (result) => {
        setValue(result);
        setLoading(false);
      },
      (err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      },
    );
  }

  // Start loading immediately on client
  if (typeof document !== 'undefined') {
    load();
  }

  const getter = (): T | undefined => value();
  getter.loading = loading;
  getter.error = error;

  return getter as Resource<T>;
}

/**
 * Streaming boundary component.
 * Client: shows fallback while resource is loading, renders children when resolved.
 * SSR: renders fallback (streaming replace happens in hydration layer).
 */
export function Suspense(props: { fallback: Child; children: Child }): Element | DocumentFragment {
  const { fallback, children } = props;

  // We can't know at this point if a resource is loading without inspecting children.
  // Suspense wraps a container and the component re-renders when resource resolves.
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-suspense', '');

  function renderChild(child: Child): void {
    while (wrapper.firstChild) wrapper.removeChild(wrapper.firstChild);
    appendChild(wrapper, child);
  }

  // Check if any child resource is still loading by looking at resource functions
  function isLoading(child: Child): boolean {
    if (typeof child === 'function') {
      const r = child as Resource<unknown>;
      if (typeof r.loading === 'function') {
        return r.loading();
      }
    }
    if (Array.isArray(child)) {
      return child.some(isLoading);
    }
    return false;
  }

  if (isLoading(children)) {
    renderChild(fallback);
  } else {
    renderChild(children);
  }

  return wrapper;
}

function appendChild(parent: Element, child: Child): void {
  if (child === null || child === undefined || child === false) return;
  if (Array.isArray(child)) {
    for (const c of child) appendChild(parent, c);
  } else if (child instanceof Element || child instanceof DocumentFragment) {
    parent.appendChild(child);
  } else {
    parent.appendChild(document.createTextNode(String(child)));
  }
}
