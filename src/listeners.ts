/**
 * Shared WeakMap that tracks which event listeners are attached to each Element.
 * Populated by h() in hyperscript.ts, consumed by reconcileAttributes() in diff.ts.
 */
export type ListenerMap = Map<string, EventListenerOrEventListenerObject>;
export const elListeners = new WeakMap<Element, ListenerMap>();
