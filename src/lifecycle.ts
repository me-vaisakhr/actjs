import { getCurrentSetup } from './context.js';

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
