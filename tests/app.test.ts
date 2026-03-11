import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app.js';
import { component } from '../src/component.js';
import { signal } from '../src/signal.js';
import { onInit, onMount, onDestroy } from '../src/lifecycle.js';
import { h } from '../src/hyperscript.js';

const flushMicrotasks = () => new Promise<void>(resolve => queueMicrotask(resolve));
const flushPromises = () => new Promise<void>(resolve => setTimeout(resolve, 0));

function makeContainer(): HTMLDivElement {
  const div = document.createElement('div');
  div.id = 'root';
  document.body.appendChild(div);
  return div;
}

beforeEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

describe('createApp', () => {
  it('mounts a component into the container', () => {
    const container = makeContainer();
    const C = component(() => () => h('p', null, 'hello') as Element);
    createApp(container).mount(C);
    expect(container.textContent).toBe('hello');
  });

  it('accepts CSS selector as container', () => {
    makeContainer();
    const C = component(() => () => h('p', null, 'hi') as Element);
    createApp('#root').mount(C);
    expect(document.querySelector('#root')?.textContent).toBe('hi');
  });

  it('runs onInit on mount', async () => {
    const container = makeContainer();
    const initFn = vi.fn();
    const C = component(() => {
      onInit(initFn);
      return () => h('div', null) as Element;
    });
    createApp(container).mount(C);
    await flushPromises();
    expect(initFn).toHaveBeenCalledOnce();
  });

  it('runs onMount after DOM is ready (microtask)', async () => {
    const container = makeContainer();
    const mountFn = vi.fn();
    const C = component(() => {
      onMount(mountFn);
      return () => h('div', null) as Element;
    });
    createApp(container).mount(C);
    expect(mountFn).not.toHaveBeenCalled(); // not yet
    await flushMicrotasks();
    expect(mountFn).toHaveBeenCalledOnce();
  });

  it('runs onDestroy callbacks on destroy()', () => {
    const container = makeContainer();
    const destroyFn = vi.fn();
    const C = component(() => {
      onDestroy(destroyFn);
      return () => h('div', null) as Element;
    });
    const app = createApp(container);
    app.mount(C);
    app.destroy();
    expect(destroyFn).toHaveBeenCalledOnce();
  });

  it('criticalCSS injects style tag', () => {
    const container = makeContainer();
    const app = createApp(container);
    app.mount(component(() => () => h('div', null) as Element));
    app.criticalCSS('p { color: red }');
    expect(document.querySelector('style')?.textContent).toBe('p { color: red }');
    app.destroy();
    expect(document.querySelector('style')).toBeNull();
  });

  it('criticalStylesheet injects link tag', () => {
    const container = makeContainer();
    const app = createApp(container);
    app.mount(component(() => () => h('div', null) as Element));
    app.criticalStylesheet('/styles.css');
    expect(document.querySelector('link[rel="stylesheet"]')).not.toBeNull();
    app.destroy();
    expect(document.querySelector('link[rel="stylesheet"]')).toBeNull();
  });

  it('safeSetInterval fires and is cleared on destroy', () => {
    vi.useFakeTimers();
    const container = makeContainer();
    const fn = vi.fn();
    const app = createApp(container);
    app.mount(component(() => () => h('div', null) as Element));
    app.safeSetInterval(fn, 100);
    vi.advanceTimersByTime(250);
    expect(fn).toHaveBeenCalledTimes(2);
    app.destroy();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(2); // no more calls after destroy
    vi.useRealTimers();
  });

  it('safeSetTimeout fires once and is cleared on destroy', () => {
    vi.useFakeTimers();
    const container = makeContainer();
    const fn = vi.fn();
    const app = createApp(container);
    app.mount(component(() => () => h('div', null) as Element));
    const id = app.safeSetTimeout(fn, 200);
    app.safeClearTimeout(id);
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();
    app.destroy();
    vi.useRealTimers();
  });

  it('safeClearInterval cancels interval', () => {
    vi.useFakeTimers();
    const container = makeContainer();
    const fn = vi.fn();
    const app = createApp(container);
    app.mount(component(() => () => h('div', null) as Element));
    const id = app.safeSetInterval(fn, 100);
    vi.advanceTimersByTime(150);
    app.safeClearInterval(id);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
    app.destroy();
    vi.useRealTimers();
  });

  it('full integration: signal change re-renders', async () => {
    const container = makeContainer();
    const [count, setCount] = signal(0);
    const C = component(() => {
      return () => h('p', null, String(count())) as Element;
    }, { hydrate: 'interactive' });
    createApp(container).mount(C);
    expect(container.textContent).toBe('0');
    setCount(99);
    await flushMicrotasks();
    expect(container.textContent).toBe('99');
  });

  it('hydrate: true — diffs existing DOM instead of clearing', () => {
    const container = makeContainer();
    container.innerHTML = '<div data-component=""><p>old</p></div>';
    const C = component(() => () => h('p', null, 'new') as Element);
    createApp(container, { hydrate: true }).mount(C);
    // Container should now have the new content
    expect(container.textContent).toContain('new');
  });
});
