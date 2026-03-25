import { setCurrentObserver, getCurrentObserver } from './signal.js';
import { setCurrentSetup, createSetupContext } from './context.js';
import { applyHead, renderHeadToString } from './head.js';
import { reconcileChildren } from './diff.js';
import { makeScheduler } from './scheduler.js';
import { isSSRMode, setSSRHeadOutput } from './ssr-context.js';
import type { ComponentOptions, ComponentProps, RenderFn } from './types.js';
import type { Effect } from './types.js';
import { componentDestroyRegistry } from './component-registry.js';

/** Symbol key used to attach onDestroyFns to a component container. */
export const DESTROY_KEY: unique symbol = Symbol('actjs.destroy');

/**
 * Define a stateful component.
 * setup() runs ONCE — call signal(), onInit(), onMount(), onDestroy(), useHead() here.
 * setup() returns a render fn that re-runs when any subscribed signal changes.
 * options.hydrate controls island strategy (default: 'static').
 *
 * @example
 * const Counter = component(() => {
 *   const [count, setCount] = signal(0);
 *   return () => (
 *     <button onClick={() => setCount(n => n + 1)}>
 *       Clicked {count()} times
 *     </button>
 *   );
 * }, { hydrate: 'interactive' });
 */
export function component<P extends object = object>(
  setup: (props: P & ComponentProps<P>) => RenderFn,
  options: ComponentOptions = {},
): (props?: P & ComponentProps<P>) => Element {
  const hydrateStrategy = options.hydrate ?? 'static';

  return function mountComponent(props?: P & ComponentProps<P>): Element {
    const mergedProps = (props ?? {}) as P & ComponentProps<P>;

    // Container element for this component instance
    const container = document.createElement('div');
    container.setAttribute('data-component', '');
    if (hydrateStrategy !== 'static') {
      container.setAttribute('data-hydrate', hydrateStrategy);
    }

    // Stable owner object for head tracking
    const owner: object = {};

    // Run setup inside the context
    const ctx = createSetupContext();
    setCurrentSetup(ctx);
    let renderFn: RenderFn;
    try {
      renderFn = setup(mergedProps);
    } finally {
      setCurrentSetup(null);
    }

    // Attach destroy fns so app.ts can clean up
    (container as unknown as Record<symbol, Array<() => void>>)[DESTROY_KEY] = ctx.onDestroyFns;
    // Register in shared registry so the DOM reconciler can call destroy when removing
    componentDestroyRegistry.set(container, ctx.onDestroyFns);

    // The Effect that re-runs render when signals change
    const renderEffect: Effect = {
      deps: new Set(),
      run: () => scheduleRerender(),
    };

    function doRender(): void {
      // Clean up previous signal subscriptions
      for (const dep of renderEffect.deps) {
        dep.delete(renderEffect);
      }
      renderEffect.deps.clear();

      // Run render fn in tracking context
      const prev = getCurrentObserver();
      setCurrentObserver(renderEffect);
      let result: ReturnType<RenderFn>;
      try {
        result = renderFn();
      } catch (err) {
        console.error('[actjs] render error:', err);
        throw err;
      } finally {
        setCurrentObserver(prev);
      }

      // Apply head config
      if (ctx.headConfig) {
        if (isSSRMode()) {
          // SSR: capture head as HTML string for renderToString to read
          setSSRHeadOutput(renderHeadToString(ctx.headConfig));
        } else {
          applyHead(ctx.headConfig, owner);
        }
      }

      // Diff into container
      reconcileChildren(container, result ?? undefined);
    }

    const scheduleRerender = makeScheduler(doRender);

    function initAndMount(): void {
      doRender();
      // Run onInit (server + client) — log errors to console so they're never silently swallowed
      Promise.all(ctx.onInitFns.map((fn) => fn())).catch((err) => {
        console.error('[actjs] onInit error:', err);
      });
      // Run onMount (client only — skip during SSR)
      if (!isSSRMode()) {
        queueMicrotask(() => {
          for (const fn of ctx.onMountFns) fn();
        });
      }
    }

    if (hydrateStrategy === 'static') {
      initAndMount();
    } else if (hydrateStrategy === 'interactive') {
      initAndMount();
    } else if (hydrateStrategy === 'visible') {
      if (typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              observer.disconnect();
              initAndMount();
            }
          }
        });
        observer.observe(container);
      } else {
        initAndMount();
      }
    }

    return container;
  };
}

export { component as defineComponent };
