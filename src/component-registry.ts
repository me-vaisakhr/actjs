/**
 * Registry mapping component containers → their onDestroy callbacks.
 *
 * Kept in a separate module so that both component.ts (writer) and diff.ts
 * (reader) can import it without creating a circular dependency.
 */
export const componentDestroyRegistry = new WeakMap<Element, Array<() => void>>();
