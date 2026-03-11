import { CssManager } from './css.js';
import { TimerManager } from './timers.js';
import { reconcileChildren } from './diff.js';
import { DESTROY_KEY } from './component.js';
import type { ActApp, CreateAppOptions, Props } from './types.js';

/**
 * Central app factory. Resolves container, mounts root component,
 * and provides cleanup on destroy().
 * Lifecycle hooks (onInit/onMount/onDestroy) are run by component() itself.
 */
export function createApp(
  container: string | Element,
  options: CreateAppOptions = {},
): ActApp {
  const { hydrate = false, devWarnings = true } = options;

  const root: Element =
    typeof container === 'string'
      ? (document.querySelector(container) as Element)
      : container;

  if (!root && devWarnings) {
    console.warn(`actjs: createApp() — container "${String(container)}" not found.`);
  }

  const css = new CssManager();
  const timers = new TimerManager();

  let mountedEl: Element | null = null;

  return {
    mount(componentFn: (props?: Props) => Element | void): void {
      const renderedEl = componentFn();
      mountedEl = renderedEl ?? null;

      if (renderedEl) {
        if (hydrate) {
          reconcileChildren(root, renderedEl);
        } else {
          while (root.firstChild) root.removeChild(root.firstChild);
          root.appendChild(renderedEl);
        }
      }
    },

    destroy(): void {
      // Call onDestroyFns attached to the mounted element by component()
      if (mountedEl) {
        const destroyFns = (mountedEl as unknown as Record<symbol, Array<() => void>>)[DESTROY_KEY];
        if (destroyFns) {
          for (const fn of destroyFns) fn();
        }
      }
      css.destroy();
      timers.destroy();
    },

    criticalCSS(cssStr: string): void {
      css.criticalCSS(cssStr);
    },

    criticalStylesheet(href: string): void {
      css.criticalStylesheet(href);
    },

    safeSetInterval(fn: () => void, ms: number): number {
      return timers.safeSetInterval(fn, ms) as unknown as number;
    },

    safeClearInterval(id: number): void {
      timers.safeClearInterval(id as unknown as ReturnType<typeof setInterval>);
    },

    safeSetTimeout(fn: () => void, ms: number): number {
      return timers.safeSetTimeout(fn, ms) as unknown as number;
    },

    safeClearTimeout(id: number): void {
      timers.safeClearTimeout(id as unknown as ReturnType<typeof setTimeout>);
    },
  };
}
