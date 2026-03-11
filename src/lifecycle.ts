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
