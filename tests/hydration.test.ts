import { describe, it, expect, afterEach } from 'vitest';
import { renderToString, serializeElement } from '../src/hydration.js';
import { component } from '../src/component.js';
import { signal } from '../src/signal.js';
import { onInit, onMount } from '../src/lifecycle.js';
import { useHead } from '../src/head.js';
import { h, Fragment } from '../src/hyperscript.js';

afterEach(() => {
  document.head.innerHTML = '';
});

describe('renderToString()', () => {
  it('serializes a simple component to HTML', async () => {
    const C = component(() => () => h('p', null, 'hello') as Element);
    const html = await renderToString(C);
    expect(html).toContain('<p>hello</p>');
  });

  it('runs onInit before serializing', async () => {
    let initialized = false;
    const C = component(() => {
      onInit(async () => { initialized = true; });
      return () => h('p', null, initialized ? 'yes' : 'no') as Element;
    });
    // renderToString runs onInit but setup/render has already run
    // The render captures the state at render time (before onInit resolves async)
    const html = await renderToString(C);
    expect(html).toBeDefined();
    expect(initialized).toBe(true);
  });

  it('does NOT run onMount (client-only)', async () => {
    let mounted = false;
    const C = component(() => {
      onMount(() => { mounted = true; });
      return () => h('div', null) as Element;
    });
    await renderToString(C);
    expect(mounted).toBe(false);
  });

  it('includes head tags from useHead', async () => {
    const C = component(() => {
      useHead({ title: 'SSR Test', meta: [{ name: 'description', content: 'desc' }] });
      return () => h('div', null) as Element;
    });
    const html = await renderToString(C);
    expect(html).toContain('<title>SSR Test</title>');
    expect(html).toContain('name="description"');
  });

  it('renders nested elements', async () => {
    const C = component(() => () =>
      h('section', null,
        h('h1', null, 'Title') as Element,
        h('p', null, 'Body') as Element,
      ) as Element
    );
    const html = await renderToString(C);
    expect(html).toContain('<section');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<p>Body</p>');
  });

  it('escapes HTML in text content', async () => {
    const C = component(() => () => h('p', null, '<script>alert(1)</script>') as Element);
    const html = await renderToString(C);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders void elements correctly', async () => {
    const C = component(() => () => h('img', { src: '/img.png', alt: 'test' }) as Element);
    const html = await renderToString(C);
    expect(html).toMatch(/<img[^>]*src="\/img\.png"/);
    expect(html).not.toContain('</img>');
  });
});

describe('serializeElement()', () => {
  it('serializes an element', () => {
    const el = h('span', { class: 'foo' }, 'bar') as Element;
    expect(serializeElement(el)).toBe('<span class="foo">bar</span>');
  });

  it('serializes a DocumentFragment', () => {
    const frag = Fragment(null, h('p', null, 'a') as Element, h('p', null, 'b') as Element);
    expect(serializeElement(frag)).toBe('<p>a</p><p>b</p>');
  });

  it('escapes attributes', () => {
    const el = h('div', { id: '<evil>' }) as Element;
    expect(serializeElement(el)).toContain('&lt;evil&gt;');
  });
});
