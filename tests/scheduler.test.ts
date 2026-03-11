import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeScheduler } from '../src/scheduler.js';

const flushMicrotasks = () => new Promise<void>(resolve => queueMicrotask(resolve));

describe('makeScheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls renderFn after microtask', async () => {
    const renderFn = vi.fn();
    const schedule = makeScheduler(renderFn);

    schedule();
    expect(renderFn).not.toHaveBeenCalled();

    await flushMicrotasks();
    expect(renderFn).toHaveBeenCalledOnce();
  });

  it('batches multiple calls into one render', async () => {
    const renderFn = vi.fn();
    const schedule = makeScheduler(renderFn);

    schedule();
    schedule();
    schedule();

    await flushMicrotasks();
    expect(renderFn).toHaveBeenCalledOnce();
  });

  it('allows scheduling again after the first render fires', async () => {
    const renderFn = vi.fn();
    const schedule = makeScheduler(renderFn);

    schedule();
    await flushMicrotasks();
    expect(renderFn).toHaveBeenCalledTimes(1);

    schedule();
    await flushMicrotasks();
    expect(renderFn).toHaveBeenCalledTimes(2);
  });

  it('does not call renderFn without scheduling', async () => {
    const renderFn = vi.fn();
    makeScheduler(renderFn);
    await flushMicrotasks();
    expect(renderFn).not.toHaveBeenCalled();
  });
});
