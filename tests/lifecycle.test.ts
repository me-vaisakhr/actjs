import { describe, it, expect, afterEach } from 'vitest';
import { onInit, onMount, onDestroy } from '../src/lifecycle.js';
import { setCurrentSetup, createSetupContext } from '../src/context.js';

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
