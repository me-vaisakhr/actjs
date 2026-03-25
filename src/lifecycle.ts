import { getCurrentSetup } from './context.js';
import { setCurrentObserver, getCurrentObserver } from './signal.js';
import type { Effect } from './types.js';

function assertInSetup(hookName: string): ReturnType<typeof getCurrentSetup> & object {
  const ctx = getCurrentSetup();
  if (!ctx) {
    throw new Error(`${hookName}() must be called inside a component setup function.`);
  }
  return ctx;
}

/**
 * Runs on BOTH server (SSR) and client — safe for data loading, initial state setup.
 * Call async operations here; executes before onMount.
 */
export function onInit(fn: () => void | Promise<void>): void {
  const ctx = assertInSetup('onInit');
  ctx.onInitFns.push(fn);
}

/**
 * Runs on CLIENT ONLY after first render — DOM is available.
 * Never called during SSR.
 */
export function onMount(fn: () => void): void {
  const ctx = assertInSetup('onMount');
  ctx.onMountFns.push(fn);
}

/**
 * Runs on CLIENT ONLY when component is removed / app.destroy() called.
 * Never called during SSR.
 */
export function onDestroy(fn: () => void): void {
  const ctx = assertInSetup('onDestroy');
  ctx.onDestroyFns.push(fn);
}

/**
 * Reactive side effect. Runs immediately and re-runs whenever any signal read
 * inside fn() changes. Returns a dispose function that stops the effect.
 *
 * When called inside a component setup, the effect is automatically disposed
 * when the component is destroyed — no manual cleanup needed.
 *
 * @example
 * // Inside a component — auto-cleaned on destroy
 * effect(() => {
 *   chart.setData(prices()); // re-runs whenever prices changes
 * });
 *
 * // Standalone — dispose manually
 * const stop = effect(() => console.log('count:', count()));
 * stop(); // unsubscribe
 *
 * // With cleanup
 * effect(() => {
 *   const sub = store.subscribe(handler);
 *   return () => sub.unsubscribe(); // called before next run and on dispose
 * });
 */
export function effect(fn: () => void | (() => void)): () => void {
  let cleanup: (() => void) | void;
  let running = false;

  const eff: Effect = {
    deps: new Set(),
    run() {
      if (running) return; // re-entry guard — prevents infinite loops
      running = true;
      // Clean up previous signal subscriptions
      for (const dep of eff.deps) dep.delete(eff);
      eff.deps.clear();
      // Run cleanup returned by previous execution
      if (typeof cleanup === 'function') { cleanup(); cleanup = undefined; }
      // Run fn inside a tracking context to collect new deps
      const prev = getCurrentObserver();
      setCurrentObserver(eff);
      try {
        cleanup = fn();
      } finally {
        setCurrentObserver(prev);
        running = false;
      }
    },
  };

  function dispose(): void {
    for (const dep of eff.deps) dep.delete(eff);
    eff.deps.clear();
    if (typeof cleanup === 'function') { cleanup(); cleanup = undefined; }
  }

  // Inside a component setup — auto-dispose when the component is destroyed
  const ctx = getCurrentSetup();
  if (ctx) {
    ctx.onDestroyFns.push(dispose);
  }

  // Run immediately to establish the initial subscription
  eff.run();

  return dispose;
}

/**
 * Starts a repeating interval when the component mounts and clears it
 * automatically when the component is destroyed. Client-only.
 *
 * @example
 * useInterval(() => setTick(t => t + 1), 1000);
 */
export function useInterval(fn: () => void, ms: number): void {
  const ctx = assertInSetup('useInterval');
  let id: ReturnType<typeof setInterval>;
  ctx.onMountFns.push(() => { id = setInterval(fn, ms); });
  ctx.onDestroyFns.push(() => clearInterval(id));
}

/**
 * Schedules a one-shot timeout when the component mounts and cancels it
 * automatically if the component is destroyed before it fires. Client-only.
 *
 * @example
 * useTimeout(() => setVisible(false), 3000);
 */
export function useTimeout(fn: () => void, ms: number): void {
  const ctx = assertInSetup('useTimeout');
  let id: ReturnType<typeof setTimeout>;
  ctx.onMountFns.push(() => { id = setTimeout(fn, ms); });
  ctx.onDestroyFns.push(() => clearTimeout(id));
}
