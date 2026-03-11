import { describe, it, expect, vi } from 'vitest';
import { reconcileChildren } from '../src/diff.js';
import { h } from '../src/hyperscript.js';

function makeParent(...children: (Element | string)[]): Element {
  const div = document.createElement('div');
  for (const child of children) {
    if (typeof child === 'string') {
      div.appendChild(document.createTextNode(child));
    } else {
      div.appendChild(child);
    }
  }
  return div;
}

describe('reconcileChildren', () => {
  it('appends new nodes when parent is empty', () => {
    const parent = document.createElement('div');
    const newContent = h('span', null, 'hello') as Element;
    reconcileChildren(parent, newContent);
    expect(parent.children.length).toBe(1);
    expect(parent.textContent).toBe('hello');
  });

  it('replaces text node content when text changes', () => {
    const parent = makeParent('old');
    // Use Fragment so its childNodes (just the text node) are diffed against parent's childNodes
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createTextNode('new'));
    reconcileChildren(parent, frag);
    expect(parent.textContent).toBe('new');
  });

  it('does not mutate DOM when content is identical', () => {
    const parent = makeParent(h('p', null, 'same') as Element);
    const spy = vi.spyOn(parent, 'replaceChild');
    const spy2 = vi.spyOn(parent, 'removeChild');
    const spy3 = vi.spyOn(parent, 'appendChild');

    // Pass the element directly — compared as [<p>same</p>] vs [<p>same</p>]
    reconcileChildren(parent, h('p', null, 'same') as Element);

    expect(spy).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
    expect(spy3).not.toHaveBeenCalled();
  });

  it('removes extra old nodes', () => {
    const parent = makeParent(
      h('p', null, 'a') as Element,
      h('p', null, 'b') as Element,
    );
    // Fragment with one child — parent has 2, new has 1 → remove 1
    const frag = document.createDocumentFragment();
    frag.appendChild(h('p', null, 'a') as Element);
    reconcileChildren(parent, frag);
    expect(parent.children.length).toBe(1);
  });

  it('appends extra new nodes', () => {
    const parent = makeParent(h('p', null, 'a') as Element);
    // Fragment with two children — parent has 1, new has 2 → append 1
    const frag = document.createDocumentFragment();
    frag.appendChild(h('p', null, 'a') as Element);
    frag.appendChild(h('p', null, 'b') as Element);
    reconcileChildren(parent, frag);
    expect(parent.children.length).toBe(2);
    expect(parent.children[1]?.textContent).toBe('b');
  });

  it('patches changed attributes on same tag', () => {
    const parent = makeParent(h('div', { class: 'old' }) as Element);
    // Pass element directly — compared as [<div class="new">] vs [<div class="old">]
    reconcileChildren(parent, h('div', { class: 'new' }) as Element);
    expect((parent.firstChild as Element).getAttribute('class')).toBe('new');
  });

  it('replaces element when tag changes', () => {
    const parent = makeParent(h('span', null, 'x') as Element);
    const spy = vi.spyOn(parent, 'replaceChild');
    reconcileChildren(parent, h('div', null, 'x') as Element);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('handles DocumentFragment as newContent', () => {
    const parent = document.createElement('div');
    const frag = document.createDocumentFragment();
    frag.appendChild(h('p', null, 'a') as Element);
    frag.appendChild(h('p', null, 'b') as Element);
    reconcileChildren(parent, frag);
    expect(parent.children.length).toBe(2);
  });

  it('removes old attribute not present in new node', () => {
    const parent = makeParent(h('div', { id: 'old', class: 'x' }) as Element);
    reconcileChildren(parent, h('div', { class: 'x' }) as Element);
    expect((parent.firstChild as Element).hasAttribute('id')).toBe(false);
  });

  it('preserves event listeners on newly appended nodes', () => {
    const parent = document.createElement('div');
    const handler = vi.fn();
    const btn = h('button', { onclick: handler }, 'click') as Element;
    reconcileChildren(parent, btn);
    (parent.firstChild as Element).dispatchEvent(new MouseEvent('click'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('is a no-op when newContent is undefined', () => {
    const parent = makeParent(h('p', null, 'keep') as Element);
    reconcileChildren(parent, undefined);
    expect(parent.children.length).toBe(1);
  });
});
