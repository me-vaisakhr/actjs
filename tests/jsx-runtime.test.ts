import { describe, it, expect, vi } from 'vitest';
import { jsx, jsxs, jsxDEV, Fragment } from '../src/jsx-runtime.js';
import { h, Fragment as HFragment } from '../src/hyperscript.js';

describe('jsx()', () => {
  it('creates element by tag string', () => {
    const el = jsx('p', {}) as Element;
    expect(el.tagName).toBe('P');
  });

  it('sets props as attributes', () => {
    const el = jsx('div', { class: 'foo', id: 'bar' }) as Element;
    expect(el.getAttribute('class')).toBe('foo');
    expect(el.getAttribute('id')).toBe('bar');
  });

  it('passes single child', () => {
    const el = jsx('p', { children: 'hello' }) as Element;
    expect(el.textContent).toBe('hello');
  });

  it('passes array children', () => {
    const child1 = h('span', null, 'a') as Element;
    const child2 = h('span', null, 'b') as Element;
    const el = jsx('div', { children: [child1, child2] }) as Element;
    expect(el.children.length).toBe(2);
  });

  it('handles no children', () => {
    const el = jsx('div', {}) as Element;
    expect(el.childNodes.length).toBe(0);
  });

  it('calls function component with merged props', () => {
    const MyComp = vi.fn(({ name }: { name: string }) => h('span', null, name) as Element);
    jsx(MyComp as unknown as string, { name: 'world' });
    expect(MyComp).toHaveBeenCalledWith(expect.objectContaining({ name: 'world' }));
  });

  it('ignores _key parameter', () => {
    const el = jsx('div', { class: 'x' }, 'my-key') as Element;
    expect(el.tagName).toBe('DIV');
    expect(el.getAttribute('class')).toBe('x');
  });

  it('adds event listener for on* props', () => {
    const handler = vi.fn();
    const el = jsx('button', { onclick: handler }) as Element;
    el.dispatchEvent(new MouseEvent('click'));
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('jsxs()', () => {
  it('matches jsx() for multiple children', () => {
    const child1 = h('li', null, 'a') as Element;
    const child2 = h('li', null, 'b') as Element;
    const el = jsxs('ul', { children: [child1, child2] }) as Element;
    expect(el.children.length).toBe(2);
  });

  it('creates same element as h()', () => {
    const viaJsxs = jsxs('p', { children: 'hello' }) as Element;
    const viaH = h('p', null, 'hello') as Element;
    expect(viaJsxs.tagName).toBe(viaH.tagName);
    expect(viaJsxs.textContent).toBe(viaH.textContent);
  });
});

describe('jsxDEV()', () => {
  it('behaves identically to jsx()', () => {
    const el = jsxDEV('section', { class: 'dev' }) as Element;
    expect(el.tagName).toBe('SECTION');
    expect(el.getAttribute('class')).toBe('dev');
  });
});

describe('Fragment', () => {
  it('is the same as hyperscript Fragment', () => {
    expect(Fragment).toBe(HFragment);
  });

  it('via jsx() produces a DocumentFragment', () => {
    const child = h('p', null, 'x') as Element;
    const frag = jsx(Fragment as unknown as string, { children: child });
    expect(frag).toBeInstanceOf(DocumentFragment);
  });
});
