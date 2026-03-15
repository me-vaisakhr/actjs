import { setSSRMode, getSSRHeadOutput, clearSSRHeadOutput } from './ssr-context.js';
import type { Props } from './types.js';

/**
 * Render a component to an HTML string (SSR).
 * Runs setup and onInit hooks; serializes DOM to string.
 * Does NOT run onMount or onDestroy — those are client-only.
 *
 * @example
 * import { renderToString } from 'actjs/ssr';
 * const html = await renderToString(MyPage, { userId: '42' });
 * // Returns: '<div data-component="">...</div>'
 * // Prepends useHead() output (title, meta, link tags) when present.
 */
export async function renderToString(
  componentFn: (props?: Props) => Element | void,
  props?: Props,
): Promise<string> {
  setSSRMode(true);
  clearSSRHeadOutput();

  let el: Element | void;
  try {
    el = componentFn(props);
  } finally {
    setSSRMode(false);
  }

  // Wait for any onInit async hooks that component() started
  await new Promise<void>(resolve => queueMicrotask(resolve));

  let html = '';

  // Head tags captured by component() during SSR
  const headHtml = getSSRHeadOutput();
  if (headHtml) html += headHtml;

  // Serialize DOM
  if (el) {
    html += serializeElement(el);
  }

  return html;
}

/**
 * Serialize an Element or DocumentFragment to an HTML string.
 */
export function serializeElement(node: Element | DocumentFragment): string {
  if (node instanceof DocumentFragment) {
    let out = '';
    for (const child of Array.from(node.childNodes)) {
      out += serializeNode(child);
    }
    return out;
  }
  return serializeNode(node);
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent ?? '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const voidTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
  ]);

  let attrStr = '';
  for (const attr of Array.from(el.attributes)) {
    attrStr += ` ${attr.name}="${escapeHtml(attr.value)}"`;
  }

  if (voidTags.has(tag)) {
    return `<${tag}${attrStr}>`;
  }

  let inner = '';
  for (const child of Array.from(el.childNodes)) {
    inner += serializeNode(child);
  }

  return `<${tag}${attrStr}>${inner}</${tag}>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
