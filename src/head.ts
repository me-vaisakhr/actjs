import type { HeadConfig } from './types.js';
import { getCurrentSetup } from './context.js';

/** Tracks <meta> and <link> elements injected by each component instance. */
const componentHeadElements = new WeakMap<object, Element[]>();

/**
 * SSR: serializes config to HTML tags injected into the stream before </head>.
 * Client: patches document.head — removes old tags, inserts new ones.
 * Call inside component() setup; re-evaluates on every render if values are signal reads.
 */
export function useHead(config: HeadConfig): void {
  const ctx = getCurrentSetup();
  if (!ctx) {
    throw new Error('useHead() must be called inside a component setup function.');
  }
  ctx.headConfig = config;
}

/**
 * Apply a HeadConfig to document.head (client-side).
 * Pass a stable key object to track owned elements across re-renders.
 */
export function applyHead(config: HeadConfig, owner: object): void {
  if (typeof document === 'undefined') return;

  // Remove previously injected elements for this owner
  const prev = componentHeadElements.get(owner) ?? [];
  for (const el of prev) {
    el.parentNode?.removeChild(el);
  }
  const injected: Element[] = [];

  if (config.title !== undefined) {
    let titleEl = document.querySelector('title');
    if (!titleEl) {
      titleEl = document.createElement('title');
      document.head.appendChild(titleEl);
    }
    titleEl.textContent = config.title;
  }

  if (config.meta) {
    for (const attrs of config.meta) {
      const meta = document.createElement('meta');
      for (const [k, v] of Object.entries(attrs)) {
        meta.setAttribute(k, v);
      }
      document.head.appendChild(meta);
      injected.push(meta);
    }
  }

  if (config.link) {
    for (const attrs of config.link) {
      const link = document.createElement('link');
      for (const [k, v] of Object.entries(attrs)) {
        link.setAttribute(k, v);
      }
      document.head.appendChild(link);
      injected.push(link);
    }
  }

  componentHeadElements.set(owner, injected);
}

/**
 * Serialize a HeadConfig to HTML string fragments (for SSR).
 */
export function renderHeadToString(config: HeadConfig): string {
  let out = '';

  if (config.title !== undefined) {
    out += `<title>${escapeHtml(config.title)}</title>`;
  }

  if (config.meta) {
    for (const attrs of config.meta) {
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
        .join(' ');
      out += `<meta ${attrStr}>`;
    }
  }

  if (config.link) {
    for (const attrs of config.link) {
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${escapeHtml(v)}"`)
        .join(' ');
      out += `<link ${attrStr}>`;
    }
  }

  return out;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
