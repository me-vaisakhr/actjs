// ─── Runtime CDN loader ────────────────────────────────────────────────────────
// Loads external packages (scripts, stylesheets) from CDN at runtime.
// All functions are SSR-safe and idempotent — the same URL will never be
// injected twice even with concurrent callers.

import type { LoadScriptOptions, LoadStylesheetOptions } from './types.js';
import type { ActDepsConfig } from './deps.js';
import { resolveUrl, resolveStylesheetUrl } from './deps.js';

// Module-level dedup cache — intentionally NOT per-instance. CDN resources
// (lodash, bootstrap) should load once per page, not once per createApp() call.
const loadedUrls = new Set<string>();
const pendingLoads = new Map<string, Promise<void>>();

/**
 * Dynamically inject a <script> tag and resolve when loaded.
 * Subsequent calls with the same URL return immediately (idempotent).
 * No-ops on the server (SSR).
 *
 * @example
 * await loadScript('https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js');
 * window.confetti({ particleCount: 150, spread: 70 });
 */
export function loadScript(url: string, opts?: LoadScriptOptions): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (loadedUrls.has(url)) return Promise.resolve();
  const inflight = pendingLoads.get(url);
  if (inflight) return inflight;
  if (document.querySelector(`script[src="${url}"]`)) {
    loadedUrls.add(url);
    return Promise.resolve();
  }
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    if (opts?.type) script.type = opts.type;
    if (opts?.async !== undefined) script.async = opts.async;
    if (opts?.defer) script.defer = opts.defer;
    if (opts?.crossOrigin) script.crossOrigin = opts.crossOrigin;
    if (opts?.integrity) script.integrity = opts.integrity;
    if (opts?.noModule) (script as HTMLScriptElement).noModule = opts.noModule;
    if (opts?.id) script.id = opts.id;
    script.onload = () => {
      loadedUrls.add(url);
      pendingLoads.delete(url);
      resolve();
    };
    script.onerror = () => {
      pendingLoads.delete(url);
      reject(new Error(`actjs: Failed to load script: ${url}`));
    };
    document.head.appendChild(script);
  });
  pendingLoads.set(url, promise);
  return promise;
}

/**
 * Dynamically inject a <link rel="stylesheet"> and resolve when loaded.
 * Subsequent calls with the same href return immediately (idempotent).
 * No-ops on the server (SSR).
 *
 * @example
 * await loadStylesheet('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css');
 */
export function loadStylesheet(href: string, opts?: LoadStylesheetOptions): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (loadedUrls.has(href)) return Promise.resolve();
  const inflight = pendingLoads.get(href);
  if (inflight) return inflight;
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
    loadedUrls.add(href);
    return Promise.resolve();
  }
  const promise = new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    if (opts?.media) link.media = opts.media;
    if (opts?.crossOrigin) link.crossOrigin = opts.crossOrigin;
    if (opts?.integrity) link.integrity = opts.integrity;
    link.onload = () => {
      loadedUrls.add(href);
      pendingLoads.delete(href);
      resolve();
    };
    link.onerror = () => {
      pendingLoads.delete(href);
      reject(new Error(`actjs: Failed to load stylesheet: ${href}`));
    };
    document.head.appendChild(link);
  });
  pendingLoads.set(href, promise);
  return promise;
}

/**
 * Inject a <script type="importmap"> so bare CDN imports resolve in the browser.
 * Must be called before any ES module scripts that use bare specifiers.
 * No-ops if an import map already exists or on the server (SSR).
 *
 * @example
 * defineImportMap({ lodash: 'https://esm.sh/lodash@4.17.21' })
 * // then: import _ from 'lodash' works in <script type="module">
 */
export function defineImportMap(map: Record<string, string>): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector('script[type="importmap"]')) {
    console.warn('actjs: An import map already exists. defineImportMap() had no effect.');
    return;
  }
  const script = document.createElement('script');
  script.type = 'importmap';
  script.textContent = JSON.stringify({ imports: map }, null, 2);
  document.head.insertBefore(script, document.head.firstChild);
}

/**
 * Inject a <link rel="preload"> hint to let the browser prefetch a resource.
 * No-ops on the server (SSR).
 */
export function preloadResource(href: string, as: 'script' | 'style' | 'font'): void {
  if (typeof document === 'undefined') return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Load all packages declared in an actjs deps config.
 * Injects an import map for JS packages and stylesheet links for CSS packages.
 * Intended for IIFE / no-bundler usage. Vite users get this automatically
 * via the actjsPlugin() Vite plugin at build time.
 *
 * @example
 * await useDeps({ provider: 'esm.sh', packages: { lodash: '4.17.21' } })
 */
export async function useDeps(config: ActDepsConfig): Promise<void> {
  if (typeof document === 'undefined') return;
  const { provider = 'esm.sh', packages } = config;
  const importMap: Record<string, string> = {};
  const stylesheetLoads: Promise<void>[] = [];

  for (const [pkg, version] of Object.entries(packages)) {
    const cssUrl = resolveStylesheetUrl(pkg, version);
    if (cssUrl) {
      stylesheetLoads.push(loadStylesheet(cssUrl));
    }
    importMap[pkg] = resolveUrl(pkg, version, provider);
  }

  defineImportMap(importMap);
  await Promise.all(stylesheetLoads);
}

/** @internal Reset module-level cache between tests. */
export function __resetLoaderState(): void {
  loadedUrls.clear();
  pendingLoads.clear();
}
