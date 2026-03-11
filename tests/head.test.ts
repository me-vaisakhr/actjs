import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useHead, applyHead, renderHeadToString } from '../src/head.js';
import { setCurrentSetup, createSetupContext } from '../src/context.js';

afterEach(() => {
  setCurrentSetup(null);
  // Clean up document.head between tests
  document.head.innerHTML = '';
});

describe('useHead', () => {
  it('stores headConfig in setup context', () => {
    const ctx = createSetupContext();
    setCurrentSetup(ctx);
    useHead({ title: 'My Page' });
    expect(ctx.headConfig?.title).toBe('My Page');
  });

  it('throws when called outside setup', () => {
    expect(() => useHead({ title: 'x' })).toThrow('useHead() must be called inside a component setup function.');
  });
});

describe('applyHead — client', () => {
  it('sets document title', () => {
    const owner = {};
    applyHead({ title: 'Hello' }, owner);
    expect(document.title).toBe('Hello');
  });

  it('injects meta tags', () => {
    const owner = {};
    applyHead({ meta: [{ name: 'description', content: 'test' }] }, owner);
    const meta = document.querySelector('meta[name="description"]');
    expect(meta?.getAttribute('content')).toBe('test');
  });

  it('injects link tags', () => {
    const owner = {};
    applyHead({ link: [{ rel: 'canonical', href: 'https://example.com' }] }, owner);
    const link = document.querySelector('link[rel="canonical"]');
    expect(link?.getAttribute('href')).toBe('https://example.com');
  });

  it('removes old meta/link tags on re-apply', () => {
    const owner = {};
    applyHead({ meta: [{ name: 'description', content: 'first' }] }, owner);
    applyHead({ meta: [{ name: 'description', content: 'second' }] }, owner);
    const metas = document.querySelectorAll('meta[name="description"]');
    expect(metas.length).toBe(1);
    expect(metas[0]?.getAttribute('content')).toBe('second');
  });

  it('different owners do not interfere', () => {
    const owner1 = {};
    const owner2 = {};
    applyHead({ meta: [{ name: 'author', content: 'A' }] }, owner1);
    applyHead({ meta: [{ name: 'keywords', content: 'B' }] }, owner2);
    expect(document.querySelector('meta[name="author"]')).not.toBeNull();
    expect(document.querySelector('meta[name="keywords"]')).not.toBeNull();
  });
});

describe('renderHeadToString — SSR', () => {
  it('renders title tag', () => {
    const out = renderHeadToString({ title: 'My Site' });
    expect(out).toContain('<title>My Site</title>');
  });

  it('renders meta tags', () => {
    const out = renderHeadToString({
      meta: [{ name: 'description', content: 'desc' }],
    });
    expect(out).toContain('name="description"');
    expect(out).toContain('content="desc"');
  });

  it('renders link tags', () => {
    const out = renderHeadToString({
      link: [{ rel: 'canonical', href: 'https://example.com' }],
    });
    expect(out).toContain('rel="canonical"');
  });

  it('escapes HTML in title', () => {
    const out = renderHeadToString({ title: '<script>alert(1)</script>' });
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });

  it('returns empty string for empty config', () => {
    expect(renderHeadToString({})).toBe('');
  });
});
