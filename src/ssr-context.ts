/**
 * Shared SSR mode flag.
 * Set to true during renderToString() — prevents client-only lifecycle
 * (onMount, onDestroy microtask) from running in a server context.
 */
let _isSSR = false;

export function setSSRMode(value: boolean): void {
  _isSSR = value;
}

export function isSSRMode(): boolean {
  return _isSSR;
}

/** Temporary store for head config captured during SSR rendering. */
let _ssrHeadConfig: string | null = null;

export function setSSRHeadOutput(html: string): void {
  _ssrHeadConfig = html;
}

export function getSSRHeadOutput(): string | null {
  return _ssrHeadConfig;
}

export function clearSSRHeadOutput(): void {
  _ssrHeadConfig = null;
}
