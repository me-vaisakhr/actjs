import { describe, it, expect, beforeEach } from 'vitest';
import { globalSignal, _clearGlobalSignals } from '../src/global-signal.js';

beforeEach(() => {
  _clearGlobalSignals();
});

describe('globalSignal', () => {
  it('returns a getter/setter pair', () => {
    const [theme] = globalSignal('theme', 'light');
    expect(theme()).toBe('light');
  });

  it('same key returns same signal instance', () => {
    const [, setTheme] = globalSignal('theme', 'light');
    setTheme('dark');
    const [theme2] = globalSignal('theme', 'light'); // initialValue ignored
    expect(theme2()).toBe('dark');
  });

  it('different keys are independent', () => {
    const [theme] = globalSignal('theme', 'light');
    const [lang] = globalSignal('lang', 'en');
    expect(theme()).toBe('light');
    expect(lang()).toBe('en');
  });

  it('setter with updater function works', () => {
    const [count, setCount] = globalSignal('count', 0);
    setCount(prev => prev + 1);
    expect(count()).toBe(1);
  });

  it('initialValue is ignored for existing key', () => {
    globalSignal('key', 'first');
    const [val] = globalSignal('key', 'second');
    expect(val()).toBe('first');
  });
});
