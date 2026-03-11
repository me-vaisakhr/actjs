import type { Effect, Signal } from './types.js';

// The currently-executing Effect (render fn or computed). null = not tracking.
let currentObserver: Effect | null = null;

export function setCurrentObserver(observer: Effect | null): void {
  currentObserver = observer;
}

export function getCurrentObserver(): Effect | null {
  return currentObserver;
}

/**
 * Fine-grained signal. Calling getter() inside a tracking context
 * auto-subscribes the observer to this signal.
 */
export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers: Set<Effect> = new Set();

  const getter = (): T => {
    if (currentObserver !== null) {
      subscribers.add(currentObserver);
      currentObserver.deps.add(subscribers);
    }
    return value;
  };

  const setter = (newValue: T | ((prev: T) => T)): void => {
    const next =
      typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(value)
        : newValue;

    if (Object.is(next, value)) return;
    value = next;

    // Snapshot subscribers before notifying — effects may add/remove during run
    for (const effect of [...subscribers]) {
      effect.run();
    }
  };

  return [getter, setter];
}

/**
 * Derived signal. Lazily re-computes when any tracked dependency changes.
 * Reading computed() inside a tracking context also subscribes the observer
 * to this computed's upstream dependencies.
 */
export function computed<T>(fn: () => T): () => T {
  let cachedValue: T;
  let dirty = true;

  // The effect that re-runs fn when dependencies change
  const effect: Effect = {
    deps: new Set(),
    run() {
      // Clean up previous subscriptions
      for (const dep of effect.deps) {
        dep.delete(effect);
      }
      effect.deps.clear();
      dirty = true;
      // Notify any observers of this computed
      for (const sub of [...computedSubscribers]) {
        sub.run();
      }
    },
  };

  const computedSubscribers: Set<Effect> = new Set();

  const getter = (): T => {
    // Subscribe current outer observer to this computed's output
    if (currentObserver !== null) {
      computedSubscribers.add(currentObserver);
      currentObserver.deps.add(computedSubscribers);
    }

    if (dirty) {
      // Run fn inside our own tracking context to collect deps
      const prev = currentObserver;
      currentObserver = effect;
      try {
        cachedValue = fn();
      } finally {
        currentObserver = prev;
      }
      dirty = false;
    }

    return cachedValue as T;
  };

  return getter;
}
