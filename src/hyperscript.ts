import type { Child, Props, Ref } from './types.js';
import { elListeners } from './listeners.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Tags that must be created in the SVG namespace.
// These are unambiguously SVG-only; shared tags (a, title, script, style, image, text)
// default to HTML to preserve existing behaviour.
const SVG_TAGS = new Set([
  'svg', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect',
  'g', 'defs', 'use', 'symbol', 'tspan', 'textPath', 'foreignObject',
  'clipPath', 'mask', 'pattern', 'linearGradient', 'radialGradient', 'stop',
  'filter', 'feBlend', 'feColorMatrix', 'feComposite', 'feFlood',
  'feGaussianBlur', 'feMerge', 'feMergeNode', 'feOffset', 'feTurbulence',
  'animate', 'animateTransform', 'animateMotion', 'mpath', 'set',
  'marker', 'view', 'desc', 'metadata',
]);

/** Flatten nested Child arrays into a single flat array. */
function flattenChildren(children: Child[]): Array<string | number | boolean | null | undefined | Element | DocumentFragment> {
  const result: Array<string | number | boolean | null | undefined | Element | DocumentFragment> = [];
  for (const child of children) {
    if (Array.isArray(child)) {
      result.push(...flattenChildren(child));
    } else {
      result.push(child);
    }
  }
  return result;
}

/** Append a single child to a parent node. */
function appendChild(parent: Element | DocumentFragment, child: string | number | boolean | null | undefined | Element | DocumentFragment): void {
  if (child === null || child === undefined || child === false) return;
  if (child instanceof Element || child instanceof DocumentFragment) {
    parent.appendChild(child);
  } else {
    parent.appendChild(document.createTextNode(String(child)));
  }
}

/**
 * Core hyperscript function.
 * - string tag → DOM element
 * - function tag → component call
 */
export function h(
  tag: string | ((...args: unknown[]) => Element | DocumentFragment | void),
  props?: Props | null,
  ...children: Child[]
): Element | DocumentFragment {
  if (typeof tag === 'function') {
    const result = tag({ ...(props ?? {}), children: children.length === 1 ? children[0] : children });
    return result ?? document.createDocumentFragment();
  }

  const el = SVG_TAGS.has(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);

  if (props) {
    let listeners: ReturnType<typeof elListeners.get> | undefined;
    for (const [key, value] of Object.entries(props)) {
      if (key === 'ref') {
        (value as Ref).current = el as never;
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, value as EventListenerOrEventListenerObject);
        if (!listeners) { listeners = new Map(); elListeners.set(el, listeners); }
        listeners.set(eventName, value as EventListenerOrEventListenerObject);
      } else if (key === 'class' || key === 'className') {
        if (value !== undefined && value !== null && value !== false) {
          el.setAttribute('class', String(value));
        }
      } else if (key === 'style' && typeof value === 'object' && value !== null) {
        Object.assign(el.style, value);
      } else if (typeof value === 'boolean') {
        if (value) el.setAttribute(key, '');
        else el.removeAttribute(key);
      } else if (value !== undefined && value !== null && value !== false) {
        el.setAttribute(key, String(value));
      }
    }
  }

  const flat = flattenChildren(children);
  for (const child of flat) {
    appendChild(el, child);
  }

  return el;
}

/** Fragment: <></> in JSX. Returns DocumentFragment. */
export function Fragment(
  props: { children?: Child | Child[] } | null,
  ...restChildren: Child[]
): DocumentFragment {
  const frag = document.createDocumentFragment();

  // Support both JSX-style (children in props) and direct args
  const kids: Child[] = [];
  if (props?.children !== undefined) {
    kids.push(...(Array.isArray(props.children) ? props.children : [props.children]));
  }
  kids.push(...restChildren);

  const flat = flattenChildren(kids);
  for (const child of flat) {
    appendChild(frag, child);
  }
  return frag;
}

/** Returns a Ref object whose .current is populated by h() when used as a ref prop. */
export function ref<T extends Element = Element>(): Ref<T> {
  return { current: null };
}

/** Returns true if `v` looks like a props object (plain object, not Element/Fragment/array). */
function isPropsObject(v: unknown): v is Props {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    && !(v instanceof Element) && !(v instanceof DocumentFragment);
}

type ElFn = (...args: unknown[]) => Element | DocumentFragment;

/**
 * Proxy sugar: el.button(props?, ...children) === h('button', props, ...children)
 * Props are auto-detected — passing null for "no props" is no longer required:
 *   el.div(el.h1('Hello'), el.p('World'))   ← children only, no null needed
 *   el.div({ class: 'card' }, el.p('Hi'))   ← props + children
 *
 * Typed as a mapped type over HTMLElementTagNameMap so that property access
 * (el.div, el.button, …) returns a non-nullable function even under
 * noUncheckedIndexedAccess — concrete keys are never undefined.
 */
export const el = new Proxy({}, {
  get(_target, tag: string) {
    return (...args: unknown[]) => {
      if (isPropsObject(args[0])) {
        return h(tag, args[0] as Props, ...(args.slice(1) as Child[]));
      }
      return h(tag, null, ...(args as Child[]));
    };
  },
}) as { [K in keyof HTMLElementTagNameMap]: ElFn };
