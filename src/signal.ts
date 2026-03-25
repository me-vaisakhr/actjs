import type { Effect, Signal } from './types.js';

// The currently-executing Effect (render fn or computed). null = not tracking.
let currentObserver: Effect | null = null;

// ─── Batch ────────────────────────────────────────────────────────────────────

let batchDepth = 0;
const pendingEffects = new Set<Effect>();

/**
 * Run multiple signal writes as a single atomic update.
 * All effects and renders triggered inside fn() are deferred until the batch
 * completes, so each subscriber fires at most once.
 *
 * @example
 * batch(() => {
 *   setPrice(newPrice);    // ← would each trigger a render separately
 *   setVolume(newVolume);  // ← now both are coalesced into one render
 * });
 */
export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      // Drain pending effects — snapshot first so mutations during run are safe
      const toRun = [...pendingEffects];
      pendingEffects.clear();
      for (const eff of toRun) eff.run();
    }
  }
}

export function setCurrentObserver(observer: Effect | null): void {
  currentObserver = observer;
}

export function getCurrentObserver(): Effect | null {
  return currentObserver;
}

export interface SignalOptions<T> {
  /**
   * Custom equality function. If it returns true the setter is a no-op and
   * no subscribers are notified.
   * Pass `false` to disable equality checks entirely (always notify).
   *
   * @default Object.is
   * @example
   * // Deep-equal arrays — only re-render when contents actually change
   * const [items, setItems] = signal([], { equals: (a, b) => JSON.stringify(a) === JSON.stringify(b) });
   *
   * // Always notify (useful for objects mutated in place)
   * const [state, setState] = signal(obj, { equals: false });
   */
  equals?: ((a: T, b: T) => boolean) | false;
}

/**
 * Fine-grained signal. Calling getter() inside a tracking context
 * auto-subscribes the observer to this signal.
 *
 * @example
 * const [count, setCount] = signal(0);
 * setCount(1);               // set directly
 * setCount(n => n + 1);      // updater function
 * console.log(count());      // 2
 */
export function signal<T>(initialValue: T, options?: SignalOptions<T>): Signal<T> {
  let value = initialValue;
  const subscribers: Set<Effect> = new Set();
  const equalsFn: ((a: T, b: T) => boolean) | false =
    options?.equals === false ? false : (options?.equals ?? Object.is);

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

    if (equalsFn !== false && equalsFn(next, value)) return;
    value = next;

    // Snapshot subscribers before notifying — effects may add/remove during run
    for (const effect of [...subscribers]) {
      if (batchDepth > 0) {
        pendingEffects.add(effect);
      } else {
        effect.run();
      }
    }
  };

  return [getter, setter];
}

/**
 * Derived signal. Lazily re-computes when any tracked dependency changes.
 * Reading computed() inside a tracking context also subscribes the observer
 * to this computed's upstream dependencies.
 *
 * @example
 * const [first, setFirst] = signal('Ada');
 * const [last,  setLast]  = signal('Lovelace');
 * const full = computed(() => `${first()} ${last()}`);
 * console.log(full()); // 'Ada Lovelace'
 * setFirst('Grace');
 * console.log(full()); // 'Grace Lovelace'
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
