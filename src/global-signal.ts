import { signal } from './signal.js';
import type { Signal } from './types.js';

const registry = new Map<string, Signal<unknown>>();

/**
 * Global keyed signal — same [getter, setter] pair for every caller using
 * the same key. Designed for IIFE/script-tag users who can't share module scope.
 * For module-based projects, prefer exporting a signal directly.
 */
export function globalSignal<T>(key: string, initialValue: T): Signal<T> {
  if (!registry.has(key)) {
    registry.set(key, signal(initialValue) as Signal<unknown>);
  }
  return registry.get(key) as Signal<T>;
}

/** Clears the global registry — useful for test isolation. */
export function _clearGlobalSignals(): void {
  registry.clear();
}
