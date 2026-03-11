import { describe, it, expect, vi } from 'vitest';
import { h, Fragment, ref, el } from '../src/hyperscript.js';

describe('h()', () => {
  it('creates element by tag name', () => {
    const div = h('div') as Element;
    expect(div.tagName).toBe('DIV');
  });

  it('sets string attributes', () => {
    const btn = h('button', { class: 'primary', type: 'button' }) as Element;
    expect(btn.getAttribute('class')).toBe('primary');
    expect(btn.getAttribute('type')).toBe('button');
  });

  it('sets boolean attribute as empty string when true', () => {
    const input = h('input', { disabled: true }) as Element;
    expect(input.getAttribute('disabled')).toBe('');
  });

  it('removes boolean attribute when false', () => {
    const input = h('input', { disabled: false }) as Element;
    expect(input.hasAttribute('disabled')).toBe(false);
  });

  it('omits null/undefined attribute values', () => {
    const div = h('div', { id: null, class: undefined }) as Element;
    expect(div.hasAttribute('id')).toBe(false);
    expect(div.hasAttribute('class')).toBe(false);
  });

  it('adds event listener for on* props', () => {
    const handler = vi.fn();
    const btn = h('button', { onclick: handler }) as Element;
    btn.dispatchEvent(new MouseEvent('click'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('populates ref.current', () => {
    const r = ref<HTMLButtonElement>();
    h('button', { ref: r });
    expect(r.current).toBeInstanceOf(Element);
    expect((r.current as Element).tagName).toBe('BUTTON');
  });

  it('appends string children as text nodes', () => {
    const p = h('p', null, 'hello') as Element;
    expect(p.textContent).toBe('hello');
  });

  it('appends number children', () => {
    const span = h('span', null, 42) as Element;
    expect(span.textContent).toBe('42');
  });

  it('omits null/undefined/false children', () => {
    const div = h('div', null, null, undefined, false, 'visible') as Element;
    expect(div.textContent).toBe('visible');
  });

  it('appends element children', () => {
    const span = h('span', null, 'text') as Element;
    const div = h('div', null, span) as Element;
    expect(div.firstChild).toBe(span);
  });

  it('flattens nested child arrays', () => {
    const children = [h('span', null, '1') as Element, [h('span', null, '2') as Element]];
    const div = h('div', null, children) as Element;
    expect(div.children.length).toBe(2);
  });

  it('calls function tag with props', () => {
    const MyComp = vi.fn(() => h('section', null, 'hi'));
    h(MyComp, { id: 'test' });
    expect(MyComp).toHaveBeenCalledWith(expect.objectContaining({ id: 'test' }));
  });

  it('className is treated as class attribute', () => {
    const div = h('div', { className: 'foo' }) as Element;
    expect(div.getAttribute('class')).toBe('foo');
  });

  it('style object is applied', () => {
    const div = h('div', { style: { color: 'red' } }) as HTMLElement;
    expect((div as HTMLElement).style.color).toBe('red');
  });
});

describe('Fragment', () => {
  it('returns a DocumentFragment', () => {
    const frag = Fragment(null);
    expect(frag).toBeInstanceOf(DocumentFragment);
  });

  it('appends children into fragment', () => {
    const frag = Fragment(null, 'hello', h('span', null, 'world') as Element);
    expect(frag.childNodes.length).toBe(2);
  });

  it('handles children prop (JSX style)', () => {
    const span = h('span', null, 'x') as Element;
    const frag = Fragment({ children: span });
    expect(frag.firstChild).toBe(span);
  });
});

describe('ref()', () => {
  it('initializes with current = null', () => {
    const r = ref();
    expect(r.current).toBeNull();
  });
});

describe('el proxy', () => {
  it('creates element via el.tagName()', () => {
    const div = el['div']!() as Element;
    expect(div.tagName).toBe('DIV');
  });

  it('passes props and children', () => {
    const btn = el['button']!({ class: 'foo' }, 'click me') as Element;
    expect(btn.getAttribute('class')).toBe('foo');
    expect(btn.textContent).toBe('click me');
  });

  it('adds event listener', () => {
    const handler = vi.fn();
    const btn = el['button']!({ onclick: handler }) as Element;
    btn.dispatchEvent(new MouseEvent('click'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('accepts children without null props', () => {
    const child = el['span']!('hi') as Element;
    const div = el['div']!(child) as Element;
    expect(div.tagName).toBe('DIV');
    expect(div.firstChild).toBe(child);
  });

  it('accepts string children without null props', () => {
    const p = el['p']!('hello world') as Element;
    expect(p.textContent).toBe('hello world');
  });

  it('treats Element first arg as child, not props', () => {
    const inner = el['span']!('text') as Element;
    const outer = el['div']!(inner, 'more') as Element;
    expect(outer.childNodes.length).toBe(2);
    expect(outer.firstChild).toBe(inner);
  });

  it('treats array first arg as children, not props', () => {
    const items = [el['li']!('a') as Element, el['li']!('b') as Element];
    const ul = el['ul']!(items) as Element;
    expect(ul.children.length).toBe(2);
  });
});
