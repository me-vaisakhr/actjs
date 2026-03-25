/**
 * actjs/jsx-runtime — React 17+ automatic JSX transform.
 * Consumers configure:
 *   "jsx": "react-jsx"
 *   "jsxImportSource": "actjs"
 * in their tsconfig. TypeScript then imports jsx/jsxs/Fragment from this file.
 */

import { h, Fragment as ActFragment } from './hyperscript.js';
import type { Child, Props, SVGProps } from './types.js';

export { ActFragment as Fragment };

// ─── JSX type declarations ────────────────────────────────────────────────────
// TypeScript reads the exported JSX namespace from the jsxImportSource module.
// It must be a named export — declare global does NOT work for jsxImportSource.

export declare namespace JSX {
  type Element = globalThis.Element | DocumentFragment;

  interface IntrinsicElements {
    // ── SVG elements — typed presentation & geometry attributes ──────────────
    svg: SVGProps;
    path: SVGProps;
    circle: SVGProps;
    ellipse: SVGProps;
    line: SVGProps;
    polyline: SVGProps;
    polygon: SVGProps;
    rect: SVGProps;
    g: SVGProps;
    defs: SVGProps;
    use: SVGProps;
    symbol: SVGProps;
    tspan: SVGProps;
    text: SVGProps;
    clipPath: SVGProps;
    mask: SVGProps;
    pattern: SVGProps;
    linearGradient: SVGProps;
    radialGradient: SVGProps;
    stop: SVGProps;
    filter: SVGProps;
    marker: SVGProps;
    // ── Catch-all for HTML and unknown elements ───────────────────────────────
    [tagName: string]: Props & { children?: Child | Child[] };
  }
}

type JSXProps = Props & { children?: Child | Child[] };

/**
 * jsx() — called for elements with a single child (or no children).
 * The automatic transform passes children inside props.
 */
export function jsx(
  type: string | ((...args: unknown[]) => Element | DocumentFragment | void),
  props: JSXProps,
  _key?: string,
): Element | DocumentFragment {
  const { children, ...rest } = props;
  const childArray: Child[] = children === undefined
    ? []
    : Array.isArray(children) ? children : [children];
  return h(type, rest as Props, ...childArray);
}

/**
 * jsxs() — called for elements with multiple children (array).
 * Identical implementation — children is already an array.
 */
export function jsxs(
  type: string | ((...args: unknown[]) => Element | DocumentFragment | void),
  props: JSXProps,
  _key?: string,
): Element | DocumentFragment {
  return jsx(type, props, _key);
}

/**
 * jsxDEV() — called in development builds; same as jsx().
 */
export function jsxDEV(
  type: string | ((...args: unknown[]) => Element | DocumentFragment | void),
  props: JSXProps,
  _key?: string,
): Element | DocumentFragment {
  return jsx(type, props, _key);
}
