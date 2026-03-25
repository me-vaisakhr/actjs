import { describe, it, expect, vi } from 'vitest';
import { signal, computed, batch, setCurrentObserver, getCurrentObserver } from '../src/signal.js';
import type { Effect } from '../src/types.js';

describe('signal', () => {
  it('returns initial value', () => {
    const [count] = signal(0);
    expect(count()).toBe(0);
  });

  it('updates value with direct value', () => {
    const [count, setCount] = signal(0);
    setCount(5);
    expect(count()).toBe(5);
  });

  it('updates value with updater function', () => {
    const [count, setCount] = signal(10);
    setCount(prev => prev + 1);
    expect(count()).toBe(11);
  });

  it('does not notify subscribers when value is unchanged (Object.is)', () => {
    const [count, setCount] = signal(42);
    const run = vi.fn();
    const effect: Effect = { run, deps: new Set() };
    setCurrentObserver(effect);
    count(); // subscribe
    setCurrentObserver(null);

    setCount(42); // same value — should not notify
    expect(run).not.toHaveBeenCalled();
  });

  it('notifies subscribers on value change', () => {
    const [count, setCount] = signal(0);
    const run = vi.fn();
    const effect: Effect = { run, deps: new Set() };
    setCurrentObserver(effect);
    count(); // subscribe
    setCurrentObserver(null);

    setCount(1);
    expect(run).toHaveBeenCalledOnce();
  });

  it('unsubscribes when deps are cleaned', () => {
    const [count, setCount] = signal(0);
    const run = vi.fn();
    const effect: Effect = {
      run() {
        run();
      },
      deps: new Set(),
    };

    setCurrentObserver(effect);
    count();
    setCurrentObserver(null);

    // Manually clean deps as a real effect would before re-running
    for (const dep of effect.deps) {
      dep.delete(effect);
    }
    effect.deps.clear();

    setCount(99);
    expect(run).not.toHaveBeenCalled();
  });

  it('supports multiple independent subscribers', () => {
    const [val, setVal] = signal('a');
    const run1 = vi.fn();
    const run2 = vi.fn();

    const e1: Effect = { run: run1, deps: new Set() };
    const e2: Effect = { run: run2, deps: new Set() };

    setCurrentObserver(e1);
    val();
    setCurrentObserver(e2);
    val();
    setCurrentObserver(null);

    setVal('b');
    expect(run1).toHaveBeenCalledOnce();
    expect(run2).toHaveBeenCalledOnce();
  });

  it('getCurrentObserver returns null by default', () => {
    expect(getCurrentObserver()).toBeNull();
  });

  it('setCurrentObserver changes the observer', () => {
    const effect: Effect = { run: vi.fn(), deps: new Set() };
    setCurrentObserver(effect);
    expect(getCurrentObserver()).toBe(effect);
    setCurrentObserver(null);
    expect(getCurrentObserver()).toBeNull();
  });
});

describe('signal equality option', () => {
  it('uses custom equals fn — skips notification when equal', () => {
    const run = vi.fn();
    const [arr, setArr] = signal([1, 2], {
      equals: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    });
    const eff: Effect = { run, deps: new Set() };
    setCurrentObserver(eff);
    arr();
    setCurrentObserver(null);

    setArr([1, 2]); // same contents — should not notify
    expect(run).not.toHaveBeenCalled();
  });

  it('uses custom equals fn — notifies when not equal', () => {
    const run = vi.fn();
    const [arr, setArr] = signal([1, 2], {
      equals: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    });
    const eff: Effect = { run, deps: new Set() };
    setCurrentObserver(eff);
    arr();
    setCurrentObserver(null);

    setArr([1, 3]); // different — should notify
    expect(run).toHaveBeenCalledOnce();
  });

  it('equals: false always notifies even for same value', () => {
    const run = vi.fn();
    const [count, setCount] = signal(0, { equals: false });
    const eff: Effect = { run, deps: new Set() };
    setCurrentObserver(eff);
    count();
    setCurrentObserver(null);

    setCount(0); // same value — but equals: false means always notify
    expect(run).toHaveBeenCalledOnce();
  });
});

describe('batch', () => {
  it('defers notifications until batch completes', () => {
    const [a, setA] = signal(0);
    const [b, setB] = signal(0);
    const run = vi.fn();
    const eff: Effect = { run, deps: new Set() };

    setCurrentObserver(eff);
    a(); b(); // subscribe to both
    setCurrentObserver(null);

    batch(() => {
      setA(1);
      setB(1);
    });

    // Both writes coalesced — effect ran once
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('notifies each change separately without batch', () => {
    const [a, setA] = signal(0);
    const [b, setB] = signal(0);
    const run = vi.fn();
    const eff: Effect = { run, deps: new Set() };

    setCurrentObserver(eff);
    a(); b();
    setCurrentObserver(null);

    setA(1);
    setB(1);

    expect(run).toHaveBeenCalledTimes(2);
  });

  it('supports nested batches', () => {
    const [a, setA] = signal(0);
    const run = vi.fn();
    const eff: Effect = { run, deps: new Set() };

    setCurrentObserver(eff);
    a();
    setCurrentObserver(null);

    batch(() => {
      batch(() => { setA(1); });
      setA(2);
    });

    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe('computed', () => {
  it('returns derived value', () => {
    const [count] = signal(3);
    const doubled = computed(() => count() * 2);
    expect(doubled()).toBe(6);
  });

  it('re-computes when dependency changes', () => {
    const [count, setCount] = signal(2);
    const doubled = computed(() => count() * 2);
    expect(doubled()).toBe(4);
    setCount(5);
    expect(doubled()).toBe(10);
  });

  it('caches value between reads (no unnecessary re-runs)', () => {
    const fn = vi.fn((x: number) => x * 2);
    const [count] = signal(3);
    const doubled = computed(() => fn(count()));

    doubled();
    doubled();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('tracks multiple signals', () => {
    const [a, setA] = signal(1);
    const [b, setB] = signal(2);
    const sum = computed(() => a() + b());

    expect(sum()).toBe(3);
    setA(10);
    expect(sum()).toBe(12);
    setB(20);
    expect(sum()).toBe(30);
  });

  it('notifies outer effect when computed invalidates', () => {
    const [count, setCount] = signal(1);
    const doubled = computed(() => count() * 2);
    const run = vi.fn();
    const effect: Effect = { run, deps: new Set() };

    setCurrentObserver(effect);
    doubled(); // subscribe outer effect to computed
    setCurrentObserver(null);

    setCount(2); // invalidates computed → should trigger effect
    expect(run).toHaveBeenCalledOnce();
  });

  it('computed on computed works correctly', () => {
    const [x, setX] = signal(2);
    const doubled = computed(() => x() * 2);
    const quadrupled = computed(() => doubled() * 2);

    expect(quadrupled()).toBe(8);
    setX(3);
    expect(quadrupled()).toBe(12);
  });
});
