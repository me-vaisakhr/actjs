import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { component } from '../src/component.js';
import { signal } from '../src/signal.js';
import { onInit, onMount, onDestroy } from '../src/lifecycle.js';
import { useHead } from '../src/head.js';
import { h } from '../src/hyperscript.js';

const flushMicrotasks = () => new Promise<void>(resolve => queueMicrotask(resolve));

beforeEach(() => {
  document.head.innerHTML = '';
});

afterEach(() => {
  document.head.innerHTML = '';
});

describe('component()', () => {
  it('renders output into a container div', () => {
    const MyComp = component(() => {
      return () => h('p', null, 'hello') as Element;
    });
    const el = MyComp();
    expect(el.tagName).toBe('DIV');
    expect(el.querySelector('p')?.textContent).toBe('hello');
  });

  it('has data-component attribute', () => {
    const MyComp = component(() => () => h('span', null, 'x') as Element);
    const el = MyComp();
    expect(el.getAttribute('data-component')).toBe('');
  });

  it('re-renders when signal changes', async () => {
    const MyComp = component(() => {
      const [count, setCount] = signal(0);
      return () => h('p', null, String(count())) as Element;
    }, { hydrate: 'interactive' });

    const el = MyComp();
    expect(el.querySelector('p')?.textContent).toBe('0');

    // Trigger signal update — need to get setter from outside
    // Test via exposed signal
    const [count, setCount] = signal(0);
    const Comp2 = component(() => {
      return () => h('p', null, String(count())) as Element;
    }, { hydrate: 'interactive' });
    const el2 = Comp2();
    expect(el2.querySelector('p')?.textContent).toBe('0');
    setCount(5);
    await flushMicrotasks();
    expect(el2.querySelector('p')?.textContent).toBe('5');
  });

  it('accepts props', () => {
    const Greeter = component<{ name: string }>((props) => {
      return () => h('p', null, `Hello ${props.name}`) as Element;
    });
    const el = Greeter({ name: 'world' });
    expect(el.textContent).toBe('Hello world');
  });

  it('static hydrate (default): does not set data-hydrate', () => {
    const C = component(() => () => h('div', null) as Element);
    const el = C();
    expect(el.hasAttribute('data-hydrate')).toBe(false);
  });

  it('interactive hydrate: sets data-hydrate="interactive"', () => {
    const C = component(() => () => h('div', null) as Element, { hydrate: 'interactive' });
    const el = C();
    expect(el.getAttribute('data-hydrate')).toBe('interactive');
  });

  it('visible hydrate: sets data-hydrate="visible"', () => {
    const C = component(() => () => h('div', null) as Element, { hydrate: 'visible' });
    const el = C();
    expect(el.getAttribute('data-hydrate')).toBe('visible');
  });

  it('registers and executes onInit', async () => {
    const initFn = vi.fn();
    const C = component(() => {
      onInit(initFn);
      return () => h('div', null) as Element;
    });
    C();
    // onInit is run asynchronously by component() via Promise.all
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    expect(initFn).toHaveBeenCalledOnce();
  });

  it('registers onMount and onDestroy without errors', () => {
    const mountFn = vi.fn();
    const destroyFn = vi.fn();
    const C = component(() => {
      onMount(mountFn);
      onDestroy(destroyFn);
      return () => h('div', null) as Element;
    });
    expect(() => C()).not.toThrow();
  });

  it('applies useHead on render', () => {
    const C = component(() => {
      useHead({ title: 'Test Page' });
      return () => h('div', null) as Element;
    });
    C();
    expect(document.title).toBe('Test Page');
  });

  it('setup runs only once (not on each re-render)', async () => {
    const setupFn = vi.fn();
    const [count, setCount] = signal(0);
    const C = component(() => {
      setupFn();
      return () => h('p', null, String(count())) as Element;
    }, { hydrate: 'interactive' });
    C();
    setCount(1);
    await flushMicrotasks();
    setCount(2);
    await flushMicrotasks();
    expect(setupFn).toHaveBeenCalledOnce();
  });

  it('visible: renders when IntersectionObserver not available', () => {
    const origIO = (globalThis as Record<string, unknown>)['IntersectionObserver'];
    delete (globalThis as Record<string, unknown>)['IntersectionObserver'];
    const C = component(() => () => h('p', null, 'visible') as Element, { hydrate: 'visible' });
    const el = C();
    expect(el.textContent).toBe('visible');
    (globalThis as Record<string, unknown>)['IntersectionObserver'] = origIO;
  });
});
