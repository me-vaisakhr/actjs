import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resource, Suspense } from '../src/resource.js';

const flushMicrotasks = () => new Promise<void>(resolve => queueMicrotask(resolve));
const flushPromises = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe('resource()', () => {
  it('starts with loading=true and value=undefined', () => {
    const r = resource(() => new Promise(() => {})); // never resolves
    expect(r()).toBeUndefined();
    expect(r.loading()).toBe(true);
    expect(r.error()).toBeUndefined();
  });

  it('resolves value and sets loading=false', async () => {
    const r = resource(() => Promise.resolve(42));
    await flushPromises();
    expect(r()).toBe(42);
    expect(r.loading()).toBe(false);
    expect(r.error()).toBeUndefined();
  });

  it('captures error and sets loading=false', async () => {
    const r = resource(() => Promise.reject(new Error('fail')));
    await flushPromises();
    expect(r()).toBeUndefined();
    expect(r.loading()).toBe(false);
    expect(r.error()?.message).toBe('fail');
  });

  it('wraps non-Error rejection in Error', async () => {
    const r = resource(() => Promise.reject('string error'));
    await flushPromises();
    expect(r.error()).toBeInstanceOf(Error);
    expect(r.error()?.message).toBe('string error');
  });
});

describe('Suspense', () => {
  it('renders fallback when resource is loading', () => {
    const r = resource(() => new Promise(() => {})); // never resolves
    const el = Suspense({
      fallback: 'Loading...',
      children: r as unknown as string,
    }) as Element;
    expect(el.textContent).toBe('Loading...');
  });

  it('renders children when resource is resolved', async () => {
    const r = resource(() => Promise.resolve('data'));
    await flushPromises();
    // r.loading() is false now — Suspense should render children
    const el = Suspense({
      fallback: 'Loading...',
      children: 'Loaded!',
    }) as Element;
    expect(el.textContent).toBe('Loaded!');
  });

  it('has data-suspense attribute', () => {
    const el = Suspense({ fallback: 'Loading...', children: 'done' }) as Element;
    expect(el.getAttribute('data-suspense')).toBe('');
  });

  it('renders children when not loading (plain string child)', () => {
    const el = Suspense({ fallback: 'fallback', children: 'hello' }) as Element;
    expect(el.textContent).toBe('hello');
  });
});
