Add a new utility hook to actjs: $ARGUMENTS

A "hook" is a function that starts with `use`, lives in `src/hooks.ts`, and is called inside a component's setup function.

---

## Rules for all actjs hooks

1. **Name**: `use<Name>` — camelCase, starts with `use`
2. **SSR-safe**: if the hook touches browser APIs (`window`, `localStorage`, `matchMedia`, `addEventListener`), guard with `if (typeof window === 'undefined') return <sensible default>`
3. **Cleanup**: any event listeners, timers, or subscriptions MUST be removed via `onDestroy()` imported from `./lifecycle.js`
4. **Signals only**: use `signal()` from `./signal.js` for reactive state — no external state
5. **JSDoc @example**: show a real component using the hook (under 10 lines)
6. **No side effects at module level** — all setup happens inside the function body

## Template

```ts
import { signal } from './signal.js';
import { onDestroy } from './lifecycle.js';
import type { Signal } from './types.js';

/**
 * [What it does in one sentence.]
 * SSR-safe — returns [default] when window is unavailable.
 *
 * @example
 * const MyComp = component(() => {
 *   const value = useMyHook(arg);
 *   return () => <div>{value()}</div>;
 * });
 */
export function useMyHook(arg: ArgType): ReturnType {
  if (typeof window === 'undefined') return <ssr-safe default>;

  const [value, setValue] = signal<ValueType>(initialValue);

  // set up listener / timer / subscription
  const handler = () => { setValue(/* ... */); };
  window.addEventListener('event', handler);

  onDestroy(() => {
    window.removeEventListener('event', handler);
  });

  return value;  // return the getter (or [getter, setter] tuple)
}
```

## After implementing

1. Export from `src/index.ts`
2. Add tests in `tests/hooks.test.ts` covering:
   - Normal browser use
   - SSR mode (`typeof window === 'undefined'`)
   - Cleanup (verify listener/timer removed after destroy)
3. Add a JSDoc `@example` block
4. Run `npm run typecheck && npm test` — both must pass
