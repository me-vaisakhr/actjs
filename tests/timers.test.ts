import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimerManager } from '../src/timers.js';

describe('TimerManager', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('safeSetInterval fires callback on interval', () => {
    const mgr = new TimerManager();
    const fn = vi.fn();
    mgr.safeSetInterval(fn, 100);
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(3);
    mgr.destroy();
  });

  it('safeClearInterval stops the interval', () => {
    const mgr = new TimerManager();
    const fn = vi.fn();
    const id = mgr.safeSetInterval(fn, 100);
    vi.advanceTimersByTime(150);
    mgr.safeClearInterval(id);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('safeSetTimeout fires once after delay', () => {
    const mgr = new TimerManager();
    const fn = vi.fn();
    mgr.safeSetTimeout(fn, 200);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
    mgr.destroy();
  });

  it('safeClearTimeout prevents the timeout', () => {
    const mgr = new TimerManager();
    const fn = vi.fn();
    const id = mgr.safeSetTimeout(fn, 200);
    mgr.safeClearTimeout(id);
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();
  });

  it('destroy() clears all intervals and timeouts', () => {
    const mgr = new TimerManager();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    mgr.safeSetInterval(fn1, 100);
    mgr.safeSetTimeout(fn2, 200);
    mgr.destroy();
    vi.advanceTimersByTime(500);
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
  });

  it('destroy() is idempotent', () => {
    const mgr = new TimerManager();
    mgr.safeSetInterval(vi.fn(), 100);
    mgr.destroy();
    expect(() => mgr.destroy()).not.toThrow();
  });
});
