import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { onInit, onMount, onDestroy, effect, useInterval, useTimeout } from '../src/lifecycle.js';
import { setCurrentSetup, createSetupContext } from '../src/context.js';
import { signal } from '../src/signal.js';

afterEach(() => {
  setCurrentSetup(null);
});

describe('lifecycle hooks', () => {
  describe('onInit', () => {
    it('registers fn in onInitFns', () => {
      const ctx = createSetupContext();
      setCurrentSetup(ctx);
      const fn = () => {};
      onInit(fn);
      expect(ctx.onInitFns).toContain(fn);
    });

    it('throws when called outside setup', () => {
      expect(() => onInit(() => {})).toThrow('onInit() must be called inside a component setup function.');
    });

    it('supports async fn', () => {
      const ctx = createSetupContext();
      setCurrentSetup(ctx);
      const fn = async () => {};
      onInit(fn);
      expect(ctx.onInitFns).toContain(fn);
    });
  });

  describe('onMount', () => {
    it('registers fn in onMountFns', () => {
      const ctx = createSetupContext();
      setCurrentSetup(ctx);
      const fn = () => {};
      onMount(fn);
      expect(ctx.onMountFns).toContain(fn);
    });

    it('throws when called outside setup', () => {
      expect(() => onMount(() => {})).toThrow('onMount() must be called inside a component setup function.');
    });
  });

  describe('onDestroy', () => {
    it('registers fn in onDestroyFns', () => {
      const ctx = createSetupContext();
      setCurrentSetup(ctx);
      const fn = () => {};
      onDestroy(fn);
      expect(ctx.onDestroyFns).toContain(fn);
    });

    it('throws when called outside setup', () => {
      expect(() => onDestroy(() => {})).toThrow('onDestroy() must be called inside a component setup function.');
    });
  });

  describe('useInterval', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('registers mount and destroy fns in context', () => {
      const ctx = createSetupContext();
      setCurrentSetup(ctx);
      useInterval(() => {}, 1000);
      expect(ctx.onMountFns).toHaveLength(1);
      expect(ctx.onDestroyFns).toHaveLength(1);
    });

    it('starts interval on mount and fires callback', () => {
      const ctx = createSetupContext();
      setCurrentSetup(ctx);
      const fn = vi.fn();
      useInterval(fn, 500);
      ctx.onMountFns[0]!();
      vi.advanceTimersByTime(1500);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('clears interval on destroy', () => {
      const ctx = createSetupContext();
      setCurrentSetup(ctx);
      const fn = vi.fn();
      useInterval(fn, 500);
      ctx.onMountFns[0]!();
      vi.advanceTimersByTime(500);
      ctx.onDestroyFns[0]!();
      vi.advanceTimersByTime(1000);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws when called outside setup', () => {
      expect(() => useInterval(() => {}, 1000)).toThrow('useInterval() must be called inside a component setup function.');
    });
  });

  describe('useTimeout', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('registers mount and destroy fns in context', () => {
      const ctx = createSetupContext();
      setCurrentSetup(ctx);
      useTimeout(() => {}, 1000);
      expect(ctx.onMountFns).toHaveLength(1);
      expect(ctx.onDestroyFns).toHaveLength(1);
    });

    it('fires callback once after delay', () => {
      const ctx = createSetupContext();
      setCurrentSetup(ctx);
      const fn = vi.fn();
      useTimeout(fn, 300);
      ctx.onMountFns[0]!();
      vi.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(1000);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('cancels timeout on destroy before it fires', () => {
      const ctx = createSetupContext();
      setCurrentSetup(ctx);
      const fn = vi.fn();
      useTimeout(fn, 500);
      ctx.onMountFns[0]!();
      ctx.onDestroyFns[0]!();
      vi.advanceTimersByTime(1000);
      expect(fn).not.toHaveBeenCalled();
    });

    it('throws when called outside setup', () => {
      expect(() => useTimeout(() => {}, 1000)).toThrow('useTimeout() must be called inside a component setup function.');
    });
  });

  describe('effect', () => {
    it('runs immediately and tracks signal deps', () => {
      const [count, setCount] = signal(0);
      const spy = vi.fn();
      const dispose = effect(() => { spy(count()); });
      expect(spy).toHaveBeenCalledWith(0);
      setCount(1);
      expect(spy).toHaveBeenCalledWith(1);
      expect(spy).toHaveBeenCalledTimes(2);
      dispose();
    });

    it('stops reacting after dispose', () => {
      const [count, setCount] = signal(0);
      const spy = vi.fn();
      const dispose = effect(() => { spy(count()); });
      dispose();
      setCount(99);
      expect(spy).toHaveBeenCalledTimes(1); // only the initial run
    });

    it('calls cleanup fn before re-running', () => {
      const [count, setCount] = signal(0);
      const cleanup = vi.fn();
      effect(() => {
        count(); // track
        return cleanup;
      });
      setCount(1);
      expect(cleanup).toHaveBeenCalledTimes(1);
      setCount(2);
      expect(cleanup).toHaveBeenCalledTimes(2);
    });

    it('calls cleanup fn on dispose', () => {
      const [count] = signal(0);
      const cleanup = vi.fn();
      const dispose = effect(() => {
        count();
        return cleanup;
      });
      dispose();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('auto-disposes when inside a component setup on destroy', () => {
      const [count, setCount] = signal(0);
      const spy = vi.fn();
      const ctx = createSetupContext();
      setCurrentSetup(ctx);
      effect(() => { spy(count()); });
      setCurrentSetup(null);

      expect(spy).toHaveBeenCalledTimes(1);
      // Simulate component destroy
      for (const fn of ctx.onDestroyFns) fn();
      setCount(99);
      expect(spy).toHaveBeenCalledTimes(1); // no more calls after destroy
    });

    it('re-entry guard prevents infinite loops', () => {
      const [count, setCount] = signal(0);
      const spy = vi.fn();
      const dispose = effect(() => {
        spy(count());
        if (count() < 3) setCount(c => c + 1); // would loop without guard
      });
      // Should run at most once per signal change, not infinitely
      expect(spy.mock.calls.length).toBeLessThanOrEqual(5);
      dispose();
    });
  });

  it('multiple hooks can be registered', () => {
    const ctx = createSetupContext();
    setCurrentSetup(ctx);
    const fn1 = () => {};
    const fn2 = () => {};
    onInit(fn1);
    onInit(fn2);
    expect(ctx.onInitFns).toEqual([fn1, fn2]);
  });
});
