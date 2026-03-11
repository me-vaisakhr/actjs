import { describe, it, expect, vi } from 'vitest';
import { html } from '../src/template.js';

describe('html tagged template', () => {
  // ── Return type ────────────────────────────────────────────────────────────

  it('returns Element for single root', () => {
    const el = html`<div>hello</div>`;
    expect(el).toBeInstanceOf(Element);
    expect((el as Element).tagName).toBe('DIV');
  });

  it('returns DocumentFragment for multiple roots', () => {
    const frag = html`<span>a</span><span>b</span>`;
    expect(frag).toBeInstanceOf(DocumentFragment);
  });

  // ── Static HTML ────────────────────────────────────────────────────────────

  it('renders static text content', () => {
    const el = html`<p>hello world</p>` as Element;
    expect(el.tagName).toBe('P');
    expect(el.textContent).toBe('hello world');
  });

  it('renders nested elements', () => {
    const el = html`<div><span>inner</span></div>` as Element;
    expect(el.tagName).toBe('DIV');
    expect((el.firstChild as Element).tagName).toBe('SPAN');
    expect(el.textContent).toBe('inner');
  });

  // ── Dynamic children ───────────────────────────────────────────────────────

  it('interpolates string values', () => {
    const name = 'actjs';
    const el = html`<span>${name}</span>` as Element;
    expect(el.textContent).toBe('actjs');
  });

  it('interpolates number values', () => {
    const count = 42;
    const el = html`<span>${count}</span>` as Element;
    expect(el.textContent).toBe('42');
  });

  it('omits null values', () => {
    const el = html`<span>${null}</span>` as Element;
    expect(el.textContent).toBe('');
  });

  it('omits false values', () => {
    const el = html`<span>${false}</span>` as Element;
    expect(el.textContent).toBe('');
  });

  it('omits undefined values', () => {
    const el = html`<span>${undefined}</span>` as Element;
    expect(el.textContent).toBe('');
  });

  it('handles multiple interpolated values', () => {
    const a = 'foo';
    const b = 'bar';
    const el = html`<p>${a} and ${b}</p>` as Element;
    expect(el.textContent).toBe('foo and bar');
  });

  it('renders array children', () => {
    const items = ['a', 'b', 'c'];
    const el = html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>` as Element;
    expect(el.children.length).toBe(3);
    expect(el.children[0]!.textContent).toBe('a');
    expect(el.children[2]!.textContent).toBe('c');
  });

  it('renders Element children', () => {
    const child = html`<em>hi</em>` as Element;
    const el = html`<div>${child}</div>` as Element;
    expect((el.firstChild as Element).tagName).toBe('EM');
  });

  // ── Attributes ─────────────────────────────────────────────────────────────

  it('sets static string attributes', () => {
    const el = html`<div class="foo" id="bar"></div>` as Element;
    expect(el.getAttribute('class')).toBe('foo');
    expect(el.getAttribute('id')).toBe('bar');
  });

  it('sets dynamic string attribute', () => {
    const cls = 'active';
    const el = html`<div class=${cls}></div>` as Element;
    expect(el.getAttribute('class')).toBe('active');
  });

  it('sets boolean attributes (no value)', () => {
    const el = html`<button disabled></button>` as Element;
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('sets dynamic boolean attribute (true)', () => {
    const el = html`<button disabled=${true}></button>` as Element;
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('removes dynamic boolean attribute (false)', () => {
    const el = html`<button disabled=${false}></button>` as Element;
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('sets style object via dynamic attr', () => {
    const el = html`<div style=${{ color: 'red', fontSize: '12px' }}></div>` as HTMLElement;
    expect(el.style.color).toBe('red');
    expect(el.style.fontSize).toBe('12px');
  });

  // ── Event listeners ────────────────────────────────────────────────────────

  it('binds function to on* event', () => {
    const handler = vi.fn();
    const el = html`<button onclick=${handler}>click</button>` as Element;
    el.dispatchEvent(new MouseEvent('click'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not set onclick as an HTML attribute', () => {
    const handler = vi.fn();
    const el = html`<button onclick=${handler}>click</button>` as Element;
    expect(el.hasAttribute('onclick')).toBe(false);
  });

  // ── Void elements ──────────────────────────────────────────────────────────

  it('renders void elements without closing tag', () => {
    const el = html`<div><br><input type="text"></div>` as Element;
    expect(el.children[0]!.tagName).toBe('BR');
    expect(el.children[1]!.tagName).toBe('INPUT');
  });

  it('renders self-closing void elements', () => {
    const el = html`<div><br /><hr /></div>` as Element;
    expect(el.children[0]!.tagName).toBe('BR');
    expect(el.children[1]!.tagName).toBe('HR');
  });

  // ── Fragment ───────────────────────────────────────────────────────────────

  it('returns DocumentFragment for empty template', () => {
    const frag = html`${'a'}${'b'}`;
    expect(frag).toBeInstanceOf(DocumentFragment);
  });

  // ── Template string caching ────────────────────────────────────────────────

  it('returns same structure for same call site (caching)', () => {
    function render(val: string) {
      return html`<p>${val}</p>` as Element;
    }
    const a = render('hello');
    const b = render('world');
    expect(a.tagName).toBe('P');
    expect(b.tagName).toBe('P');
    expect(a.textContent).toBe('hello');
    expect(b.textContent).toBe('world');
  });
});
